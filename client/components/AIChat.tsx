import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bot,
  Send,
  User as UserIcon,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore, ChatMessage, EMPTY_MESSAGES } from "@/stores/chatStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { API_BASE, joinApi } from "@/lib/api";

function formatMessage(t: string): string {
  if (!t) return "";
  let s = t.replace(/\r\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.replace(/([^\s])\n([^\s])/g, "$1$2");
  const PARA = "<<PARA>>";
  s = s.replace(/\n{2,}/g, PARA);
  s = s.replace(/\n/g, " ");
  s = s.replace(/[\t ]{2,}/g, " ").trim();
  s = s.replace(new RegExp(PARA, "g"), "\n\n");
  return s;
}

// Try to extract a JSON object/array from text (plain or fenced code block)
function extractJsonFromText(text: string): any | null {
  if (!text) return null;
  const codeBlockMatch =
    text.match(/```json\s*([\s\S]*?)\s*```/i) ||
    text.match(/```\s*([\s\S]*?)\s*```/i);
  const candidates: string[] = [];
  if (codeBlockMatch?.[1]) candidates.push(codeBlockMatch[1]);
  candidates.push(text);
  for (const c of candidates) {
    try {
      const trimmed = c.trim();
      if (!trimmed) continue;
      const parsed = JSON.parse(trimmed);
      return parsed;
    } catch {}
  }
  return null;
}

// Parse markdown table into columns and rows
function parseMarkdownTable(
  text: string,
): { columns: string[]; rows: any[] } | null {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const tableStart = lines.findIndex((l) => /\|/.test(l));
  if (tableStart < 0 || tableStart + 2 >= lines.length) return null;
  const header = lines[tableStart];
  const divider = lines[tableStart + 1];
  if (!/\|/.test(divider) || !/-{3,}/.test(divider)) return null;
  const cols = header
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);
  const rows: any[] = [];
  for (let i = tableStart + 2; i < lines.length; i++) {
    if (!/\|/.test(lines[i])) break;
    const cells = lines[i]
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    const row: any = {};
    cols.forEach((col, idx) => {
      row[col] = cells[idx] ?? "";
    });
    rows.push(row);
  }
  if (cols.length && rows.length) return { columns: cols, rows };
  return null;
}

function getStructuredTable(
  text: string,
): { columns: string[]; rows: any[] } | null {
  // 1) JSON with {type:'table', columns, rows} or {columns, rows} or array of objects
  const data = extractJsonFromText(text);
  if (data) {
    if (Array.isArray(data)) {
      const cols = Array.from(
        data.reduce<Set<string>>((s, r) => {
          Object.keys(r || {}).forEach((k) => s.add(k));
          return s;
        }, new Set<string>()),
      );
      return { columns: cols, rows: data };
    }
    if (data && typeof data === "object") {
      if (
        Array.isArray((data as any).rows) &&
        ((data as any).columns || (data as any).headers)
      ) {
        const columns = (data as any).columns || (data as any).headers;
        return { columns, rows: (data as any).rows };
      }
      if ((data as any).type === "table" && Array.isArray((data as any).data)) {
        const rows = (data as any).data;
        const cols = Array.from(
          rows.reduce<Set<string>>((s: Set<string>, r: any) => {
            Object.keys(r || {}).forEach((k) => s.add(k));
            return s;
          }, new Set<string>()),
        );
        return { columns: cols, rows };
      }
    }
  }
  // 2) Markdown table fallback
  const md = parseMarkdownTable(text);
  if (md) return md;
  return null;
}

function renderMessageContent(text: string) {
  const table = getStructuredTable(text);
  if (table) {
    const { columns, rows } = table;
    return (
      <div className="overflow-x-auto max-w-full">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="whitespace-nowrap">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col} className="whitespace-nowrap">
                    {String(row?.[col] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  return <>{formatMessage(text)}</>;
}

function getInitials(name?: string | null, email?: string | null) {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const getCandidateApiUrls = () => {
  return [joinApi("chat")];
};

const getCandidateResetUrls = () =>
  getCandidateApiUrls().map((u) => `${u.replace(/\/+$/, "")}/reset`);

async function tryResetBackend(accessToken?: string | null) {
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  // 1) Try explicit /reset endpoints
  for (const url of getCandidateResetUrls()) {
    try {
      const res = await fetch(url, { method: "POST", headers });
      if (res.ok) return true;
    } catch {}
  }

  // 2) Fallback: send a reset command payload to chat endpoints
  const payloads = [{ action: "reset" }, { reset: true }, { command: "reset" }];
  for (const url of getCandidateApiUrls()) {
    for (const body of payloads) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) return true;
      } catch {}
    }
  }
  return false;
}

type AIChatProps = {
  variant?: "inline" | "floating"; // inline: renders inside layout. floating: shows a button and opens as a panel
  height?: string; // Tailwind height class for inline variant (e.g. "h-[70vh]")
  page?: boolean; // page mode renders full-viewport without overlay and without depending on dashboard layout
  defaultOpen?: boolean; // open by default (useful for floating variant triggered via URL)
  showTrigger?: boolean; // show the floating trigger button (for floating variant)
};

export default function AIChat({
  variant = "inline",
  height = "h-[70vh]",
  page = false,
  defaultOpen = false,
  showTrigger = true,
}: AIChatProps) {
  const [isOpen, setIsOpen] = useState(variant === "inline" || defaultOpen);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id || "anon";

  const initialMessages = useMemo<ChatMessage[]>(
    () => [
      {
        id: "welcome-1",
        role: "ai",
        text: "Hello! Welcome to your warehouse and business assistant. How can I help you today?",
      },
    ],
    [],
  );
  const selectMessages = useMemo(
    () => (s: any) => s.messagesByUser?.[userId] ?? EMPTY_MESSAGES,
    [userId],
  );
  const messages = useChatStore(selectMessages);
  const hydrated = useChatStore((s) => s.hydrated);
  const setStoreMessages = useChatStore((s) => s.setMessages);
  const replaceMessages = useChatStore((s) => s.replaceMessages);
  const clearFor = useChatStore((s) => s.clear);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping, scrollToBottom, isFullScreen]);

  // Initialize store with welcome message only after hydration if empty
  const initRef = useRef<{ userId: string | null }>({ userId: null });
  useEffect(() => {
    if (!hydrated) return;
    if (!user?.id) return; // wait for authenticated user to avoid saving under "anon"
    if (initRef.current.userId === userId) return; // already initialized for this user

    initRef.current.userId = userId;

    // 1) if we have data under "anon" from earlier render, migrate it to this user
    try {
      const state = useChatStore.getState();
      const anon = state.messagesByUser?.["anon"] || EMPTY_MESSAGES;
      const existing = state.messagesByUser?.[userId] || EMPTY_MESSAGES;
      if (anon.length && existing.length === 0) {
        setTimeout(() => {
          replaceMessages(anon, userId);
          clearFor("anon");
        }, 0);
        return;
      }
    } catch {}

    (async () => {
      // 2) migrate legacy single-key storage if present
      try {
        const legacyRaw = localStorage.getItem("chat-storage");
        if (legacyRaw) {
          const parsed = JSON.parse(legacyRaw || "null");
          const legacyMsgs = Array.isArray(parsed?.state?.messages)
            ? (parsed.state.messages as ChatMessage[])
            : [];
          if (legacyMsgs.length) {
            // only write if user has no messages yet
            const state = useChatStore.getState();
            const existing = state.messagesByUser?.[userId] || EMPTY_MESSAGES;
            if (existing.length === 0) {
              setTimeout(() => replaceMessages(legacyMsgs, userId), 0);
            }
            localStorage.removeItem("chat-storage");
            return;
          }
        }
      } catch {}

      // 3) ensure default welcome message only if user has no messages
      try {
        const state = useChatStore.getState();
        const existing = state.messagesByUser?.[userId] || EMPTY_MESSAGES;
        if (existing.length === 0) {
          setTimeout(() => replaceMessages(initialMessages, userId), 0);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, userId, user?.id]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen, isFullScreen]);

  const clearChat = useCallback(async () => {
    // Reset UI immediately
    replaceMessages(
      initialMessages.map((m) => ({ ...m, id: `welcome-${Date.now()}` })),
      userId,
    );
    setInput("");
    setIsTyping(false);
    setIsSending(false);
    abortRef.current?.abort();
    scrollToBottom(true);

    // Try notifying backend to reset server-side conversation (with fallbacks)
    try {
      await tryResetBackend(accessToken);
    } catch {
      // ignore errors; UI is already reset
    }
  }, [initialMessages, scrollToBottom, accessToken]);

  const typeWriter = useCallback(
    async (fullText: string) => {
      setIsTyping(true);
      const id = `ai-${Date.now()}`;
      setStoreMessages(
        (prev) => [...prev, { id, role: "ai", text: "" }],
        userId,
      );

      await new Promise<void>((resolve) => {
        let i = 0;
        const interval = setInterval(() => {
          i += 1;
          setStoreMessages(
            (prev) =>
              prev.map((m) =>
                m.id === id ? { ...m, text: fullText.slice(0, i) } : m,
              ),
            userId,
          );
          if (i >= fullText.length) {
            clearInterval(interval);
            resolve();
          }
        }, 10);
      });

      setIsTyping(false);
      scrollToBottom(true);
    },
    [scrollToBottom],
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isSending || isTyping) return;

      setIsSending(true);

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: content,
      };
      const aiId = `ai-${Date.now()}`;
      setStoreMessages(
        (prev) => [...prev, userMsg, { id: aiId, role: "ai", text: "" }],
        userId,
      );
      setInput("");
      setIsTyping(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const urls = getCandidateApiUrls();
        let success = false;
        let lastErr: unknown = null;
        for (const url of urls) {
          try {
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
              Accept: "text/plain, application/json;q=0.9, */*;q=0.8",
            };
            if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
            const payload = { massage: content, message: content };
            const res = await fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            if (res.body) {
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let acc = "";
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                acc += decoder.decode(value, { stream: true });
                setStoreMessages(
                  (prev) =>
                    prev.map((m) => (m.id === aiId ? { ...m, text: acc } : m)),
                  userId,
                );
                scrollToBottom(true);
              }
              if (acc.trim().length > 0) {
                success = true;
                break;
              }
            }

            const ct = res.headers.get("content-type") || "";
            if (!success) {
              let textResp: string | null = null;
              if (ct.includes("application/json")) {
                const data: any = await res.json();
                textResp =
                  (typeof data?.result === "string" && data.result) ||
                  (typeof data?.message === "string" && data.message) ||
                  (typeof data?.text === "string" && data.text) ||
                  null;
              } else {
                textResp = await res.text();
              }
              if (typeof textResp === "string" && textResp.length > 0) {
                setStoreMessages(
                  (prev) =>
                    prev.map((m) =>
                      m.id === aiId ? { ...m, text: textResp } : m,
                    ),
                  userId,
                );
                success = true;
                break;
              }
            }
            lastErr = new Error("Empty reply");
          } catch (e) {
            lastErr = e;
            continue;
          }
        }

        if (!success) {
          setStoreMessages(
            (prev) =>
              prev.map((m) =>
                m.id === aiId
                  ? {
                      ...m,
                      text: "Failed connect to Network. Please check your Internet connection!!",
                    }
                  : m,
              ),
            userId,
          );
        }
      } finally {
        setIsTyping(false);
        setIsSending(false);
      }
    },
    [input, isSending, isTyping, scrollToBottom, accessToken],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      // Ctrl+Enter or Cmd+Enter: insert new line
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? 0;
        const newValue =
          input.substring(0, start) + "\n" + input.substring(end);
        setInput(newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1;
        }, 0);
      } else if (!e.shiftKey) {
        // Regular Enter: send message
        e.preventDefault();
        handleSend();
      }
      // Shift+Enter: insert new line (default textarea behavior)
    }
  };

  // Auto-expand textarea height as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 200) + "px";
    }
  };

  const showFloatingButton =
    (variant === "floating" || page) && !isOpen && showTrigger;
  const containerFixed = isFullScreen || (variant === "floating" && isOpen);

  // Always full-screen on mobile
  useEffect(() => {
    if (isMobile && isOpen && !isFullScreen) setIsFullScreen(true);
  }, [isMobile, isOpen, isFullScreen]);

  // Exit fullscreen on Escape (desktop only)
  useEffect(() => {
    if (!isFullScreen || isMobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullScreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullScreen, isMobile]);

  // Lock page scroll only for fullscreen or dedicated chat page, not for floating dock
  useEffect(() => {
    const shouldLock = isFullScreen || (page && isOpen);
    if (shouldLock) {
      const body = document.body;
      const html = document.documentElement;

      // Store previous styles
      const prevBodyOverflow = body.style.overflow;
      const prevHtmlOverflow = html.style.overflow;
      const prevBodyPosition = body.style.position;
      const prevBodyWidth = body.style.width;
      const prevBodyHeight = body.style.height;
      const prevBodyTop = body.style.top;

      // Get current scroll position
      const scrollY = window.scrollY;

      // Lock scrolling on body/html
      body.style.overflow = "hidden";
      html.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";

      // Prevent scroll events that bubble up from outside the message list
      const handleWheel = (e: WheelEvent) => {
        if (listRef.current && !listRef.current.contains(e.target as Node)) {
          e.preventDefault();
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (listRef.current && !listRef.current.contains(e.target as Node)) {
          e.preventDefault();
        }
      };

      document.addEventListener("wheel", handleWheel, { passive: false });
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });

      return () => {
        body.style.overflow = prevBodyOverflow;
        html.style.overflow = prevHtmlOverflow;
        body.style.position = prevBodyPosition;
        body.style.width = prevBodyWidth;
        body.style.height = prevBodyHeight;
        body.style.top = prevBodyTop;

        document.removeEventListener("wheel", handleWheel);
        document.removeEventListener("touchmove", handleTouchMove);

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, isFullScreen, page]);

  return (
    <>
      {showFloatingButton && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 lg:right-6 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] lg:bottom-6 h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg transition-transform hover:scale-110 z-50"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {isOpen && (
        <div
          className={cn(
            page
              ? "fixed inset-0 z-50 p-0 bg-background"
              : isFullScreen
                ? "fixed inset-0 z-50 p-0 bg-background"
                : variant === "floating"
                  ? "fixed right-4 lg:right-6 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] lg:bottom-6 z-50"
                  : "relative z-auto mt-6",
          )}
        >
          <Card
            className={cn(
              "border-0 shadow-lg overflow-hidden flex flex-col",
              page
                ? isFullScreen
                  ? "h-[100dvh] w-screen rounded-none"
                  : "h-[100dvh] w-screen rounded-none"
                : isFullScreen
                  ? "h-[100dvh] w-screen rounded-none"
                  : variant === "floating"
                    ? "w-[min(92vw,384px)] sm:w-[384px] h-[560px] rounded-3xl"
                    : cn("w-full", height, "rounded-3xl"),
            )}
          >
            <CardHeader className="relative border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 sticky top-0 z-10 px-6 pb-6 pt-[15px]">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Bot className="h-5 w-5" /> AI Chat
              </CardTitle>
              <div className="absolute right-2 top-2 flex gap-1">
                {!isMobile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (page) {
                        navigate("/dashboard?chat=open");
                        return;
                      }
                      navigate("/chat");
                    }}
                    className="h-8 w-8 rounded-full"
                    aria-label={page ? "Dock to dashboard" : "Open full screen"}
                  >
                    {page ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="h-8 w-8 rounded-full"
                  aria-label="Clear chat"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {(variant === "floating" || page) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullScreen(false);
                      if (page) {
                        // leave dedicated chat page
                        navigate("/dashboard");
                        return;
                      }
                      setIsOpen(false);
                    }}
                    className="h-8 w-8 rounded-full"
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 min-h-0">
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <div className="h-2 bg-gradient-to-b from-transparent to-black/0 dark:to-white/0" />
                <div
                  ref={listRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3 px-[11px] pb-0 space-y-3 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    overscrollBehavior: "contain",
                  }}
                >
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex gap-2",
                        m.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      {m.role === "ai" && (
                        <div className="mt-1 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl leading-relaxed shadow break-words whitespace-pre-wrap",
                          isFullScreen
                            ? "p-4 text-base max-w-[80%]"
                            : "p-3 text-sm",
                          m.role === "user"
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-white dark:bg-gray-800 border rounded-bl-md",
                        )}
                      >
                        {m.role === "ai"
                          ? renderMessageContent(m.text)
                          : formatMessage(m.text)}
                      </div>
                      {m.role === "user" && (
                        <Avatar className="mt-1 h-8 w-8">
                          <AvatarImage
                            src={user?.avatar || undefined}
                            alt={user?.name || user?.email || "User"}
                          />
                          <AvatarFallback className="bg-gray-500 text-white text-xs font-medium">
                            {getInitials(
                              user?.name || null,
                              user?.email || null,
                            )}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                        <span
                          className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                      AI is typing…
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    "flex-none border-t bg-background py-5 px-3",
                    containerFixed ? "sticky bottom-0" : "",
                  )}
                  style={
                    containerFixed
                      ? { bottom: "env(safe-area-inset-bottom)" }
                      : undefined
                  }
                >
                  <form
                    className="flex items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                  >
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={onKeyDown}
                      placeholder="Type your message…"
                      className="min-h-[48px] max-h-[200px] rounded-xl py-3 px-4 shadow-sm resize-none border-2 border-primary bg-white dark:bg-gray-900 text-base"
                      disabled={isSending || isTyping}
                      rows={1}
                    />
                    <Button
                      type="submit"
                      disabled={!input.trim() || isSending || isTyping}
                      className="h-12 w-12 rounded-xl"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

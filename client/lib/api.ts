export const API_BASE =
  import.meta.env.VITE_BACKEND_URL ?? "http://172.31.19.198:5002/api";

export function joinApi(path: string) {
  if (!path) return API_BASE;
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

function shouldSkipAuth(url: string) {
  try {
    const u = new URL(
      url,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost",
    );
    const p = u.pathname;
    return (
      p.includes("/auth/sign-in") ||
      p.includes("/auth/refresh") ||
      p.includes("/auth/logout")
    );
  } catch {
    return (
      url.includes("/auth/sign-in") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout")
    );
  }
}

let installOnce = false;
let refreshPromise: Promise<boolean> | null = null;

export function installAuthFetchInterceptor() {
  if (installOnce) return;
  installOnce = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init: RequestInit = {},
  ): Promise<Response> => {
    const url =
      typeof input === "string" ? input : ((input as any).url ?? String(input));
    const skip = shouldSkipAuth(url);
    const headers = new Headers(init.headers || {});

    try {
      if (!skip) {
        const { useAuthStore } = await import("@/stores/authStore");
        const token = useAuthStore.getState().accessToken;
        if (token && !headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      let res = await originalFetch(input, { ...init, headers });

      if (
        (res.status === 401 ||
          res.status === 403 ||
          res.status === 419 ||
          res.status === 498) &&
        !skip
      ) {
        if (!refreshPromise) {
          const { useAuthStore } = await import("@/stores/authStore");
          refreshPromise = useAuthStore
            .getState()
            .refreshTokens()
            .finally(() => {
              refreshPromise = null;
            });
        }
        const ok = await refreshPromise;
        if (ok) {
          const { useAuthStore } = await import("@/stores/authStore");
          const newToken = useAuthStore.getState().accessToken;
          if (newToken) headers.set("Authorization", `Bearer ${newToken}`);
          res = await originalFetch(input, { ...init, headers });
          if (
            res.status === 401 ||
            res.status === 403 ||
            res.status === 419 ||
            res.status === 498
          ) {
            useAuthStore.getState().logout();
          }
          return res;
        } else {
          const { useAuthStore } = await import("@/stores/authStore");
          useAuthStore.getState().logout();
        }
      }

      return res;
    } catch {
      return originalFetch(input, init);
    }
  };
}

// Extract a human-friendly error message from a fetch Response
export async function getErrorMessageFromResponse(
  res: Response,
): Promise<string> {
  try {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
        details?: string;
        [k: string]: any;
      } | null;
      if (body && typeof body === "object") {
        const msg = body.message || body.error || body.details;
        if (msg) return String(msg);
      }
    }

    const text = await res.text().catch(() => "");
    return text || res.statusText || `HTTP ${res.status}`;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

// Extract an error message from unknown error values
export function extractErrorMessage(
  err: unknown,
  fallback = "Something went wrong",
) {
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    (err as any).message
  ) {
    return String((err as any).message);
  }
  try {
    return JSON.stringify(err);
  } catch {
    return fallback;
  }
}

// Wrapper to fetch and parse JSON, throwing with backend message when not ok
export async function apiFetch<T = any>(
  pathOrUrl: string,
  init: RequestInit = {},
): Promise<T> {
  const url = /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : joinApi(pathOrUrl);
  const res = await fetch(url, init);
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res);
    throw new Error(msg);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

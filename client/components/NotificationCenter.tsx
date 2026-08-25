import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Bell, Check, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { API_BASE } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

type InventoryProduct = {
  id: string;
  name: string;
  stock: number;
  minStock: number;
};

type Notification = InventoryProduct & {
  type: "low-stock" | "out-of-stock";
};

const readStorageKey = (userId?: string) =>
  userId ? `notification-read:${userId}` : "notification-read:guest";

const getNumber = (...values: unknown[]) => {
  for (const value of values) {
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
};

export default function NotificationCenter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      const result = Array.isArray(data?.result) ? data.result : [];
      setProducts(
        result.map((product: any) => ({
          id: String(product.id),
          name: product.name || product.title || t("notifications.unknown_product"),
          stock: getNumber(
            product.stock,
            product.count,
            product.quantity,
            product.stockQuantity,
            product.inventory?.quantity,
          ),
          minStock: getNumber(
            product.minStock,
            product.min_stock,
            product.reorderPoint,
            product.reorder_point,
            product.settings?.minStock,
          ),
        })),
      );
    } catch {
      setProducts([]);
    }
  }, [t]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(readStorageKey(user?.id)) || "[]");
      setReadIds(Array.isArray(stored) ? stored : []);
    } catch {
      setReadIds([]);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const notifications = useMemo<Notification[]>(
    () =>
      products
        .filter((product) => product.stock === 0 || (product.minStock > 0 && product.stock <= product.minStock))
        .map((product) => ({
          ...product,
          type: product.stock === 0 ? "out-of-stock" : "low-stock",
        })),
    [products],
  );

  const unreadCount = notifications.filter((notification) => !readIds.includes(`${notification.type}:${notification.id}`)).length;

  const markRead = (notification: Notification) => {
    const id = `${notification.type}:${notification.id}`;
    if (readIds.includes(id)) return;
    const next = [...readIds, id];
    setReadIds(next);
    localStorage.setItem(readStorageKey(user?.id), JSON.stringify(next));
  };

  const markAllRead = () => {
    const next = notifications.map((notification) => `${notification.type}:${notification.id}`);
    setReadIds(next);
    localStorage.setItem(readStorageKey(user?.id), JSON.stringify(next));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("notifications.open")}
          className="h-10 w-10 rounded-xl relative group hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110"
        >
          <Bell className="h-4 w-4 group-hover:animate-pulse" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-business">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[calc(100vw-2rem)] max-w-sm p-0">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="font-semibold">{t("notifications.title")}</h2>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? t("notifications.unread", { count: unreadCount })
                : t("notifications.all_read")}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <Check className="mr-1.5 h-4 w-4" />
              {t("notifications.mark_all_read")}
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-[min(60vh,24rem)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50" />
              <p className="font-medium">{t("notifications.empty")}</p>
              <p className="text-sm text-muted-foreground">{t("notifications.empty_description")}</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const isRead = readIds.includes(`${notification.type}:${notification.id}`);
              const isOutOfStock = notification.type === "out-of-stock";
              return (
                <button
                  key={`${notification.type}:${notification.id}`}
                  type="button"
                  className={`flex w-full items-start gap-3 border-b p-4 text-left transition-colors hover:bg-muted/60 ${!isRead ? "bg-primary/[0.04]" : ""}`}
                  onClick={() => {
                    markRead(notification);
                    setOpen(false);
                    navigate("/warehouse");
                  }}
                >
                  <span className={`mt-0.5 rounded-full p-2 ${isOutOfStock ? "bg-red-100 text-red-600 dark:bg-red-950/40" : "bg-amber-100 text-amber-600 dark:bg-amber-950/40"}`}>
                    {isOutOfStock ? <PackageX className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      {t(isOutOfStock ? "notifications.out_of_stock" : "notifications.low_stock")}
                      {!isRead && <Badge className="h-5 px-1.5 text-[10px]">{t("notifications.new")}</Badge>}
                    </span>
                    <span className="mt-1 block truncate text-sm">{notification.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {t("notifications.stock_level", { count: notification.stock, minimum: notification.minStock })}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
        <Separator />
        <Button
          variant="ghost"
          className="w-full rounded-none rounded-b-md"
          onClick={() => {
            setOpen(false);
            navigate("/warehouse");
          }}
        >
          {t("notifications.view_inventory")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

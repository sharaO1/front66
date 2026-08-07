import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useRBACStore } from "@/stores/rbacStore";
import { API_BASE, apiFetch } from "@/lib/api";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Building2,
  Store,
  Globe,
  Phone,
  Mail,
  User,
  Calendar,
} from "lucide-react";
import DetailCard from "@/components/DetailCard";
import { useTranslation } from "react-i18next";
import { PaginationControls } from "@/components/ui/pagination";

interface Filial {
  id: string;
  name: string;
  type: "warehouse" | "retail" | "online" | string;
  address: string;
  city: string;
  country: string;
  phone?: string | null;
  email?: string | null;
  manager: string;
  status: "active" | "inactive" | "maintenance" | string;
  openingHours?: string | null;
  capacity?: number | null;
  currentStaff: number;
  createdAt: string;
  updatedAt: string;
}

interface FilialProduct {
  id: string;
  count: number;
  product: {
    id: string;
    name: string;
    sku?: string;
    location?: string;
    sellingPrice?: string | number;
  };
}

const mockFilials: Filial[] = [
  {
    id: "1",
    name: "Main Warehouse",
    type: "warehouse",
    address: "Central District, Building A",
    city: "Tashkent",
    country: "Uzbekistan",
    phone: "+998 71 123 4567",
    email: "warehouse@company.uz",
    manager: "John Smith",
    status: "active",
    openingHours: "24/7",
    capacity: 10000,
    currentStaff: 25,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-20",
  },
  {
    id: "2",
    name: "Downtown Retail Store",
    type: "retail",
    address: "Downtown Mall, Unit 15",
    city: "Tashkent",
    country: "Uzbekistan",
    phone: "+998 71 234 5678",
    email: "downtown@company.uz",
    manager: "Sarah Johnson",
    status: "active",
    openingHours: "09:00 - 21:00",
    capacity: 500,
    currentStaff: 8,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-18",
  },
  {
    id: "3",
    name: "North Branch",
    type: "retail",
    address: "North Plaza, Store 22",
    city: "Samarkand",
    country: "Uzbekistan",
    phone: "+998 66 345 6789",
    email: "north@company.uz",
    manager: "Mike Chen",
    status: "active",
    openingHours: "10:00 - 20:00",
    capacity: 300,
    currentStaff: 6,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },
  {
    id: "4",
    name: "Online Fulfillment Center",
    type: "online",
    address: "Industrial Park, Zone C",
    city: "Tashkent",
    country: "Uzbekistan",
    phone: "+998 71 456 7890",
    email: "online@company.uz",
    manager: "Alex Wilson",
    status: "active",
    openingHours: "24/7",
    capacity: 5000,
    currentStaff: 15,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-19",
  },
  {
    id: "5",
    name: "Bukhara Branch",
    type: "retail",
    address: "Historic Center, Building 12",
    city: "Bukhara",
    country: "Uzbekistan",
    phone: "+998 65 567 8901",
    email: "bukhara@company.uz",
    manager: "Emma Davis",
    status: "maintenance",
    openingHours: "10:00 - 19:00",
    capacity: 250,
    currentStaff: 4,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-10",
  },
];

export default function Filials() {
  const [filials, setFilials] = useState<Filial[]>(mockFilials);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filialPage, setFilialPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedFilial, setSelectedFilial] = useState<Filial | null>(null);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const [managerNames, setManagerNames] = useState<Record<string, string>>({});
  const [managerOptions, setManagerOptions] = useState<
    { id: string; name: string }[]
  >([]);

  // Products that belong to the selected filial
  const [filialProducts, setFilialProducts] = useState<FilialProduct[]>([]);
  const [isFilialProductsLoading, setIsFilialProductsLoading] = useState(false);
  const [filialProductsError, setFilialProductsError] = useState<string | null>(
    null,
  );

  const [newFilial, setNewFilial] = useState<Partial<Filial>>({
    name: "",
    type: "retail",
    address: "",
    city: "",
    country: "Uzbekistan",
    phone: "",
    email: "",
    manager: "",
    status: "active",
    openingHours: "",
    capacity: 0,
    currentStaff: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!isViewDialogOpen || !selectedFilial?.id) {
        if (mounted) setFilialProducts([]);
        return;
      }

      try {
        setIsFilialProductsLoading(true);
        setFilialProductsError(null);
        const res = await fetch(`${API_BASE}/filials/${selectedFilial.id}`, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok || !Array.isArray(json.result)) {
          throw new Error(json?.error || "Failed to load filial products");
        }
        const mapped: FilialProduct[] = json.result.map((r: any) => ({
          id: r.id,
          count: Number(r.count || 0),
          product: {
            id: r.product?.id || "",
            name: r.product?.name || "",
            sku: r.product?.sku || "",
            location: r.product?.location || "",
            sellingPrice: r.product?.sellingPrice ?? "",
          },
        }));
        if (mounted) setFilialProducts(mapped);
      } catch (e: any) {
        if (mounted)
          setFilialProductsError(
            e?.message || "Failed to load filial products",
          );
      } finally {
        if (mounted) setIsFilialProductsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [isViewDialogOpen, selectedFilial?.id, accessToken]);

  // Load available managers when dialogs are open (via RBAC store)
  const { users, loadUsers, currentUser } = useRBACStore();
  useEffect(() => {
    let mounted = true;
    const ensureManagers = async () => {
      if (!(isAddDialogOpen || isEditDialogOpen)) return;
      await loadUsers().catch(() => {});
      const userManagers = (users || [])
        .filter((u) => u.role === "manager")
        .map((u) => ({
          id: String(u.id),
          name: String(u.name || u.email || u.id),
        }));
      if (!mounted) return;
      setManagerOptions(userManagers);
      setManagerNames((prev) => ({
        ...prev,
        ...Object.fromEntries(userManagers.map((m) => [m.id, m.name])),
      }));
    };
    ensureManagers();
    return () => {
      mounted = false;
    };
  }, [isAddDialogOpen, isEditDialogOpen, loadUsers, users]);

  // Keep manager options in sync with RBAC users even outside the dialogs
  useEffect(() => {
    const userManagers = (users || [])
      .filter((u) => u.role === "manager")
      .map((u) => ({
        id: String(u.id),
        name: String(u.name || u.email || u.id),
      }));
    setManagerOptions(userManagers);
    setManagerNames((prev) => ({
      ...prev,
      ...Object.fromEntries(userManagers.map((m) => [m.id, m.name])),
    }));
  }, [users]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/filials`, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok || !Array.isArray(json.result)) {
          throw new Error(json?.error || "Failed to load filials");
        }
        const mapped: Filial[] = json.result.map((f: any) => {
          const managerNameCandidate =
            f.managerName ||
            f.manager_name ||
            (typeof f.manager === "object" &&
              (f.manager.fullName || f.manager.name)) ||
            f.managerFullName ||
            f.manager_full_name ||
            (f.managerUser && (f.managerUser.fullName || f.managerUser.name)) ||
            (f.managerProfile &&
              (f.managerProfile.fullName || f.managerProfile.name)) ||
            "";
          const managerFallbackId =
            f.managerId || f.manager_id || f.manager || "";
          const manager =
            (managerNameCandidate && String(managerNameCandidate)) ||
            String(managerFallbackId) ||
            "";
          return {
            id: f.id,
            name:
              f.name ||
              f.title ||
              f.filialName ||
              f.filial_name ||
              f.storeName ||
              f.branchName ||
              String(f.id),
            type: f.type || "warehouse",
            address: f.address || "",
            city: f.city || "",
            country: f.country || "",
            phone: f.phone ?? null,
            email: f.email ?? null,
            manager,
            status: f.status || "active",
            openingHours: f.openingHours ?? null,
            capacity: typeof f.capacity === "number" ? f.capacity : null,
            currentStaff: 0,
            createdAt: f.createdAt || "",
            updatedAt: f.updatedAt || "",
          } as Filial;
        });
        if (mounted) setFilials(mapped);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load filials");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [accessToken]);

  // Recompute each filial's currentStaff from users' filial assignments; fallback to /workers when users unavailable
  useEffect(() => {
    if (!Array.isArray(filials) || filials.length === 0) return;

    const normalize = (v: any) =>
      typeof v === "string"
        ? v.trim().toLowerCase()
        : String(v ?? "")
            .trim()
            .toLowerCase();

    const applyCounts = (
      idCount: Record<string, number>,
      nameCount: Record<string, number>,
    ) => {
      let changed = false;
      const updated = filials.map((f) => {
        const byId = idCount[String(f.id)] || 0;
        const byName = nameCount[normalize(f.name)] || 0;
        const nextCount = byId || byName;
        if (nextCount !== f.currentStaff) {
          changed = true;
          return { ...f, currentStaff: nextCount };
        }
        return f;
      });
      if (changed) setFilials(updated);
      return updated.some((f) => f.currentStaff > 0);
    };

    const buildFromArray = (arr: any[]) => {
      const idCount: Record<string, number> = {};
      const nameCount: Record<string, number> = {};
      for (const u of arr) {
        const fid =
          u?.filialId ??
          u?.filialID ??
          u?.storeId ??
          u?.branchId ??
          u?.locationId ??
          undefined;
        const fname =
          u?.filialName ??
          u?.location ??
          u?.locationName ??
          u?.storeName ??
          u?.branchName ??
          (typeof u?.filial === "object" ? u?.filial?.name : u?.filial) ??
          undefined;
        if (fid != null && fid !== "")
          idCount[String(fid)] = (idCount[String(fid)] || 0) + 1;
        if (fname)
          nameCount[normalize(String(fname))] =
            (nameCount[normalize(String(fname))] || 0) + 1;
      }
      return { idCount, nameCount };
    };

    const run = async () => {
      // 1) Try users (User Management)
      if (Array.isArray(users) && users.length > 0) {
        const { idCount, nameCount } = buildFromArray(users as any[]);
        const ok = applyCounts(idCount, nameCount);
        if (ok) return;
      }

      // 2) Fallback: employees (/workers)
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        const data = await apiFetch<any>("/workers", { headers }).catch(
          () => null,
        );
        const list: any[] =
          (data && Array.isArray(data.result) && data.result) ||
          (Array.isArray(data) ? data : []);
        if (list.length) {
          const { idCount, nameCount } = buildFromArray(list);
          applyCounts(idCount, nameCount);
        }
      } catch {
        // ignore network errors silently
      }
    };

    // Only fetch when counts are zero or users are empty
    const allZero = filials.every((f) => !f.currentStaff);
    if (allZero) run();
  }, [users, filials, accessToken]);

  const isIdLike = (v: string) =>
    typeof v === "string" &&
    !v.includes(" ") &&
    !/[.@]/.test(v) &&
    v.length >= 6;
  const getManagerDisplay = (v: string) => managerNames[v] || v;

  // Resolve a stored manager value (id or name) to a manager user id if possible
  const resolveManagerId = (value: string | undefined | null) => {
    if (!value) return undefined;
    const str = String(value).trim();
    if (isIdLike(str)) return str;
    const match = managerOptions.find(
      (m) => m.name.trim().toLowerCase() === str.toLowerCase(),
    );
    return match?.id;
  };

  // Build a set of assigned manager ids across all filials
  const getAssignedManagerIds = () => {
    const set = new Set<string>();
    for (const f of filials) {
      const id = resolveManagerId(f.manager);
      if (id) set.add(id);
    }
    return set;
  };

  useEffect(() => {
    const ids = Array.from(
      new Set(
        filials
          .map((f) => f.manager)
          .filter((v) => isIdLike(v) && !managerNames[v]),
      ),
    );
    if (ids.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const id of ids) {
        try {
          const res = await fetch(
            `${API_BASE}/users/${encodeURIComponent(id)}`,
            {
              headers: {
                ...(accessToken
                  ? { Authorization: `Bearer ${accessToken}` }
                  : {}),
                "Content-Type": "application/json",
              },
            },
          );
          const json = await res.json().catch(() => null);
          if (!cancelled && res.ok && json?.ok && json?.result) {
            const u = json.result as any;
            const name =
              [u.firstName, u.lastName].filter(Boolean).join(" ") ||
              u.username ||
              u.name ||
              u.email ||
              id;
            setManagerNames((prev) => ({ ...prev, [id]: String(name) }));
          }
        } catch {}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filials, accessToken, managerNames]);

  useEffect(() => {
    setFilialPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  const filteredFilials = filials.filter((filial) => {
    const matchesSearch =
      filial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filial.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filial.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || filial.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || filial.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const paginatedFilials = filteredFilials.slice((filialPage - 1) * 10, filialPage * 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t("filials.statuses.active")}
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {t("filials.statuses.inactive")}
          </Badge>
        );
      case "maintenance":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            {t("filials.statuses.maintenance")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("filials.unknown")}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "warehouse":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <Building2 className="w-3 h-3 mr-1" />
            {t("filials.types.warehouse")}
          </Badge>
        );
      case "retail":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <Store className="w-3 h-3 mr-1" />
            {t("filials.types.retail")}
          </Badge>
        );
      case "online":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            <Globe className="w-3 h-3 mr-1" />
            {t("filials.types.online")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("filials.unknown")}</Badge>;
    }
  };

  const formatPrice = (v: any) => {
    if (v === null || v === undefined || v === "") return "-";
    const n = Number(v);
    if (isNaN(n)) return String(v);
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const addFilial = () => {
    if (
      !newFilial.name ||
      !newFilial.address ||
      !newFilial.city ||
      !newFilial.manager
    ) {
      toast({
        title: t("common.error"),
        description: t("filials.required_fields_error"),
        variant: "destructive",
      });
      return;
    }

    const filial: Filial = {
      id: Date.now().toString(),
      name: newFilial.name!,
      type: newFilial.type as "warehouse" | "retail" | "online",
      address: newFilial.address!,
      city: newFilial.city!,
      country: newFilial.country || "Uzbekistan",
      phone: newFilial.phone,
      email: newFilial.email,
      manager: newFilial.manager!,
      status: newFilial.status as "active" | "inactive" | "maintenance",
      openingHours: newFilial.openingHours,
      capacity: newFilial.capacity || 0,
      currentStaff: newFilial.currentStaff || 0,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setFilials([...filials, filial]);
    setNewFilial({
      name: "",
      type: "retail",
      address: "",
      city: "",
      country: "Uzbekistan",
      phone: "",
      email: "",
      manager: "",
      status: "active",
      openingHours: "",
      capacity: 0,
      currentStaff: 0,
    });
    setIsAddDialogOpen(false);

    toast({
      title: t("filials.toast.added_title"),
      description: t("filials.toast.added_desc", { name: filial.name }),
    });
  };

  const editFilial = () => {
    if (
      !editingFilial ||
      !newFilial.name ||
      !newFilial.address ||
      !newFilial.city ||
      !newFilial.manager
    ) {
      toast({
        title: t("common.error"),
        description: t("filials.required_fields_error"),
        variant: "destructive",
      });
      return;
    }

    const updatedFilial: Filial = {
      ...editingFilial,
      name: newFilial.name!,
      type: newFilial.type as "warehouse" | "retail" | "online",
      address: newFilial.address!,
      city: newFilial.city!,
      country: newFilial.country || "Uzbekistan",
      phone: newFilial.phone,
      email: newFilial.email,
      manager: newFilial.manager!,
      status: newFilial.status as "active" | "inactive" | "maintenance",
      openingHours: newFilial.openingHours,
      capacity: newFilial.capacity || 0,
      currentStaff: newFilial.currentStaff || 0,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setFilials(
      filials.map((f) => (f.id === editingFilial.id ? updatedFilial : f)),
    );
    setNewFilial({
      name: "",
      type: "retail",
      address: "",
      city: "",
      country: "Uzbekistan",
      phone: "",
      email: "",
      manager: "",
      status: "active",
      openingHours: "",
      capacity: 0,
      currentStaff: 0,
    });
    setEditingFilial(null);
    setIsEditDialogOpen(false);

    toast({
      title: t("filials.toast.updated_title"),
      description: t("filials.toast.updated_desc", {
        name: updatedFilial.name,
      }),
    });
  };

  const deleteFilial = (filialId: string) => {
    const filial = filials.find((f) => f.id === filialId);
    if (!filial) return;

    setFilials(filials.filter((f) => f.id !== filialId));

    toast({
      title: t("filials.toast.deleted_title"),
      description: t("filials.toast.deleted_desc", { name: filial.name }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("filials.title")}
          </h1>
          <p className="text-muted-foreground">{t("filials.subtitle")}</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("filials.add_filial")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("filials.add_new_filial")}</DialogTitle>
              <DialogDescription>
                {t("filials.add_description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("common.name")} *</Label>
                  <Input
                    id="name"
                    placeholder={t("filials.placeholders.store_name")}
                    value={newFilial.name}
                    onChange={(e) =>
                      setNewFilial({ ...newFilial, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">{t("filials.type")} *</Label>
                  <Select
                    value={newFilial.type}
                    onValueChange={(value) =>
                      setNewFilial({
                        ...newFilial,
                        type: value as "warehouse" | "retail" | "online",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("filials.select_type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouse">
                        {t("filials.types.warehouse")}
                      </SelectItem>
                      <SelectItem value="retail">
                        {t("filials.types.retail_store")}
                      </SelectItem>
                      <SelectItem value="online">
                        {t("filials.types.online_center")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t("common.address")} *</Label>
                <Input
                  id="address"
                  placeholder={t("filials.placeholders.street_address")}
                  value={newFilial.address}
                  onChange={(e) =>
                    setNewFilial({ ...newFilial, address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t("filials.city")} *</Label>
                  <Input
                    id="city"
                    placeholder={t("filials.placeholders.city")}
                    value={newFilial.city}
                    onChange={(e) =>
                      setNewFilial({ ...newFilial, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t("filials.country")}</Label>
                  <Input
                    id="country"
                    placeholder={t("filials.placeholders.country")}
                    value={newFilial.country}
                    onChange={(e) =>
                      setNewFilial({ ...newFilial, country: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("common.phone")}</Label>
                  <Input
                    id="phone"
                    placeholder={t("filials.placeholders.phone")}
                    value={newFilial.phone}
                    onChange={(e) =>
                      setNewFilial({ ...newFilial, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("common.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("filials.placeholders.email")}
                    value={newFilial.email}
                    onChange={(e) =>
                      setNewFilial({ ...newFilial, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">{t("filials.manager")} *</Label>
                <Select
                  value={newFilial.manager}
                  onValueChange={(value) =>
                    setNewFilial({ ...newFilial, manager: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("filials.select_manager")} />
                  </SelectTrigger>
                  <SelectContent>
                    {managerOptions
                      .filter((m) => {
                        const used = getAssignedManagerIds();
                        return !used.has(m.id);
                      })
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">{t("common.status")}</Label>
                  <Select
                    value={newFilial.status}
                    onValueChange={(value) =>
                      setNewFilial({
                        ...newFilial,
                        status: value as "active" | "inactive" | "maintenance",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("filials.select_status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        {t("filials.statuses.active")}
                      </SelectItem>
                      <SelectItem value="inactive">
                        {t("filials.statuses.inactive")}
                      </SelectItem>
                      <SelectItem value="maintenance">
                        {t("filials.statuses.maintenance")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">{t("filials.capacity")}</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    placeholder={t("filials.placeholders.capacity")}
                    value={newFilial.capacity}
                    onChange={(e) =>
                      setNewFilial({
                        ...newFilial,
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="openingHours">
                  {t("filials.opening_hours")}
                </Label>
                <Input
                  id="openingHours"
                  placeholder={t("filials.placeholders.opening_hours")}
                  value={newFilial.openingHours}
                  onChange={(e) =>
                    setNewFilial({ ...newFilial, openingHours: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={addFilial}>
                  {t("filials.add_filial")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("filials.total_filials")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filials.length}</div>
            <p className="text-xs text-muted-foreground">
              {filials.filter((f) => f.status === "active").length}{" "}
              {t("filials.statuses.active")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("filials.retail_stores")}
            </CardTitle>
            <Store className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filials.filter((f) => f.type === "retail").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("filials.customer_facing_locations")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("filials.warehouses")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filials.filter((f) => f.type === "warehouse").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("filials.storage_facilities")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("filials.total_staff")}
            </CardTitle>
            <User className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {filials.reduce((sum, f) => sum + f.currentStaff, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("filials.across_all_locations")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filials List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("filials.list_title")}</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("filials.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t("filials.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filials.all_types")}</SelectItem>
                <SelectItem value="warehouse">
                  {t("filials.types.warehouse")}
                </SelectItem>
                <SelectItem value="retail">
                  {t("filials.types.retail")}
                </SelectItem>
                <SelectItem value="online">
                  {t("filials.types.online")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filials.all_status")}</SelectItem>
                <SelectItem value="active">
                  {t("filials.statuses.active")}
                </SelectItem>
                <SelectItem value="inactive">
                  {t("filials.statuses.inactive")}
                </SelectItem>
                <SelectItem value="maintenance">
                  {t("filials.statuses.maintenance")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-sm text-muted-foreground">
              {t("filials.loading")}
            </div>
          )}
          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("filials.headers.name_location")}</TableHead>
                <TableHead>{t("filials.type")}</TableHead>
                <TableHead>{t("filials.manager")}</TableHead>
                <TableHead>{t("filials.headers.staff")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("filials.contact")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFilials.map((filial) => (
                <TableRow key={filial.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{filial.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {filial.city}, {filial.country}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(filial.type)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {getManagerDisplay(filial.manager)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{filial.currentStaff}</span>
                      {filial.capacity > 0 && (
                        <span className="text-muted-foreground">
                          /{filial.capacity}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(filial.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {filial.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{filial.phone}</span>
                        </div>
                      )}
                      {filial.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{filial.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFilial(filial);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingFilial(filial);
                          const mappedManagerId =
                            resolveManagerId(filial.manager) || filial.manager;
                          setNewFilial({
                            name: filial.name,
                            type: filial.type,
                            address: filial.address,
                            city: filial.city,
                            country: filial.country,
                            phone: filial.phone,
                            email: filial.email,
                            manager: mappedManagerId,
                            status: filial.status,
                            openingHours: filial.openingHours,
                            capacity: filial.capacity,
                            currentStaff: filial.currentStaff,
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFilial(filial.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls page={filialPage} totalItems={filteredFilials.length} onPageChange={setFilialPage} />
        </CardContent>
      </Card>

      {/* View Filial Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("filials.details.title")}
            </DialogTitle>
            <DialogDescription>
              {t("filials.details.subtitle")}
            </DialogDescription>
          </DialogHeader>
          {selectedFilial && (
            <DetailCard
              title={selectedFilial.name}
              subtitle={t("filials.details.subtitle")}
              left={[
                {
                  label: t("filials.type"),
                  value: getTypeBadge(selectedFilial.type),
                },
                {
                  label: t("common.address"),
                  value: `${selectedFilial.address}, ${selectedFilial.city}, ${selectedFilial.country}`,
                },
              ]}
              right={[
                {
                  label: t("common.status"),
                  value: getStatusBadge(selectedFilial.status),
                },
                {
                  label: t("filials.contact"),
                  value: (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {t("filials.manager")}:{" "}
                          {getManagerDisplay(selectedFilial.manager)}
                        </span>
                      </div>
                      {selectedFilial.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {selectedFilial.phone}
                          </span>
                        </div>
                      )}
                      {selectedFilial.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {selectedFilial.email}
                          </span>
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
              stats={[
                {
                  label: t("filials.current_staff"),
                  value: selectedFilial.currentStaff,
                },
                {
                  label: t("filials.capacity"),
                  value: selectedFilial.capacity || t("filials.na"),
                },
              ]}
            >
              <div>
                <div className="text-xs text-muted-foreground mb-2">
                  {t("filials.products_in_filial")}
                </div>
                {isFilialProductsLoading ? (
                  <div className="text-sm text-muted-foreground">
                    {t("filials.loading")}
                  </div>
                ) : filialProductsError ? (
                  <div className="text-sm text-destructive">
                    {filialProductsError}
                  </div>
                ) : filialProducts.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {t("filials.no_products")}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("filials.product")}</TableHead>
                          <TableHead>{t("filials.sku")}</TableHead>
                          <TableHead>{t("filials.price")}</TableHead>
                          <TableHead>{t("filials.quantity")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filialProducts.map((fp) => (
                          <TableRow key={fp.id}>
                            <TableCell>
                              <div className="font-medium">
                                {fp.product.name}
                              </div>
                            </TableCell>
                            <TableCell>{fp.product.sku}</TableCell>
                            <TableCell>
                              {formatPrice(fp.product.sellingPrice)}
                            </TableCell>
                            <TableCell>{fp.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground border-t pt-3 mt-3">
                <div>
                  📅 {t("filials.created")}: {selectedFilial.createdAt}
                </div>
                <div>
                  🔄 {t("filials.updated")}: {selectedFilial.updatedAt}
                </div>
              </div>
            </DetailCard>
          )}
        </DialogContent>
      </Dialog>

      {/* {t("filials.edit_filial")} Dialog - Similar structure to Add Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("filials.edit_filial")}</DialogTitle>
            <DialogDescription>
              {t("filials.edit_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form structure as Add Dialog but with edit functionality */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editName">{t("common.name")} *</Label>
                <Input
                  id="editName"
                  placeholder={t("filials.placeholders.store_name")}
                  value={newFilial.name}
                  onChange={(e) =>
                    setNewFilial({ ...newFilial, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editType">{t("filials.type")} *</Label>
                <Select
                  value={newFilial.type}
                  onValueChange={(value) =>
                    setNewFilial({
                      ...newFilial,
                      type: value as "warehouse" | "retail" | "online",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("filials.select_type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">
                      {t("filials.types.warehouse")}
                    </SelectItem>
                    <SelectItem value="retail">
                      {t("filials.types.retail_store")}
                    </SelectItem>
                    <SelectItem value="online">
                      {t("filials.types.online_center")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAddress">{t("common.address")} *</Label>
              <Input
                id="editAddress"
                placeholder={t("filials.placeholders.street_address")}
                value={newFilial.address}
                onChange={(e) =>
                  setNewFilial({ ...newFilial, address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCity">{t("filials.city")} *</Label>
                <Input
                  id="editCity"
                  placeholder={t("filials.placeholders.city")}
                  value={newFilial.city}
                  onChange={(e) =>
                    setNewFilial({ ...newFilial, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editManager">{t("filials.manager")} *</Label>
                <Select
                  value={newFilial.manager}
                  onValueChange={(value) =>
                    setNewFilial({ ...newFilial, manager: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("filials.select_manager")} />
                  </SelectTrigger>
                  <SelectContent>
                    {managerOptions
                      .filter((m) => {
                        const used = getAssignedManagerIds();
                        const currentId = resolveManagerId(
                          editingFilial?.manager || "",
                        );
                        if (currentId) used.delete(currentId);
                        return !used.has(m.id) || m.id === currentId;
                      })
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    {(() => {
                      const currentId = resolveManagerId(
                        editingFilial?.manager || "",
                      );
                      const hasCurrent = currentId
                        ? managerOptions.some((m) => m.id === currentId)
                        : false;
                      if (currentId && !hasCurrent) {
                        return (
                          <SelectItem key={currentId} value={currentId}>
                            {getManagerDisplay(
                              editingFilial?.manager || String(currentId),
                            )}
                          </SelectItem>
                        );
                      }
                      return null;
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={editFilial}>
                {t("filials.update_filial")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
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
import { categoryNameToId, categoryIdToName } from "@/lib/categories";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DetailCard from "@/components/DetailCard";
import { useMemo, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE } from "@/lib/api";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Edit,
  Trash2,
  Filter,
  Eye,
  Barcode,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  History,
  Calendar,
  User,
  Package2,
} from "lucide-react";
import { AdminOnly } from "@/components/PermissionGate";

interface Store {
  id: string;
  name: string;
  location: string;
  type: "warehouse" | "retail" | "online";
}

interface ProductStore {
  storeId: string;
  storeName: string;
  quantity: number;
  location: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  description: string;
  quantity: number;
  stores: ProductStore[];
  minStock: number;
  maxStock: number;
  costPrice: number;
  sellingPrice: number;
  supplier: string; // legacy single string
  suppliers?: string[]; // preferred array form
  location: string;
  expiryDate?: string;
  status: "in-stock" | "low-stock" | "out-of-stock" | "discontinued";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "stock_in" | "stock_out" | "adjustment" | "transfer";
  quantity: number;
  reason: string;
  notes?: string;
  performedBy: string;
  performedById?: string;
  date: string;
  time: string;
  previousQuantity: number;
  newQuantity: number;
  storeId: string;
  storeName: string;
  fromStore?: string;
  toStore?: string;
  reference?: string;
  supplier?: string;
  customer?: string;
}

interface WarehouseHistory {
  id: string;
  action:
    | "create"
    | "edit"
    | "delete"
    | "stock_in"
    | "stock_out"
    | "transfer"
    | "adjustment";
  entityType: "product" | "stock";
  entityId: string;
  entityName: string;
  description: string;
  performedBy: string;
  date: string;
  time: string;
  details?: any;
}

const mockStores: Store[] = [
  {
    id: "store1",
    name: "Main Warehouse",
    location: "Central District, Building A",
    type: "warehouse",
  },
  {
    id: "store2",
    name: "Downtown Retail Store",
    location: "Downtown Mall, Unit 15",
    type: "retail",
  },
  {
    id: "store3",
    name: "North Branch",
    location: "North Plaza, Store 22",
    type: "retail",
  },
  {
    id: "store4",
    name: "Online Fulfillment Center",
    location: "Industrial Park, Zone C",
    type: "online",
  },
];

const mockProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro",
    category: "Smartphones",
    brand: "Apple",
    sku: "APL-IP15P-128",
    description: "Latest iPhone model with advanced features",
    quantity: 23,
    stores: [
      {
        storeId: "store1",
        storeName: "Main Warehouse",
        quantity: 15,
        location: "A1-B2",
      },
      {
        storeId: "store2",
        storeName: "Downtown Retail Store",
        quantity: 5,
        location: "Display-01",
      },
      {
        storeId: "store4",
        storeName: "Online Fulfillment Center",
        quantity: 3,
        location: "E-COM-A12",
      },
    ],
    minStock: 10,
    maxStock: 50,
    costPrice: 799,
    sellingPrice: 999,
    supplier: "Apple Inc.",
    location: "A1-B2",
    expiryDate: "",
    status: "in-stock",
    tags: ["premium", "flagship"],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-20",
  },
  {
    id: "2",
    name: "Samsung Galaxy S24",
    category: "Smartphones",
    brand: "Samsung",
    sku: "SAM-GS24-256",
    description: "High-end Android smartphone",
    quantity: 32,
    stores: [
      {
        storeId: "store1",
        storeName: "Main Warehouse",
        quantity: 20,
        location: "A1-B3",
      },
      {
        storeId: "store2",
        storeName: "Downtown Retail Store",
        quantity: 8,
        location: "Display-02",
      },
      {
        storeId: "store3",
        storeName: "North Branch",
        quantity: 4,
        location: "Display-A3",
      },
    ],
    minStock: 10,
    maxStock: 40,
    costPrice: 699,
    sellingPrice: 899,
    supplier: "Samsung Electronics",
    location: "A1-B3",
    status: "in-stock",
    tags: ["android", "flagship"],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-18",
  },
  {
    id: "3",
    name: "Nike Air Max",
    category: "Footwear",
    brand: "Nike",
    sku: "NIK-AM90-42",
    description: "Comfortable running shoes",
    quantity: 2,
    stores: [
      {
        storeId: "store3",
        storeName: "North Branch",
        quantity: 2,
        location: "Footwear-B1",
      },
    ],
    minStock: 15,
    maxStock: 60,
    costPrice: 80,
    sellingPrice: 120,
    supplier: "Nike Distribution",
    location: "B2-C1",
    status: "low-stock",
    tags: ["sport", "casual"],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },
  {
    id: "4",
    name: "MacBook Air M3",
    category: "Laptops",
    brand: "Apple",
    sku: "APL-MBA-M3-13",
    description: "Lightweight laptop with M3 chip",
    quantity: 12,
    stores: [
      {
        storeId: "store1",
        storeName: "Main Warehouse",
        quantity: 8,
        location: "C1-D2",
      },
      {
        storeId: "store4",
        storeName: "Online Fulfillment Center",
        quantity: 4,
        location: "E-COM-L05",
      },
    ],
    minStock: 5,
    maxStock: 25,
    costPrice: 1099,
    sellingPrice: 1299,
    supplier: "Apple Inc.",
    location: "C1-D2",
    status: "in-stock",
    tags: ["laptop", "premium"],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-19",
  },
];

const mockStockMovements: StockMovement[] = [
  {
    id: "1",
    productId: "1",
    productName: "iPhone 15 Pro",
    type: "stock_in",
    quantity: 20,
    reason: "New shipment received",
    notes: "Supplier delivery batch #123",
    performedBy: "John Smith",
    date: "2024-01-20",
    time: "14:30",
    previousQuantity: 3,
    newQuantity: 23,
    storeId: "store1",
    storeName: "Main Warehouse",
    supplier: "Apple Inc.",
    reference: "PO-2024-001",
  },
  {
    id: "2",
    productId: "2",
    productName: "Samsung Galaxy S24",
    type: "stock_out",
    quantity: 3,
    reason: "Customer sale",
    notes: "In-store purchase",
    performedBy: "Sarah Johnson",
    date: "2024-01-19",
    time: "11:15",
    previousQuantity: 8,
    newQuantity: 5,
    storeId: "store2",
    storeName: "Downtown Retail Store",
    customer: "John Doe",
    reference: "INV-2024-002",
  },
  {
    id: "3",
    productId: "3",
    productName: "Nike Air Max",
    type: "adjustment",
    quantity: -2,
    reason: "Damaged items",
    notes: "Found 2 damaged pairs during inspection",
    performedBy: "Mike Chen",
    date: "2024-01-18",
    time: "16:45",
    previousQuantity: 4,
    newQuantity: 2,
    storeId: "store3",
    storeName: "North Branch",
    reference: "ADJ-2024-003",
  },
  {
    id: "4",
    productId: "1",
    productName: "iPhone 15 Pro",
    type: "transfer",
    quantity: 2,
    reason: "Store transfer",
    notes: "Transfer for display purposes",
    performedBy: "Admin",
    date: "2024-01-17",
    time: "09:30",
    previousQuantity: 15,
    newQuantity: 13,
    storeId: "store1",
    storeName: "Main Warehouse",
    fromStore: "Main Warehouse",
    toStore: "Downtown Retail Store",
    reference: "TRF-2024-001",
  },
  {
    id: "5",
    productId: "4",
    productName: "MacBook Air M3",
    type: "stock_out",
    quantity: 1,
    reason: "Online order fulfillment",
    notes: "Express shipping",
    performedBy: "Alex Wilson",
    date: "2024-01-16",
    time: "13:45",
    previousQuantity: 4,
    newQuantity: 3,
    storeId: "store4",
    storeName: "Online Fulfillment Center",
    customer: "Emma Smith",
    reference: "ORD-2024-123",
  },
];

const mockWarehouseHistory: WarehouseHistory[] = [
  {
    id: "1",
    action: "stock_in",
    entityType: "stock",
    entityId: "1",
    entityName: "iPhone 15 Pro",
    description: "Added 20 units - New shipment received",
    performedBy: "John Smith",
    date: "2024-01-20",
    time: "14:30",
    details: {
      quantity: 20,
      reason: "New shipment received",
      storeName: "Main Warehouse",
      supplier: "Apple Inc.",
      reference: "PO-2024-001",
      notes: "Supplier delivery batch #123",
    },
  },
  {
    id: "2",
    action: "edit",
    entityType: "product",
    entityId: "2",
    entityName: "Samsung Galaxy S24",
    description: "Updated product information",
    performedBy: "Admin",
    date: "2024-01-19",
    time: "15:20",
    details: {
      updatedFields: { price: { old: 849, new: 899 } },
      reference: "UPD-2024-001",
    },
  },
  {
    id: "3",
    action: "stock_out",
    entityType: "stock",
    entityId: "2",
    entityName: "Samsung Galaxy S24",
    description: "Removed 3 units - Customer sale",
    performedBy: "Sarah Johnson",
    date: "2024-01-19",
    time: "11:15",
    details: {
      quantity: 3,
      reason: "Customer sale",
      storeName: "Downtown Retail Store",
      customer: "John Doe",
      reference: "INV-2024-002",
      notes: "In-store purchase",
    },
  },
  {
    id: "4",
    action: "create",
    entityType: "product",
    entityId: "4",
    entityName: "MacBook Air M3",
    description: "Created new product",
    performedBy: "Admin",
    date: "2024-01-18",
    time: "10:30",
    details: {
      category: "Laptops",
      brand: "Apple",
      reference: "PROD-2024-004",
    },
  },
  {
    id: "5",
    action: "adjustment",
    entityType: "stock",
    entityId: "3",
    entityName: "Nike Air Max",
    description: "Adjusted -2 units - Damaged items",
    performedBy: "Mike Chen",
    date: "2024-01-18",
    time: "16:45",
    details: {
      quantity: -2,
      reason: "Damaged items",
      storeName: "North Branch",
      reference: "ADJ-2024-003",
      notes: "Found 2 damaged pairs during inspection",
    },
  },
  {
    id: "6",
    action: "transfer",
    entityType: "stock",
    entityId: "1",
    entityName: "iPhone 15 Pro",
    description: "Transferred 2 units between stores",
    performedBy: "Admin",
    date: "2024-01-17",
    time: "09:30",
    details: {
      quantity: 2,
      reason: "Store transfer",
      storeName: "Main Warehouse",
      fromStore: { name: "Main Warehouse", type: "warehouse" },
      toStore: { name: "Downtown Retail Store", type: "retail" },
      reference: "TRF-2024-001",
      notes: "Transfer for display purposes",
    },
  },
];

export default function Warehouse() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [stockMovements, setStockMovements] = useState(mockStockMovements);
  const [warehouseHistory, setWarehouseHistory] =
    useState(mockWarehouseHistory);
  const [usersFilialMap, setUsersFilialMap] = useState<Record<string, string>>(
    {},
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isStockInDialogOpen, setIsStockInDialogOpen] = useState(false);
  const [isStockOutDialogOpen, setIsStockOutDialogOpen] = useState(false);
  const [isProductSelectionOpen, setIsProductSelectionOpen] = useState(false);
  const [stockActionType, setStockActionType] = useState<"in" | "out">("in");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [stockReason, setStockReason] = useState("");
  const [stockNotes, setStockNotes] = useState("");
  const [stockLocation, setStockLocation] = useState("");
  const [stockFrom, setStockFrom] = useState("");
  const [stockTo, setStockTo] = useState("");
  const [stockFromType, setStockFromType] = useState("");
  const [stockToType, setStockToType] = useState("");
  const [discardReason, setDiscardReason] = useState("");
  const [discardOther, setDiscardOther] = useState("");
  const [filialOptions, setFilialOptions] = useState<
    { id: string; name: string; type?: string }[]
  >([]);
  const [clientOptions, setClientOptions] = useState<
    { id: string; name: string }[]
  >([]);

  // Date range filters for movements and history
  const [movementFrom, setMovementFrom] = useState<string | null>(null);
  const [movementTo, setMovementTo] = useState<string | null>(null);
  const [historyFrom, setHistoryFrom] = useState<string | null>(null);
  const [historyTo, setHistoryTo] = useState<string | null>(null);

  // Applied filters (only updated when user clicks {t("common.apply")})
  const [appliedMovementFrom, setAppliedMovementFrom] = useState<string | null>(
    null,
  );
  const [appliedMovementTo, setAppliedMovementTo] = useState<string | null>(
    null,
  );
  const [appliedHistoryFrom, setAppliedHistoryFrom] = useState<string | null>(
    null,
  );
  const [appliedHistoryTo, setAppliedHistoryTo] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState<
    Partial<Product> & { suppliers?: string[] }
  >({
    name: "",
    category: "",
    brand: "",
    sku: "",
    description: "",
    quantity: 0,
    minStock: 0,
    maxStock: 0,
    costPrice: 0,
    sellingPrice: 0,
    supplier: "",
    suppliers: [],
    location: "",
    expiryDate: "",
    tags: [],
    status: "in-stock",
  });

  const [supplierInput, setSupplierInput] = useState<string>("");
  const [editSupplierInput, setEditSupplierInput] = useState<string>("");
  const [skuBuffer, setSkuBuffer] = useState<string>("");
  const skuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authUser = useAuthStore((s) => s.user);
  const { t } = useTranslation();

  const fetchProductsFromApi = async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch(`${API_BASE}/products`, {
        headers,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok || !Array.isArray(json.result)) return;
      const mapStatus = (s: any): Product["status"] => {
        const t = String(s || "").toLowerCase();
        if (t.includes("out")) return "out-of-stock";
        if (t.includes("low")) return "low-stock";
        if (t.includes("discontinued")) return "discontinued";
        return "in-stock";
      };
      const mapped: Product[] = json.result.map((p: any) => {
        const quantity =
          typeof p.count === "number"
            ? p.count
            : parseInt(p.count || 0, 10) || 0;
        const stores = Array.isArray(p.filials)
          ? p.filials.map((fi: any) => ({
              storeId: String(fi.filialId),
              storeName:
                filialOptions.find((f) => f.id === String(fi.filialId))?.name ||
                String(fi.filialId),
              quantity:
                typeof fi.count === "number"
                  ? fi.count
                  : parseInt(fi.count || 0, 10) || 0,
              location: "",
            }))
          : [];
        return {
          id: String(p.id),
          name: String(p.name || ""),
          category: String(
            p.categoryName ||
              p.category ||
              categoryIdToName(p.categoryId) ||
              "",
          ),
          brand: String(p.brand || ""),
          sku: String(p.sku || ""),
          description: String(p.description || ""),
          quantity,
          stores,
          minStock:
            typeof p.minStock === "number"
              ? p.minStock
              : parseInt(p.minStock || 0, 10) || 0,
          maxStock:
            typeof p.maxStock === "number"
              ? p.maxStock
              : parseInt(p.maxStock || 0, 10) || 0,
          costPrice:
            typeof p.costPrice === "number"
              ? p.costPrice
              : parseFloat(p.costPrice || 0) || 0,
          sellingPrice:
            typeof p.sellingPrice === "number"
              ? p.sellingPrice
              : parseFloat(p.sellingPrice || 0) || 0,
          supplier: String(p.supplier || ""),
          suppliers: Array.isArray(p.suppliers)
            ? p.suppliers.map((x: any) => String(x))
            : Array.isArray(p.supplier)
              ? p.supplier.map((x: any) => String(x))
              : p.supplier
                ? String(p.supplier)
                    .split(",")
                    .map((x: string) => x.trim())
                    .filter(Boolean)
                : [],
          location: String(p.location || ""),
          expiryDate: p.expiryDate ? String(p.expiryDate).split("T")[0] : "",
          status: mapStatus(p.status),
          tags: [],
          createdAt: (p.createdAt
            ? String(p.createdAt)
            : new Date().toISOString()
          ).split("T")[0],
          updatedAt: (p.updatedAt
            ? String(p.updatedAt)
            : new Date().toISOString()
          ).split("T")[0],
        } as Product;
      });
      setProducts(mapped);
    } catch (e) {
      toast({
        title: t("common.error"),
        description: t("warehouse.errors.load_products"),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProductsFromApi();
  }, [accessToken]);

  // Helper: accept either YYYY-MM-DD or DD-MM-YYYY and return DD-MM-YYYY for backend, otherwise null
  const formatDateForBackend = (input?: string | null) => {
    if (!input || typeof input !== "string") return null;
    // reject obviously incomplete placeholders like 'yyyy' or 'mm'
    if (/[a-zA-Z]/.test(input)) return null;

    // YYYY-MM-DD -> convert to DD-MM-YYYY
    const isoMatch = input.match(/^\s*(\d{4})-(\d{2})-(\d{2})\s*$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}-${m}-${y}`;
    }
    // DD-MM-YYYY -> accept as-is
    const dmyMatch = input.match(/^\s*(\d{2})-(\d{2})-(\d{4})\s*$/);
    if (dmyMatch) return input.trim();
    return null;
  };

  // Fetch warehouse histories from backend (supports optional from/to YYYY-MM-DD or DD-MM-YYYY inputs)
  const fetchWarehouseHistoriesFromApi = async (
    from?: string | null,
    to?: string | null,
  ) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const params: string[] = [];
      const backendFrom = formatDateForBackend(from);
      const backendTo = formatDateForBackend(to);
      if (backendFrom) params.push(`from=${encodeURIComponent(backendFrom)}`);
      if (backendTo) params.push(`to=${encodeURIComponent(backendTo)}`);
      const url = `${API_BASE}/histories${params.length ? `?${params.join("&")}` : ""}`;
      const res = await fetch(url, { headers });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok || !Array.isArray(json.result)) return;

      const raw: any[] = json.result;

      // Resolve user names for performedBy
      const userIds = Array.from(
        new Set(raw.map((r) => r.userId || r.ph_user_id).filter(Boolean)),
      );
      const usersMap: Record<string, string> = {};
      const usersFilialLocal: Record<string, string> = {};
      await Promise.all(
        userIds.map(async (id) => {
          try {
            const uRes = await fetch(`${API_BASE}/users/${id}`, { headers });
            const uJson = await uRes.json().catch(() => null);
            if (uRes.ok && uJson?.ok && uJson.result) {
              const u = uJson.result;
              usersMap[id] = (u.name ||
                u.userName ||
                `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                u.email ||
                id) as string;
              const fid =
                u.filialId ??
                u.filialID ??
                u.storeId ??
                u.branchId ??
                u.locationId;
              if (fid) usersFilialLocal[id] = String(fid);
            }
          } catch (err) {
            // ignore
          }
        }),
      );
      setUsersFilialMap((prev) => ({ ...prev, ...usersFilialLocal }));

      const extractStoreName = (h: any) => {
        const d = h.details || {};
        // filialId preferred
        if (d.filialId) {
          const f = filialOptions.find(
            (ff) => String(ff.id) === String(d.filialId),
          );
          if (f) return f.name;
          return String(d.filialId);
        }
        // explicit storeName
        if (d.storeName) return d.storeName;
        // toStore/fromStore objects
        if (d.toStore && typeof d.toStore === "object" && d.toStore.name)
          return d.toStore.name;
        if (d.fromStore && typeof d.fromStore === "object" && d.fromStore.name)
          return d.fromStore.name;
        // partyType might be filial id
        if (d.partyType) {
          const f = filialOptions.find(
            (ff) =>
              String(ff.id) === String(d.partyType) ||
              String(ff.name) === String(d.partyType),
          );
          if (f) return f.name;
        }
        if (d.party) return d.party;
        // try to parse description like "to <name>"
        const m = String(h.description || "").match(/to\s+([^,.\n]+)/i);
        if (m && m[1]) return m[1].trim();
        return null;
      };

      const mapped = raw.map((h: any) => {
        // support both ph_ prefixed fields and generic names
        const createdRaw =
          h.ph_created_at ||
          h.createdAt ||
          h.createdat ||
          h.ph_createdAt ||
          h.created ||
          h.ph_created_at;
        const created = createdRaw ? new Date(String(createdRaw)) : new Date();

        let action = h.ph_action || h.action || h.ph_action || "";
        action = String(action).toLowerCase();
        // normalize some common variants
        if (action === "in") action = "stock_in";
        if (action === "out") action = "stock_out";

        let entityType =
          h.ph_entity_type || h.entityType || h.entity_type || "";
        entityType = String(entityType).toLowerCase();

        const description = h.ph_description || h.description || "";
        const userId = h.ph_user_id || h.userId || h.user_id || null;
        const productId =
          h.ph_product_id || h.productId || h.ph_productId || null;
        const detailsRaw = h.ph_details ?? h.details ?? null;

        let entityName = productId
          ? products.find((p) => String(p.id) === String(productId))?.name ||
            null
          : h.entityName || null;
        // fallback: try to detect product name inside description
        if (!entityName && description && products.length) {
          const found = products.find((p) =>
            description.toLowerCase().includes(p.name.toLowerCase()),
          );
          if (found) entityName = found.name;
        }

        const minimalH = { ...h, details: detailsRaw };
        const storeName = extractStoreName(minimalH);

        const details = detailsRaw ? { ...detailsRaw } : null;
        if (details && !details.storeName && storeName)
          details.storeName = storeName;

        // Special handling for transfers: filialId is often destination, partyType may be source filial id
        if (details) {
          const act = String(action || h.action || "");
          if (act === "transfer") {
            const toId =
              details.filialId ??
              details.toFilialId ??
              (details.toStore && typeof details.toStore === "string"
                ? details.toStore
                : undefined);
            const fromId =
              details.partyType ??
              details.fromFilialId ??
              (details.fromStore && typeof details.fromStore === "string"
                ? details.fromStore
                : undefined);

            if (toId) {
              const f = filialOptions.find(
                (ff) =>
                  String(ff.id) === String(toId) ||
                  String(ff.name) === String(toId),
              );
              if (f) details.toStore = { name: f.name, id: f.id };
              else if (typeof details.toStore === "string")
                details.toStore = { name: String(toId), id: String(toId) };
            }

            if (fromId) {
              const f = filialOptions.find(
                (ff) =>
                  String(ff.id) === String(fromId) ||
                  String(ff.name) === String(fromId),
              );
              if (f) details.fromStore = { name: f.name, id: f.id };
              else if (typeof details.fromStore === "string")
                details.fromStore = {
                  name: String(fromId),
                  id: String(fromId),
                };
            }

            if (
              !details.storeName &&
              details.toStore &&
              typeof details.toStore === "object"
            ) {
              details.storeName = details.toStore.name;
            }
          } else {
            if (details.toStore && typeof details.toStore === "string") {
              const f = filialOptions.find(
                (ff) => String(ff.id) === String(details.toStore),
              );
              if (f) details.toStore = { name: f.name, id: f.id };
            }
            if (details.fromStore && typeof details.fromStore === "string") {
              const f = filialOptions.find(
                (ff) => String(ff.id) === String(details.fromStore),
              );
              if (f) details.fromStore = { name: f.name, id: f.id };
            }
          }
        }

        const performedBy =
          usersMap[userId] || String(userId || h.performedBy || "");

        return {
          id: String(h.ph_id || h.id || h.phId || h.ph_id || Math.random()),
          action: String(action || ""),
          entityType: String(entityType || ""),
          entityId: productId ?? h.entityId ?? null,
          entityName,
          description: String(description || ""),
          performedBy,
          performedById: userId || undefined,
          date: created.toLocaleDateString(),
          time: created.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          ts: created.getTime(),
          details,
        } as any;
      });

      setWarehouseHistory(mapped);
      return mapped.length;
    } catch (e) {
      console.error("Failed to load histories", e);
      toast({
        title: t("common.error"),
        description: t("warehouse.errors.load_history"),
        variant: "destructive",
      });
      return 0;
    }
  };

  useEffect(() => {
    // initial load without filters
    fetchWarehouseHistoriesFromApi();
    fetchStockMovementsFromApi();
  }, [accessToken, products]);

  // Fetch stock movements (supports optional from/to YYYY-MM-DD or DD-MM-YYYY inputs)
  const fetchStockMovementsFromApi = async (
    from?: string | null,
    to?: string | null,
  ) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const params: string[] = [];
      const backendFrom = formatDateForBackend(from);
      const backendTo = formatDateForBackend(to);
      if (backendFrom) params.push(`from=${encodeURIComponent(backendFrom)}`);
      if (backendTo) params.push(`to=${encodeURIComponent(backendTo)}`);
      const url = `${API_BASE}/movement${params.length ? `?${params.join("&")}` : ""}`;
      const res = await fetch(url, { headers });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok || !Array.isArray(json.result)) return;

      const raw: any[] = json.result;
      // Resolve performer filial mapping for movements
      try {
        const movementUserIds = Array.from(
          new Set(
            raw
              .map((m) => m.ph_user_id || m.userId || m.user_id)
              .filter(Boolean),
          ),
        );
        if (movementUserIds.length) {
          const usersFilialLocal: Record<string, string> = {};
          await Promise.all(
            movementUserIds.map(async (id: string) => {
              try {
                const uRes = await fetch(`${API_BASE}/users/${id}`, {
                  headers,
                });
                const uJson = await uRes.json().catch(() => null);
                if (uRes.ok && uJson?.ok && uJson.result) {
                  const u = uJson.result;
                  const fid =
                    u.filialId ??
                    u.filialID ??
                    u.storeId ??
                    u.branchId ??
                    u.locationId;
                  if (fid) usersFilialLocal[id] = String(fid);
                }
              } catch {}
            }),
          );
          if (Object.keys(usersFilialLocal).length) {
            setUsersFilialMap((prev) => ({ ...prev, ...usersFilialLocal }));
          }
        }
      } catch {}

      const mapped = raw.map((m: any, idx: number) => {
        const createdRaw =
          m.createdAt || m.createdat || m.created || m.created_at;
        const created = createdRaw ? new Date(String(createdRaw)) : new Date();
        const date = created.toLocaleDateString();
        const time = created.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        // normalize type values to canonical keys used in UI
        const rawType = String(
          m.action || m.type || m.Type || "",
        ).toLowerCase();
        let type: string = rawType;
        if (rawType.includes("in")) type = "stock_in";
        else if (rawType.includes("out")) type = "stock_out";
        else if (rawType.includes("transfer")) type = "transfer";
        else if (rawType.includes("adjust")) type = "adjustment";

        const detailsObj = m.details || {};

        // product name resolution
        let productName = String(m.productName || m.productname || "");
        if (!productName && m.productId) {
          productName =
            products.find((p) => String(p.id) === String(m.productId))?.name ||
            String(m.productId);
        }

        // store resolution
        const storeId = String(detailsObj.filialId || m.filialId || "");
        const storeName =
          filialOptions.find((f) => String(f.id) === storeId)?.name ||
          String(m.filialname || detailsObj.storeName || "");

        // from/to store resolution
        let fromStore =
          detailsObj.fromStore ?? detailsObj.fromFilialId ?? undefined;
        let toStore = detailsObj.toStore ?? detailsObj.toFilialId ?? undefined;
        if (typeof fromStore === "string") {
          const f = filialOptions.find(
            (ff) => String(ff.id) === String(fromStore),
          );
          if (f) fromStore = f.name;
        }
        if (typeof toStore === "string") {
          const f = filialOptions.find(
            (ff) => String(ff.id) === String(toStore),
          );
          if (f) toStore = f.name;
        }

        // resolve party and display labels
        const rawParty = String(detailsObj.party || m.party || "");
        // normalize partyType / partytype / party_type across variants
        const partyTypeVal =
          detailsObj.partyType ??
          detailsObj.partytype ??
          detailsObj.party_type ??
          m.partyType ??
          m.partytype ??
          m.party_type ??
          null;
        let partyDisplay = rawParty || ""; // e.g., Supplier, Client, Other Filial, Discarded
        // normalize common values
        const rp = rawParty.toLowerCase();
        if (rp.includes("supplier")) partyDisplay = "Supplier";
        else if (rp.includes("client") || rp.includes("customer"))
          partyDisplay = "Client";
        else if (rp.includes("filial") || rp.includes("other"))
          partyDisplay = "Transfer";
        else if (rp.includes("discard")) partyDisplay = "Discarded";

        // if this movement type is a transfer, label it explicitly as Transfer
        if (type === "transfer") {
          partyDisplay = "Transfer";
        }

        // detect implicit transfers: some APIs return stock_in/out but include filial party info
        const reasonLower = String(detailsObj.reason || "").toLowerCase();
        const filialIdVal =
          detailsObj.filialId ??
          detailsObj.filialid ??
          detailsObj.filial_id ??
          m.filialId ??
          m.filialid ??
          m.filial_id ??
          null;
        const isImplicitTransfer =
          reasonLower.includes("transfer") ||
          (rp.includes("filial") && filialIdVal && partyTypeVal);
        if (isImplicitTransfer) {
          partyDisplay = "Transfer";
          // if both partyType and filialId present, map filialId -> toStore and partyType -> fromStore
          try {
            if (filialIdVal && partyTypeVal) {
              const dest = filialOptions.find(
                (f) => String(f.id) === String(filialIdVal),
              );
              const src = filialOptions.find(
                (f) => String(f.id) === String(partyTypeVal),
              );
              if (dest) toStore = dest.name;
              else toStore = String(filialIdVal);
              if (src) fromStore = src.name;
              else fromStore = String(partyTypeVal);
            }
          } catch (e) {
            /* ignore */
          }
        }

        // resolve party name (partyType may be an id for client/filial)
        let partyName: string | undefined;
        if (partyTypeVal) {
          const pt = String(partyTypeVal);
          const c = clientOptions.find(
            (c) => String(c.id) === pt || String(c.name) === pt,
          );
          if (c) partyName = c.name;
          else {
            const f = filialOptions.find(
              (f) => String(f.id) === pt || String(f.name) === pt,
            );
            if (f) partyName = f.name;
            else partyName = pt;
          }
        }

        // if no explicit partyName, deduce from stores or fields
        if (!partyName) {
          if (fromStore && partyDisplay === "Transfer")
            partyName = fromStore as string;
          if (toStore && partyDisplay === "Transfer")
            partyName = toStore as string;
        }

        return {
          id: String(m.reference || m.id || idx),
          productId: String(m.productId || ""),
          productName,
          type,
          quantity: Number(detailsObj.quantity ?? m.quantity ?? 0),
          reason: String(detailsObj.reason || m.reason || ""),
          notes: String(detailsObj.notes || m.notes || ""),
          performedBy: String(m.userName || m.username || m.performedBy || ""),
          performedById:
            String(m.ph_user_id || m.userId || m.user_id || "") || undefined,
          date,
          time,
          ts: isNaN(created.getTime()) ? null : created.getTime(),
          previousQuantity: Number(
            m.previousQuantity || m.previousquantity || 0,
          ),
          newQuantity: Number(m.newQuantity || m.newquantity || 0),
          storeId,
          storeName,
          fromStore,
          toStore,
          party: partyDisplay,
          partyName,
          reference: String(m.reference || ""),
        } as StockMovement;
      });

      setStockMovements(mapped);
      return mapped.length;
    } catch (e) {
      console.error("Failed to load movements", e);
      toast({
        title: t("common.error"),
        description: t("warehouse.errors.load_movements"),
        variant: "destructive",
      });
      return 0;
    }
  };

  const supplierOptions = useMemo(() => {
    if (!selectedProduct) return [] as string[];
    const set = new Set<string>();

    const addFromValue = (val: any) => {
      if (!val && val !== 0) return;
      if (Array.isArray(val)) {
        val.forEach((v) => {
          if (v) set.add(String(v));
        });
        return;
      }
      const s = String(val || "").trim();
      if (!s) return;
      // split comma separated
      if (s.includes(",")) {
        s.split(",")
          .map((x) => x.trim())
          .filter(Boolean)
          .forEach((v) => set.add(v));
      } else {
        set.add(s);
      }
    };

    addFromValue(selectedProduct.suppliers ?? selectedProduct.supplier);

    stockMovements
      .filter((m) => m.productId === selectedProduct.id)
      .forEach((m) => {
        addFromValue((m as any).supplier ?? (m as any).suppliers);
      });

    return Array.from(set);
  }, [selectedProduct, stockMovements]);

  useEffect(() => {
    if (!isStockInDialogOpen) return;
    if (stockFromType === "supplier") {
      setStockReason("Purchase");
    } else if (stockFromType === "customer_return") {
      setStockReason("Return");
    } else {
      setStockReason("");
    }
  }, [isStockInDialogOpen, stockFromType]);

  useEffect(() => {
    if (!isStockOutDialogOpen) return;
    if (stockToType === "client") {
      setStockReason("Sale");
    } else if (stockToType === "other_filial") {
      setStockReason("Transfer");
    } else if (stockToType === "discarded") {
      const reason =
        discardReason === "Other" ? discardOther.trim() : discardReason.trim();
      setStockReason(reason);
    } else {
      setStockReason("");
    }
  }, [isStockOutDialogOpen, stockToType, discardReason, discardOther]);

  useEffect(() => {
    if (!isStockOutDialogOpen) return;
    if (
      stockToType === "other_filial" &&
      stockTo &&
      stockTo === stockLocation
    ) {
      setStockTo("");
    }
  }, [isStockOutDialogOpen, stockLocation, stockToType]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const filialRes = await fetch(`${API_BASE}/filials`, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
        const filialJson = await filialRes.json().catch(() => null);
        if (
          filialRes.ok &&
          filialJson?.ok &&
          Array.isArray(filialJson.result)
        ) {
          const mapped = filialJson.result.map((f: any) => ({
            id: String(f.id),
            name: String(f.name),
            type:
              String(f.type || f.filialType || "").toLowerCase() || undefined,
          }));
          if (mounted) setFilialOptions(mapped);
        }
      } catch {}
      try {
        const clientsRes = await fetch(`${API_BASE}/clients`, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
        const clientsJson = await clientsRes.json().catch(() => null);
        if (
          clientsRes.ok &&
          clientsJson?.ok &&
          Array.isArray(clientsJson.result)
        ) {
          const mapped = clientsJson.result.map((c: any) => ({
            id: String(c.id),
            name: String(c.userName || c.name),
          }));
          if (mounted) setClientOptions(mapped);
        }
      } catch {}
    };
    load();
    return () => {
      mounted = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!filialOptions.length) return;
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        stores: (p.stores || []).map((s) => ({
          ...s,
          storeName:
            filialOptions.find((f) => f.id === s.storeId)?.name ||
            s.storeName ||
            s.storeId,
        })),
      })),
    );
  }, [filialOptions]);

  useEffect(() => {
    if (!selectedProduct) return;
    const latest = products.find((p) => p.id === selectedProduct.id);
    if (latest && latest !== selectedProduct) setSelectedProduct(latest);
  }, [products, selectedProduct?.id]);

  // SKU scanning - only in Warehouse page
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isInputField = activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA";

      // Handle Enter key - if buffer has content, search for product
      if (event.key === "Enter" && skuBuffer.trim().length > 0 && !isInputField) {
        event.preventDefault();
        const sku = skuBuffer.trim();
        const foundProduct = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
        if (foundProduct) {
          setSelectedProduct(foundProduct);
          setIsViewDialogOpen(true);
          toast({
            title: t("common.success"),
            description: `${t("warehouse.product")} "${foundProduct.name}" ${t("common.found")}`,
          });
        } else {
          toast({
            title: t("common.error"),
            description: `${t("warehouse.product")} ${t("common.with")} SKU "${sku}" ${t("common.not_found")}`,
            variant: "destructive",
          });
        }
        setSkuBuffer("");
        if (skuTimeoutRef.current) {
          clearTimeout(skuTimeoutRef.current);
        }
        return;
      }

      // Don't intercept keyboard if typing in input field
      if (isInputField) {
        return;
      }

      // Accumulate characters for SKU scanning (numbers, letters, hyphens)
      const char = event.key;
      if (char.length === 1 && /[a-zA-Z0-9\-]/i.test(char)) {
        event.preventDefault();
        const newBuffer = skuBuffer + char;
        setSkuBuffer(newBuffer);

        if (skuTimeoutRef.current) {
          clearTimeout(skuTimeoutRef.current);
        }

        // Auto-search after 1.5 seconds of inactivity
        skuTimeoutRef.current = setTimeout(() => {
          const sku = newBuffer.trim();
          if (sku.length > 0) {
            const foundProduct = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
            if (foundProduct) {
              setSelectedProduct(foundProduct);
              setIsViewDialogOpen(true);
              toast({
                title: t("common.success"),
                description: `${t("warehouse.product")} "${foundProduct.name}" ${t("common.found")}`,
              });
            } else {
              toast({
                title: t("common.error"),
                description: `${t("warehouse.product")} ${t("common.with")} SKU "${sku}" ${t("common.not_found")}`,
                variant: "destructive",
              });
            }
            setSkuBuffer("");
          }
        }, 1500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (skuTimeoutRef.current) {
        clearTimeout(skuTimeoutRef.current);
      }
    };
  }, [products, skuBuffer, toast, t]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const scopedFilial = (() => {
    const r = authUser?.role;
    if (!r || r === "super_admin" || r === "admin") {
      return { id: null as string | null, name: null as string | null };
    }
    const idRaw =
      (authUser as any).filialId ?? (authUser as any).filialID ?? (authUser as any).storeId ?? null;
    const nameRaw =
      (authUser as any).filialName ?? (authUser as any).location ?? null;
    const id = idRaw != null ? String(idRaw) : null;
    const name = nameRaw != null ? String(nameRaw).toLowerCase().trim() : null;
    return { id, name };
  })();
  const isScoped = Boolean(scopedFilial.id || scopedFilial.name);

  const matchesFilial = (st: ProductStore) => {
    if (!isScoped) return true;
    const stId = st && st.storeId != null ? String(st.storeId) : "";
    const stName = st && st.storeName ? String(st.storeName).toLowerCase().trim() : "";
    return (
      (scopedFilial.id && stId === scopedFilial.id) ||
      (scopedFilial.name && stName === scopedFilial.name)
    );
  };

  const getVisibleQuantity = (product: Product) => {
    if (!isScoped) return product.quantity;
    const s = (product.stores || []).find(matchesFilial);
    return s ? s.quantity : 0;
  };

  const getQuantityAtLocation = (product: Product, locId: string | null) => {
    if (!product || !locId) return 0;
    const s = (product.stores || []).find(
      (st) => String(st.storeId) === String(locId) || String(st.storeName).toLowerCase().trim() === String(locId).toLowerCase().trim(),
    );
    return s ? s.quantity : 0;
  };

  const visibleStores = (stores: ProductStore[]) => {
    if (!isScoped) return stores;
    return (stores || []).filter(matchesFilial);
  };

  const filteredHistory = warehouseHistory.filter((history: any) => {
    const matchesFilter =
      historyFilter === "all" || history.action === historyFilter;
    const matchesFilial = (() => {
      if (!isScoped) return true;
      const performerId = history.performedById;
      if (!performerId) return false;
      const fid = usersFilialMap[performerId];
      return fid ? String(fid) === String(scopedFilial.id) : false;
    })();
    return matchesFilter && matchesFilial;
  });

  const filteredMovements = stockMovements.filter((m: any) => {
    if (!isScoped) return true;
    const performerId = m.performedById;
    if (!performerId) return false;
    const fid = usersFilialMap[performerId];
    return fid ? String(fid) === String(scopedFilial.id) : false;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-stock":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t("warehouse.in_stock")}
          </Badge>
        );
      case "low-stock":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {t("warehouse.low_stock")}
          </Badge>
        );
      case "out-of-stock":
        return (
          <Badge variant="destructive">{t("warehouse.out_of_stock")}</Badge>
        );
      case "discontinued":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {t("warehouse.discontinued")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("warehouse.unknown")}</Badge>;
    }
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case "stock_in":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t("warehouse.stock_in")}
          </Badge>
        );
      case "stock_out":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {t("warehouse.stock_out")}
          </Badge>
        );
      case "adjustment":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            {t("warehouse.adjustment")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("warehouse.unknown")}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t("warehouse.actions.created")}
          </Badge>
        );
      case "edit":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {t("warehouse.actions.edited")}
          </Badge>
        );
      case "delete":
        return (
          <Badge variant="destructive">{t("warehouse.actions.deleted")}</Badge>
        );
      case "stock_in":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t("warehouse.stock_in")}
          </Badge>
        );
      case "stock_out":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {t("warehouse.stock_out")}
          </Badge>
        );
      case "transfer":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {t("warehouse.transfer")}
          </Badge>
        );
      case "adjustment":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            {t("warehouse.adjustment")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("warehouse.unknown")}</Badge>;
    }
  };

  const isProductExpired = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    try {
      const expDate = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      return expDate < today;
    } catch {
      return false;
    }
  };

  const getExpiredBadge = () => {
    return (
      <Badge variant="destructive" className="bg-red-500 text-white">
        {t("warehouse.expired")}
      </Badge>
    );
  };

  const formatReason = (reason: string): string => {
    const r = String(reason || "").toLowerCase();
    if (r === "purchase") return t("warehouse.purchase");
    if (r === "return") return t("warehouse.return");
    if (r === "sale") return t("warehouse.sale");
    if (r === "expired") return t("warehouse.expired");
    if (r === "broken") return t("warehouse.broken");
    if (r === "lost") return t("warehouse.lost");
    if (r === "other") return t("warehouse.other");
    if (r.includes("transfer")) return t("warehouse.transfer");
    return reason;
  };

  const formatParty = (party?: string): string => {
    const p = String(party || "").toLowerCase();
    if (p.includes("supplier")) return t("warehouse.supplier");
    if (p.includes("client") || p.includes("customer"))
      return t("warehouse.client");
    if (p.includes("filial") || p.includes("other") || p.includes("transfer"))
      return t("warehouse.transfer");
    if (p.includes("discard")) return t("warehouse.discarded");
    return party || "";
  };

  useEffect(() => {
    // Use the unified fetchStockMovementsFromApi to load movements so formatting stays consistent
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await fetchStockMovementsFromApi();
    };
    load();
    return () => {
      mounted = false;
    };
  }, [accessToken, filialOptions, clientOptions]);

  const calculateStatus = (
    quantity: number,
    minStock: number,
  ): Product["status"] => {
    if (quantity === 0) return "out-of-stock";
    if (quantity <= minStock) return "low-stock";
    return "in-stock";
  };

  const addStockMovement = (
    productId: string,
    type: "stock_in" | "stock_out" | "adjustment",
    quantity: number,
    reason: string,
    notes: string | undefined,
    storeName: string,
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const movement: StockMovement = {
      id: Date.now().toString(),
      productId,
      productName: product.name,
      type,
      quantity,
      reason,
      notes,
      performedBy: "Current User",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      previousQuantity: product.quantity,
      newQuantity:
        type === "stock_out"
          ? product.quantity - quantity
          : product.quantity + quantity,
      storeId: "store1",
      storeName,
      reference: `${type.toUpperCase()}-${Date.now()}`,
    };

    setStockMovements([movement, ...stockMovements]);

    const historyEntry: WarehouseHistory = {
      id: Date.now().toString() + "_history",
      action: type,
      entityType: "stock",
      entityId: productId,
      entityName: product.name,
      description: t(
        type === "stock_in"
          ? "warehouse.history_text.added_units"
          : type === "stock_out"
            ? "warehouse.history_text.removed_units"
            : "warehouse.history_text.adjusted_units",
        { count: quantity, reason: formatReason(reason) },
      ),
      performedBy: "Current User",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      details: {
        quantity,
        reason,
        notes,
        storeName,
        reference: `${type.toUpperCase()}-${Date.now()}`,
      },
    };

    setWarehouseHistory([historyEntry, ...warehouseHistory]);
  };

  const handleStockIn = async () => {
    if (
      !selectedProduct ||
      stockQuantity <= 0 ||
      !stockReason.trim() ||
      !stockLocation.trim() ||
      !stockFromType.trim() ||
      !stockFrom.trim()
    ) {
      toast({
        title: t("common.error"),
        description: t("warehouse.required_fields_error"),
        variant: "destructive",
      });
      return;
    }

    try {
      const partyMap: Record<string, string> = {
        supplier: "Supplier",
        other_filial: "Other Filial",
        customer_return: "Return from Customer",
      };
      const originName =
        stockFromType === "other_filial"
          ? filialOptions.find((f) => f.id === stockFrom)?.name || stockFrom
          : stockFrom;
      const detailedNotesIn = stockNotes.trim();

      const payload = {
        quantity: stockQuantity,
        reason: stockReason,
        filialId: stockLocation,
        party: partyMap[stockFromType] || stockFromType,
        partyType: stockFrom,
        notes: detailedNotesIn,
      };
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch(`${API_BASE}/movement/${selectedProduct.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null as any);
      if (!res.ok || !json?.ok || !json?.result) {
        throw new Error(
          json?.message || json?.error || "Failed to add stock movement",
        );
      }
      const r = json.result as any;
      // detect error wrapper returned inside result
      if (
        r &&
        ((typeof r.status === "number" && r.status >= 400) ||
          (r.response && (r.response.message || r.response.localCode)))
      ) {
        const msg =
          r.response?.message || r.message || "Failed to add stock movement";
        throw new Error(msg);
      }
      await fetchProductsFromApi();

      const movement: StockMovement = {
        id: String(r.id),
        productId: String(r.productId),
        productName: String(r.productName || selectedProduct.name),
        type: (r.type as any) || "stock_in",
        quantity: Number(r.quantity),
        reason: String(r.reason),
        notes: detailedNotesIn || undefined,
        performedBy: String(r.performedBy || "Current User"),
        date: r.date
          ? String(r.date).split("T")[0]
          : new Date().toISOString().split("T")[0],
        time: new Date(r.date || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        previousQuantity: Number(
          r.previousQuantity ?? selectedProduct.quantity,
        ),
        newQuantity: Number(
          r.newQuantity ?? selectedProduct.quantity + stockQuantity,
        ),
        storeId: String(r.storeId || ""),
        storeName: String(r.storeName || ""),
        supplier: stockFromType === "supplier" ? originName : undefined,
        customer: stockFromType === "customer_return" ? originName : undefined,
        fromStore: stockFromType === "other_filial" ? originName : undefined,
        reference: String(
          r.reference ||
            `${(((r.type as any) || "stock_in") as string).toUpperCase()}-${Date.now()}`,
        ),
      };
      setStockMovements((prev) => [movement, ...prev]);

      const historyEntry: WarehouseHistory = {
        id: `${Date.now()}_history`,
        action: movement.type,
        entityType: "stock",
        entityId: movement.productId,
        entityName: movement.productName,
        description: t(
          movement.type === "stock_in"
            ? "warehouse.history_text.added_units"
            : movement.type === "stock_out"
              ? "warehouse.history_text.removed_units"
              : "warehouse.history_text.adjusted_units",
          { count: movement.quantity, reason: formatReason(movement.reason) },
        ),
        performedBy: movement.performedBy,
        date: movement.date,
        time: movement.time,
        details: {
          quantity: movement.quantity,
          reason: movement.reason,
          notes: movement.notes,
          storeName: movement.storeName,
          supplier: stockFromType === "supplier" ? originName : undefined,
          customer:
            stockFromType === "customer_return" ? originName : undefined,
          reference:
            r.reference || `${movement.type.toUpperCase()}-${Date.now()}`,
        },
      };
      setWarehouseHistory((prev) => [historyEntry, ...prev]);

      toast({
        title: t("warehouse.toast.stock_added_title"),
        description: t("warehouse.toast.stock_added_desc", {
          quantity: movement.quantity,
          name: movement.productName,
        }),
      });
    } catch (e: any) {
      toast({
        title: t("common.error"),
        description: e?.message || "Failed to add stock",
        variant: "destructive",
      });
      return;
    }

    setStockQuantity(0);
    setStockReason("");
    setStockNotes("");
    setStockLocation("");
    setStockFrom("");
    setStockFromType("");

    setIsStockInDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleStockOut = async () => {
    if (
      !selectedProduct ||
      stockQuantity <= 0 ||
      !stockReason.trim() ||
      !stockLocation.trim() ||
      !stockToType.trim() ||
      !stockTo.trim()
    ) {
      toast({
        title: t("common.error"),
        description: t("warehouse.required_fields_error"),
        variant: "destructive",
      });
      return;
    }

    if (stockQuantity > selectedProduct.quantity) {
      toast({
        title: t("common.error"),
        description: t("warehouse.cannot_remove_more_than_available"),
        variant: "destructive",
      });
      return;
    }

    try {
      const partyMap: Record<string, string> = {
        client: "Client",
        other_filial: "Other Filial",
        discarded: "Discarded",
      };
      const destinationName =
        stockToType === "other_filial"
          ? filialOptions.find((f) => f.id === stockTo)?.name || stockTo
          : stockToType === "client"
            ? clientOptions.find((c) => c.id === stockTo)?.name || stockTo
            : stockTo;
      const notesOut = stockNotes.trim();

      const payload = {
        quantity: stockQuantity,
        reason: stockReason,
        filialId: stockLocation,
        party: partyMap[stockToType] || stockToType,
        partyType: stockTo,
        notes: notesOut,
      };
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch(
        `${API_BASE}/movement/out/${selectedProduct.id}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json().catch(() => null as any);
      if (!res.ok || !json?.ok || !json?.result) {
        throw new Error(
          json?.message || json?.error || "Failed to add stock movement",
        );
      }
      const r = json.result as any;
      // detect error wrapper returned inside result
      if (
        r &&
        ((typeof r.status === "number" && r.status >= 400) ||
          (r.response && (r.response.message || r.response.localCode)))
      ) {
        const msg =
          r.response?.message || r.message || "Failed to add stock movement";
        throw new Error(msg);
      }
      await fetchProductsFromApi();

      const movement: StockMovement = {
        id: String(r.id),
        productId: String(r.productId),
        productName: String(r.productName || selectedProduct.name),
        type: (r.type as any) || "stock_out",
        quantity: Number(r.quantity),
        reason: String(r.reason),
        notes: notesOut || undefined,
        performedBy: String(r.performedBy || "Current User"),
        date: r.date
          ? String(r.date).split("T")[0]
          : new Date().toISOString().split("T")[0],
        time: new Date(r.date || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        previousQuantity: Number(
          r.previousQuantity ?? selectedProduct.quantity,
        ),
        newQuantity: Number(
          r.newQuantity ??
            Math.max(0, selectedProduct.quantity - stockQuantity),
        ),
        storeId: String(r.storeId || ""),
        storeName: String(r.storeName || ""),
        customer: stockToType === "client" ? destinationName : undefined,
        toStore: stockToType === "other_filial" ? destinationName : undefined,
        reference: String(
          r.reference ||
            `${(((r.type as any) || "stock_out") as string).toUpperCase()}-${Date.now()}`,
        ),
      };
      setStockMovements((prev) => [movement, ...prev]);

      const historyEntry: WarehouseHistory = {
        id: `${Date.now()}_history`,
        action: movement.type,
        entityType: "stock",
        entityId: movement.productId,
        entityName: movement.productName,
        description: t(
          movement.type === "stock_in"
            ? "warehouse.history_text.added_units"
            : movement.type === "stock_out"
              ? "warehouse.history_text.removed_units"
              : "warehouse.history_text.adjusted_units",
          { count: movement.quantity, reason: formatReason(movement.reason) },
        ),
        performedBy: movement.performedBy,
        date: movement.date,
        time: movement.time,
        details: {
          quantity: movement.quantity,
          reason: movement.reason,
          notes: movement.notes,
          storeName: movement.storeName,
          customer: stockToType === "client" ? destinationName : undefined,
          reference:
            r.reference || `${movement.type.toUpperCase()}-${Date.now()}`,
        },
      };
      setWarehouseHistory((prev) => [historyEntry, ...prev]);

      toast({
        title: t("warehouse.toast.stock_removed_title"),
        description: t("warehouse.toast.stock_removed_desc", {
          quantity: movement.quantity,
          name: movement.productName,
        }),
      });
    } catch (e: any) {
      toast({
        title: t("common.error"),
        description: e?.message || "Failed to remove stock",
        variant: "destructive",
      });
      return;
    }

    setStockQuantity(0);
    setStockReason("");
    setStockNotes("");
    setStockLocation("");
    setStockTo("");
    setStockToType("");
    setDiscardReason("");
    setDiscardOther("");

    setIsStockOutDialogOpen(false);
    setSelectedProduct(null);
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.sku) {
      toast({
        title: t("common.error"),
        description: t("warehouse.required_fields_error"),
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: any = {
        name: newProduct.name!,
        description: newProduct.description || "",
        brand: newProduct.brand || "",
        sku: newProduct.sku!,
        minStock: newProduct.minStock || 0,
        maxStock: newProduct.maxStock || 0,
        costPrice: newProduct.costPrice || 0,
        sellingPrice: newProduct.sellingPrice || 0,
        // send supplier as a string
        supplier:
          newProduct.suppliers && newProduct.suppliers.length
            ? newProduct.suppliers.join(", ")
            : newProduct.supplier
              ? String(newProduct.supplier)
              : "",
        location: newProduct.location || "",
        expiryDate: newProduct.expiryDate || null,
        categoryId: categoryNameToId(newProduct.category || ""),
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null as any);
      if (!res.ok || (json && json.ok === false)) {
        throw new Error(
          (json && (json.message || json.error)) || "Failed to add product",
        );
      }

      const r = (json && json.result) || {};
      const statusText = String(r.status || "").toLowerCase();
      const statusFromApi: Product["status"] = statusText.includes("out")
        ? "out-of-stock"
        : statusText.includes("low")
          ? "low-stock"
          : statusText.includes("discontinued")
            ? "discontinued"
            : statusText
              ? "in-stock"
              : calculateStatus(
                  newProduct.quantity || 0,
                  newProduct.minStock || 0,
                );

      const product: Product = {
        id: String(r.id || Date.now()),
        name: newProduct.name!,
        category: newProduct.category!,
        brand: newProduct.brand || "",
        sku: newProduct.sku!,
        description: newProduct.description || "",
        quantity: newProduct.quantity || 0,
        stores: [],
        minStock: newProduct.minStock || 0,
        maxStock: newProduct.maxStock || 0,
        costPrice: newProduct.costPrice || 0,
        sellingPrice: newProduct.sellingPrice || 0,
        supplier:
          newProduct.suppliers && newProduct.suppliers.length
            ? newProduct.suppliers.join(", ")
            : newProduct.supplier || "",
        suppliers:
          newProduct.suppliers && newProduct.suppliers.length
            ? newProduct.suppliers
            : [],
        location: newProduct.location || "",
        expiryDate: newProduct.expiryDate || "",
        status: statusFromApi,
        tags: newProduct.tags || [],
        createdAt: (r.createdAt
          ? String(r.createdAt)
          : new Date().toISOString()
        ).split("T")[0],
        updatedAt: (r.updatedAt
          ? String(r.updatedAt)
          : new Date().toISOString()
        ).split("T")[0],
      };

      await fetchProductsFromApi();

      const historyEntry: WarehouseHistory = {
        id: Date.now().toString() + "_history",
        action: "create",
        entityType: "product",
        entityId: product.id,
        entityName: product.name,
        description: t("warehouse.history_text.created_product", {
          name: product.name,
        }),
        performedBy: "Current User",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        details: {
          category: product.category,
          brand: product.brand,
          sku: product.sku,
        },
      };

      setWarehouseHistory((prev) => [historyEntry, ...prev]);

      setNewProduct({
        name: "",
        category: "",
        brand: "",
        sku: "",
        description: "",
        quantity: 0,
        minStock: 0,
        maxStock: 0,
        costPrice: 0,
        sellingPrice: 0,
        supplier: "",
        location: "",
        expiryDate: "",
        tags: [],
        status: "in-stock",
      });
      setIsAddDialogOpen(false);

      toast({
        title: t("warehouse.toast.product_added_title"),
        description: t("warehouse.toast.product_added_desc", {
          name: product.name,
        }),
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const editProduct = async () => {
    if (
      !editingProduct ||
      !newProduct.name ||
      !newProduct.category ||
      !newProduct.sku
    ) {
      toast({
        title: t("common.error"),
        description: t("warehouse.required_fields_error"),
        variant: "destructive",
      });
      return;
    }

    const updatedProduct: Product = {
      ...editingProduct,
      name: newProduct.name!,
      category: newProduct.category!,
      brand: newProduct.brand || "",
      sku: newProduct.sku!,
      description: newProduct.description || "",
      quantity: newProduct.quantity || 0,
      minStock: newProduct.minStock || 0,
      maxStock: newProduct.maxStock || 0,
      costPrice: newProduct.costPrice || 0,
      sellingPrice: newProduct.sellingPrice || 0,
      supplier: newProduct.supplier || "",
      suppliers:
        newProduct.suppliers && newProduct.suppliers.length
          ? newProduct.suppliers
          : editingProduct.suppliers
            ? editingProduct.suppliers
            : editingProduct.supplier
              ? String(editingProduct.supplier)
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean)
              : [],
      location: newProduct.location || "",
      tags: newProduct.tags || [],
      status: calculateStatus(
        newProduct.quantity || 0,
        newProduct.minStock || 0,
      ),
      updatedAt: new Date().toISOString().split("T")[0],
    };

    const statusForApi =
      updatedProduct.status === "in-stock"
        ? "In stock"
        : updatedProduct.status === "low-stock"
          ? "Low stock"
          : updatedProduct.status === "out-of-stock"
            ? "Out of stock"
            : "Discontinued";

    try {
      const payload = {
        name: updatedProduct.name,
        description: updatedProduct.description,
        brand: updatedProduct.brand,
        sku: updatedProduct.sku,
        minStock: updatedProduct.minStock,
        maxStock: updatedProduct.maxStock,
        costPrice: updatedProduct.costPrice,
        sellingPrice: updatedProduct.sellingPrice,
        supplier:
          newProduct.suppliers && newProduct.suppliers.length
            ? newProduct.suppliers
            : updatedProduct.suppliers && updatedProduct.suppliers.length
              ? updatedProduct.suppliers
              : updatedProduct.supplier
                ? String(updatedProduct.supplier)
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
        location: updatedProduct.location,
        expiryDate: newProduct.expiryDate || null,
        status: statusForApi,
        categoryId: categoryNameToId(updatedProduct.category),
      };
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch(`${API_BASE}/products/${editingProduct.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null as any);
      if (!res.ok || (json && json.ok === false)) {
        throw new Error(
          (json && (json.message || json.error)) || "Failed to update product",
        );
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error?.message || "Failed to update product",
        variant: "destructive",
      });
      return;
    }

    await fetchProductsFromApi();

    const historyEntry: WarehouseHistory = {
      id: Date.now().toString() + "_history",
      action: "edit",
      entityType: "product",
      entityId: editingProduct.id,
      entityName: updatedProduct.name,
      description: t("warehouse.history_text.updated_product", {
        name: updatedProduct.name,
      }),
      performedBy: "Current User",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      details: { updatedFields: newProduct },
    };

    setWarehouseHistory([historyEntry, ...warehouseHistory]);

    setNewProduct({
      name: "",
      category: "",
      brand: "",
      sku: "",
      description: "",
      quantity: 0,
      minStock: 0,
      maxStock: 0,
      costPrice: 0,
      sellingPrice: 0,
      supplier: "",
      location: "",
      expiryDate: "",
      tags: [],
      status: "in-stock",
    });
    setEditingProduct(null);
    setIsEditDialogOpen(false);

    toast({
      title: t("warehouse.toast.product_updated_title"),
      description: t("warehouse.toast.product_updated_desc", {
        name: updatedProduct.name,
      }),
    });
  };

  const deleteProduct = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json().catch(() => null as any);
      if (!res.ok || (json && json.ok === false)) {
        throw new Error(
          (json && (json.message || json.error)) || "Failed to delete product",
        );
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error?.message || "Failed to delete product",
        variant: "destructive",
      });
      return;
    }

    await fetchProductsFromApi();

    const historyEntry: WarehouseHistory = {
      id: Date.now().toString() + "_history",
      action: "delete",
      entityType: "product",
      entityId: productId,
      entityName: product.name,
      description: t("warehouse.history_text.deleted_product", {
        name: product.name,
      }),
      performedBy: "Current User",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      details: { deletedProduct: product },
    };

    setWarehouseHistory([historyEntry, ...warehouseHistory]);

    toast({
      title: t("warehouse.toast.product_deleted_title"),
      description: t("warehouse.toast.product_deleted_desc", {
        name: product.name,
      }),
    });
  };

  const openStockDialog = (type: "in" | "out") => {
    setStockActionType(type);
    setIsProductSelectionOpen(true);
  };

  const selectProductForStock = (product: Product) => {
    setSelectedProduct(product);
    setIsProductSelectionOpen(false);
    if (stockActionType === "in") {
      setIsStockInDialogOpen(true);
    } else {
      setIsStockOutDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("warehouse.title")}
          </h1>
          <p className="text-muted-foreground">{t("warehouse.subtitle")}</p>
        </div>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            onClick={() => openStockDialog("in")}
          >
            <ArrowUp className="mr-2 h-4 w-4" />
            {t("warehouse.stock_in")}
          </Button>

          <Button
            variant="outline"
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            onClick={() => openStockDialog("out")}
          >
            <ArrowDown className="mr-2 h-4 w-4" />
            {t("warehouse.stock_out")}
          </Button>

          <AdminOnly>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("warehouse.add_product")}
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-2xl"
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>{t("warehouse.add_new_product")}</DialogTitle>
                <DialogDescription>
                  {t("warehouse.enter_product_details")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {t("warehouse.product_name")} *
                    </Label>
                    <Input
                      id="name"
                      placeholder={t("warehouse.enter_product_name")}
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      placeholder="APL-IP15P-128"
                      value={newProduct.sku}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, sku: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      {t("warehouse.category")} *
                    </Label>
                    <Select
                      value={newProduct.category}
                      onValueChange={(value) =>
                        setNewProduct({ ...newProduct, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("warehouse.select_category")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Smartphones">Smartphones</SelectItem>
                        <SelectItem value="Laptops">Laptops</SelectItem>
                        <SelectItem value="Tablets">Tablets</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                        <SelectItem value="Footwear">Footwear</SelectItem>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">{t("warehouse.brand")}</Label>
                    <Input
                      id="brand"
                      placeholder={t("warehouse.enter_brand_name")}
                      value={newProduct.brand}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, brand: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t("common.description")}</Label>
                  <Textarea
                    id="description"
                    placeholder={t("warehouse.product_description_placeholder")}
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minStock">{t("warehouse.min_stock")}</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      value={newProduct.minStock}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          minStock: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStock">{t("warehouse.max_stock")}</Label>
                    <Input
                      id="maxStock"
                      type="number"
                      min="0"
                      value={newProduct.maxStock}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          maxStock: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">
                      {t("warehouse.cost_price")}
                    </Label>
                    <Input
                      id="costPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProduct.costPrice}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          costPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">
                      {t("warehouse.selling_price")}
                    </Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProduct.sellingPrice}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          sellingPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">{t("warehouse.suppliers")}</Label>
                    <div className="flex flex-col">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(newProduct.suppliers || []).map((s, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
                          >
                            <span>{s}</span>
                            <button
                              type="button"
                              className="text-xs text-muted-foreground"
                              onClick={() => {
                                const copy = (
                                  newProduct.suppliers || []
                                ).slice();
                                copy.splice(i, 1);
                                setNewProduct({
                                  ...newProduct,
                                  suppliers: copy,
                                });
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="supplier"
                          placeholder={t("warehouse.add_supplier_placeholder")}
                          value={supplierInput}
                          onChange={(e) => setSupplierInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const v = supplierInput.trim();
                              if (!v) return;
                              setNewProduct({
                                ...newProduct,
                                suppliers: Array.from(
                                  new Set([...(newProduct.suppliers || []), v]),
                                ),
                              });
                              setSupplierInput("");
                            }
                          }}
                        />
                        <Button
                          variant="default"
                          onClick={() => {
                            const v = supplierInput.trim();
                            if (!v) return;
                            setNewProduct({
                              ...newProduct,
                              suppliers: Array.from(
                                new Set([...(newProduct.suppliers || []), v]),
                              ),
                            });
                            setSupplierInput("");
                          }}
                        >
                          {t("common.add")}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">{t("warehouse.location")}</Label>
                    <Input
                      id="location"
                      placeholder="A1-B2"
                      value={newProduct.location}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          location: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">
                    {t("warehouse.expiry_date")}
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newProduct.expiryDate || ""}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        expiryDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={addProduct}>
                    {t("warehouse.add_product")}
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
          </AdminOnly>
        </div>
      </div>

      {/* Product Selection Dialog */}
      <Dialog
        open={isProductSelectionOpen}
        onOpenChange={setIsProductSelectionOpen}
      >
        <DialogContent
          className="max-w-md min-h-[420px]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("warehouse.select_product")}</DialogTitle>
            <DialogDescription>
              {t("warehouse.choose_product")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("warehouse.search_products")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 mt-3 min-h-[180px]">
              {filteredProducts.map((product) => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-3 text-left focus-visible:outline-none focus-visible:ring-0"
                  onClick={() => selectProductForStock(product)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.sku} • {t("warehouse.current_stock")}:{" "}
                      {getVisibleQuantity(product)}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("warehouse.total_products")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter((p) => calculateStatus(getVisibleQuantity(p), p.minStock) === "in-stock").length}{" "}
              {t("warehouse.in_stock")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("warehouse.low_stock_alerts")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {products.filter((p) => calculateStatus(getVisibleQuantity(p), p.minStock) === "low-stock").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("warehouse.need_immediate_attention")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("warehouse.out_of_stock")}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {products.filter((p) => calculateStatus(getVisibleQuantity(p), p.minStock) === "out-of-stock").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("warehouse.require_restocking")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("warehouse.total_value")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              $
              {products
                .reduce((sum, p) => sum + p.sellingPrice, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("warehouse.current_inventory_value")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">
            {t("warehouse.inventory")}
          </TabsTrigger>
          <TabsTrigger value="movements">
            {t("warehouse.stock_movements")}
          </TabsTrigger>
          <TabsTrigger value="history">{t("warehouse.history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Product List */}
          <Card>
            <CardHeader>
              <CardTitle>{t("warehouse.product_inventory")}</CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("warehouse.search_products")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder={t("warehouse.category")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("warehouse.all_categories")}
                    </SelectItem>
                    <SelectItem value="Smartphones">Smartphones</SelectItem>
                    <SelectItem value="Laptops">Laptops</SelectItem>
                    <SelectItem value="Tablets">Tablets</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                    <SelectItem value="Footwear">Footwear</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder={t("common.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("warehouse.all_status")}
                    </SelectItem>
                    <SelectItem value="in-stock">
                      {t("warehouse.in_stock")}
                    </SelectItem>
                    <SelectItem value="low-stock">
                      {t("warehouse.low_stock")}
                    </SelectItem>
                    <SelectItem value="out-of-stock">
                      {t("warehouse.out_of_stock")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="-mx-2 sm:mx-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("warehouse.product_name")}</TableHead>
                      <TableHead>{t("warehouse.sku")}</TableHead>
                      <TableHead>{t("warehouse.category")}</TableHead>
                      <TableHead>{t("warehouse.quantity")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("warehouse.value")}</TableHead>
                      <TableHead>{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.brand}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{product.sku}</div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <div className="font-medium">{getVisibleQuantity(product)}</div>
                          <div className="text-xs text-muted-foreground">
                            {t("warehouse.min_stock")}: {product.minStock} |{" "}
                            {t("warehouse.max_stock")}: {product.maxStock}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {isProductExpired(product.expiryDate) ? (
                              getExpiredBadge()
                            ) : (
                              getStatusBadge(calculateStatus(getVisibleQuantity(product), product.minStock))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ${product.sellingPrice.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            @${product.costPrice}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AdminOnly>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingProduct(product);
                                  setNewProduct({
                                    name: product.name,
                                    category: product.category,
                                    brand: product.brand,
                                    sku: product.sku,
                                    description: product.description,
                                    quantity: product.quantity,
                                    minStock: product.minStock,
                                    maxStock: product.maxStock,
                                    costPrice: product.costPrice,
                                    sellingPrice: product.sellingPrice,
                                    supplier: product.supplier,
                                    suppliers: product.supplier
                                      ? String(product.supplier)
                                          .split(",")
                                          .map((p) => p.trim())
                                          .filter(Boolean)
                                      : [],
                                    location: product.location,
                                    expiryDate: product.expiryDate,
                                    tags: product.tags,
                                    status: product.status,
                                  });
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </AdminOnly>
                            <AdminOnly>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("warehouse.delete_product_title")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("warehouse.delete_product_confirm", {
                                        name: product.name,
                                      })}
                                      {product.name}{" "}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t("common.cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className={buttonVariants({
                                        variant: "destructive",
                                      })}
                                      onClick={() => deleteProduct(product.id)}
                                    >
                                      {t("common.delete")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </AdminOnly>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          {/* Stock Movements */}
          <Card>
            <CardHeader>
              <CardTitle>{t("warehouse.stock_movements")}</CardTitle>
              <CardDescription>
                {t("warehouse.track_all_activities")}
              </CardDescription>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                <input
                  id="movementFrom"
                  type="date"
                  value={movementFrom || ""}
                  onChange={(e) => setMovementFrom(e.target.value || null)}
                  className="h-9 rounded-md border px-2 w-full sm:w-auto"
                />
                <input
                  id="movementTo"
                  type="date"
                  value={movementTo || ""}
                  onChange={(e) => setMovementTo(e.target.value || null)}
                  className="h-9 rounded-md border px-2 w-full sm:w-auto"
                />
                <Button
                  variant="ghost"
                  onClick={async () => {
                    setMovementFrom(null);
                    setMovementTo(null);
                    setAppliedMovementFrom(null);
                    setAppliedMovementTo(null);
                    await fetchStockMovementsFromApi();
                    await fetchWarehouseHistoriesFromApi();
                  }}
                >
                  {t("common.clear")}
                </Button>
                <Button
                  variant="default"
                  onClick={async () => {
                    setAppliedMovementFrom(movementFrom);
                    setAppliedMovementTo(movementTo);
                    await fetchStockMovementsFromApi(movementFrom, movementTo);
                  }}
                >
                  {t("common.apply")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="-mx-2 sm:mx-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.date_time")}</TableHead>
                      <TableHead>{t("warehouse.product_name")}</TableHead>
                      <TableHead>{t("warehouse.type")}</TableHead>
                      <TableHead>{t("warehouse.store_location")}</TableHead>
                      <TableHead>{t("warehouse.quantity")}</TableHead>
                      <TableHead>{t("warehouse.details")}</TableHead>
                      <TableHead>{t("warehouse.reference")}</TableHead>
                      <TableHead>{t("warehouse.stock_change")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{movement.date}</div>
                            <div className="text-sm text-muted-foreground">
                              {movement.time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {movement.productName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getMovementTypeBadge(movement.type)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {movement.storeName}
                            </div>
                            {movement.type === "transfer" &&
                              movement.fromStore &&
                              movement.toStore && (
                                <div className="text-xs text-muted-foreground">
                                  {movement.toStore} → {movement.fromStore}
                                </div>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`font-medium ${
                              movement.type === "stock_in"
                                ? "text-green-600"
                                : movement.type === "stock_out"
                                  ? "text-red-600"
                                  : movement.type === "transfer"
                                    ? "text-blue-600"
                                    : "text-orange-600"
                            }`}
                          >
                            {movement.type === "stock_in"
                              ? "+"
                              : movement.type === "stock_out"
                                ? "-"
                                : movement.type === "transfer"
                                  ? "↔"
                                  : "±"}
                            {movement.quantity}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="">
                            <div className="font-medium">
                              {movement.type === "stock_in"
                                ? movement.partyName ||
                                  movement.fromStore ||
                                  t("warehouse.from")
                                : movement.party ||
                                  movement.reason ||
                                  t("warehouse.details")}
                            </div>

                            {/* Directional info and reason */}
                            <div className="text-xs text-muted-foreground mt-1">
                              {movement.type === "transfer" &&
                                movement.fromStore &&
                                movement.toStore && (
                                  <>
                                    {t("warehouse.from")}: {movement.fromStore}
                                    <br />
                                    {t("warehouse.to")}: {movement.toStore}
                                  </>
                                )}

                              {movement.type === "stock_in" && (
                                <>
                                  {movement.partyName && (
                                    <span>
                                      {t("warehouse.from")}:{" "}
                                      {movement.partyName}
                                    </span>
                                  )}
                                  {!movement.partyName &&
                                    movement.fromStore && (
                                      <span>
                                        {t("warehouse.from")}:{" "}
                                        {movement.fromStore}
                                      </span>
                                    )}
                                  {!movement.partyName &&
                                    !movement.fromStore &&
                                    movement.reason && (
                                      <span>
                                        {t("warehouse.reason")}:{" "}
                                        {formatReason(movement.reason)}
                                      </span>
                                    )}

                                  {movement.reason &&
                                    String(movement.reason)
                                      .toLowerCase()
                                      .includes("transfer") && (
                                      <>
                                        <br />
                                        {t("warehouse.reason")}:{" "}
                                        {t("warehouse.transfer")}
                                      </>
                                    )}
                                </>
                              )}

                              {movement.type === "stock_out" && (
                                <>
                                  {movement.partyName ? (
                                    <span>
                                      {t("warehouse.to")}: {movement.partyName}
                                    </span>
                                  ) : movement.toStore ? (
                                    <span>
                                      {t("warehouse.to")}: {movement.toStore}
                                    </span>
                                  ) : null}
                                  {movement.reason &&
                                    String(movement.reason)
                                      .toLowerCase()
                                      .includes("discard") && (
                                      <>
                                        <br />
                                        {t("warehouse.reason")}:{" "}
                                        {formatReason(movement.reason)}
                                      </>
                                    )}
                                </>
                              )}
                            </div>

                            {/* Notes */}
                            {movement.notes && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {t("warehouse.notes")}: {movement.notes}
                              </div>
                            )}

                            {/* Performed by */}
                            <div className="text-xs text-muted-foreground mt-1">
                              {t("warehouse.by")}: {movement.performedBy}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">
                            {movement.reference || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">
                            {movement.previousQuantity} → {movement.newQuantity}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Warehouse History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t("warehouse.history")}
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                <Select value={historyFilter} onValueChange={setHistoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder={t("warehouse.action")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("warehouse.all_actions")}
                    </SelectItem>
                    <SelectItem value="create">
                      {t("warehouse.actions.created")}
                    </SelectItem>
                    <SelectItem value="edit">
                      {t("warehouse.actions.edited")}
                    </SelectItem>
                    <SelectItem value="delete">
                      {t("warehouse.actions.deleted")}
                    </SelectItem>
                    <SelectItem value="stock_in">
                      {t("warehouse.stock_in")}
                    </SelectItem>
                    <SelectItem value="stock_out">
                      {t("warehouse.stock_out")}
                    </SelectItem>
                    <SelectItem value="transfer">
                      {t("warehouse.transfers")}
                    </SelectItem>
                    <SelectItem value="adjustment">
                      {t("warehouse.adjustments")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                  <input
                    id="historyFrom"
                    type="date"
                    value={historyFrom || ""}
                    onChange={(e) => setHistoryFrom(e.target.value || null)}
                    className="h-9 rounded-md border px-2 w-full sm:w-auto"
                  />
                  <input
                    id="historyTo"
                    type="date"
                    value={historyTo || ""}
                    onChange={(e) => setHistoryTo(e.target.value || null)}
                    className="h-9 rounded-md border px-2 w-full sm:w-auto"
                  />
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      setHistoryFrom(null);
                      setHistoryTo(null);
                      setAppliedHistoryFrom(null);
                      setAppliedHistoryTo(null);
                      await fetchWarehouseHistoriesFromApi();
                      await fetchStockMovementsFromApi();
                    }}
                  >
                    {t("common.clear")}
                  </Button>
                  <Button
                    variant="default"
                    onClick={async () => {
                      setAppliedHistoryFrom(historyFrom);
                      setAppliedHistoryTo(historyTo);
                      await fetchWarehouseHistoriesFromApi(
                        historyFrom,
                        historyTo,
                      );
                    }}
                  >
                    {t("common.apply")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="-mx-2 sm:mx-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.date_time")}</TableHead>
                      <TableHead>{t("warehouse.action")}</TableHead>
                      <TableHead>{t("warehouse.entity")}</TableHead>
                      <TableHead>{t("common.description")}</TableHead>
                      <TableHead>{t("warehouse.store_details")}</TableHead>
                      <TableHead>{t("warehouse.reference")}</TableHead>
                      <TableHead>{t("warehouse.performed_by")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{history.date}</div>
                              <div className="text-sm text-muted-foreground">
                                {history.time}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(history.action)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {history.entityType === "product" ? (
                              <Package2 className="h-4 w-4" />
                            ) : (
                              <Package className="h-4 w-4" />
                            )}
                            <div>
                              <div className="font-medium">
                                {history.entityName}
                              </div>
                              <div className="text-sm text-muted-foreground capitalize">
                                {history.entityType}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{history.description}</div>
                          {history.details?.notes && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {history.details.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {/* Show store information for stock movements */}
                            {(history.action === "stock_in" ||
                              history.action === "stock_out" ||
                              history.action === "transfer" ||
                              history.action === "adjustment") && (
                              <div>
                                {/* If party indicates other filial, show filialId name and "from → to" */}
                                {history.details?.party &&
                                String(history.details.party)
                                  .toLowerCase()
                                  .includes("filial") &&
                                history.details?.filialId &&
                                history.details?.partyType ? (
                                  (() => {
                                    const destId = String(
                                      history.details.filialId,
                                    );
                                    const srcId = String(
                                      history.details.partyType,
                                    );
                                    const dest =
                                      filialOptions.find(
                                        (f) => String(f.id) === destId,
                                      ) || null;
                                    const src =
                                      filialOptions.find(
                                        (f) => String(f.id) === srcId,
                                      ) || null;
                                    const destName = dest ? dest.name : destId;
                                    const srcName = src ? src.name : srcId;
                                    return (
                                      <div>
                                        <div className="font-medium">
                                          {destName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {destName} → {srcName}
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  // Default behavior
                                  <>
                                    {history.details?.storeName ? (
                                      <div className="font-medium">
                                        {history.details.storeName}
                                      </div>
                                    ) : history.details?.party ? (
                                      <div className="font-medium">
                                        {formatParty(history.details.party)}
                                        {history.details.partyType
                                          ? ` • ${history.details.partyType}`
                                          : ""}
                                      </div>
                                    ) : null}

                                    {history.action === "transfer" &&
                                      history.details?.fromStore &&
                                      history.details?.toStore && (
                                        <div className="text-xs text-muted-foreground">
                                          {history.details.toStore.name} →{" "}
                                          {history.details.fromStore.name}
                                        </div>
                                      )}

                                    {/* Show party and partyType in history (do not show Qty) */}
                                    {history.details?.party &&
                                    history.details?.partyType ? (
                                      <div className="text-xs text-muted-foreground">
                                        {formatParty(history.details.party)}:{" "}
                                        {(() => {
                                          const pt = String(
                                            history.details.partyType,
                                          );
                                          // Prefer client lookup first (partyType may be client id even if party says Other Filial)
                                          const c = clientOptions.find(
                                            (c) =>
                                              String(c.id) === pt ||
                                              String(c.name) === pt,
                                          );
                                          if (c) return c.name;
                                          const f = filialOptions.find(
                                            (f) =>
                                              String(f.id) === pt ||
                                              String(f.name) === pt,
                                          );
                                          return f ? f.name : pt;
                                        })()}
                                      </div>
                                    ) : history.details?.party ? (
                                      <div className="text-xs text-muted-foreground">
                                        {formatParty(history.details.party)}
                                      </div>
                                    ) : history.details?.partyType ? (
                                      <div className="text-xs text-muted-foreground">
                                        {(() => {
                                          const pt = String(
                                            history.details.partyType,
                                          );
                                          // Prefer client lookup first
                                          const c = clientOptions.find(
                                            (c) =>
                                              String(c.id) === pt ||
                                              String(c.name) === pt,
                                          );
                                          if (c) return c.name;
                                          const f = filialOptions.find(
                                            (f) =>
                                              String(f.id) === pt ||
                                              String(f.name) === pt,
                                          );
                                          return f ? f.name : pt;
                                        })()}
                                      </div>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            )}

                            {/* Show product details for product operations */}
                            {history.action === "create" && history.details && (
                              <div className="text-xs text-muted-foreground">
                                {t("warehouse.category")}:{" "}
                                {history.details.category}
                                {history.details.brand &&
                                  ` | ${t("warehouse.brand")}: ${history.details.brand}`}
                              </div>
                            )}
                            {history.action === "edit" &&
                              history.details?.updatedFields && (
                                <div className="text-xs text-muted-foreground">
                                  {t("warehouse.updated_fields_available")}
                                </div>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">
                            {history.details?.reference || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {history.performedBy}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-24 right-4 z-40 sm:hidden">
        <div className="flex gap-2">
          <Button
            className="shadow-business-lg"
            size="icon"
            aria-label="Stock In"
            onClick={() => openStockDialog("in")}
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
          <Button
            variant="destructive"
            className="shadow-business-lg"
            size="icon"
            aria-label="Stock Out"
            onClick={() => openStockDialog("out")}
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
          <AdminOnly>
          <Button
            className="shadow-business-lg"
            size="icon"
            aria-label="Add Product"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </AdminOnly>
        </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className="max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("warehouse.edit_product")}</DialogTitle>
            <DialogDescription>
              {t("warehouse.update_product_info")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editName">
                  {t("warehouse.product_name")} *
                </Label>
                <Input
                  id="editName"
                  placeholder={t("warehouse.enter_product_name")}
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSku">SKU *</Label>
                <Input
                  id="editSku"
                  placeholder="APL-IP15P-128"
                  value={newProduct.sku}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, sku: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCategory">
                  {t("warehouse.category")} *
                </Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value) =>
                    setNewProduct({ ...newProduct, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("warehouse.select_category")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Smartphones">Smartphones</SelectItem>
                    <SelectItem value="Laptops">Laptops</SelectItem>
                    <SelectItem value="Tablets">Tablets</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                    <SelectItem value="Footwear">Footwear</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editBrand">{t("warehouse.brand")}</Label>
                <Input
                  id="editBrand"
                  placeholder={t("warehouse.enter_brand_name")}
                  value={newProduct.brand}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, brand: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">{t("common.description")}</Label>
              <Textarea
                id="editDescription"
                placeholder={t("warehouse.product_description_placeholder")}
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editMinStock">{t("warehouse.min_stock")}</Label>
                <Input
                  id="editMinStock"
                  type="number"
                  min="0"
                  value={newProduct.minStock}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      minStock: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMaxStock">{t("warehouse.max_stock")}</Label>
                <Input
                  id="editMaxStock"
                  type="number"
                  min="0"
                  value={newProduct.maxStock}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      maxStock: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCostPrice">
                  {t("warehouse.cost_price")}
                </Label>
                <Input
                  id="editCostPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.costPrice}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      costPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSellingPrice">
                  {t("warehouse.selling_price")}
                </Label>
                <Input
                  id="editSellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.sellingPrice}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      sellingPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editSupplier">{t("warehouse.suppliers")}</Label>
                <div className="flex flex-col">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(newProduct.suppliers || []).map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground"
                          onClick={() => {
                            const copy = (newProduct.suppliers || []).slice();
                            copy.splice(i, 1);
                            setNewProduct({ ...newProduct, suppliers: copy });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="editSupplier"
                      placeholder={t("warehouse.add_supplier_placeholder")}
                      value={editSupplierInput}
                      onChange={(e) => setEditSupplierInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const v = editSupplierInput.trim();
                          if (!v) return;
                          setNewProduct({
                            ...newProduct,
                            suppliers: Array.from(
                              new Set([...(newProduct.suppliers || []), v]),
                            ),
                          });
                          setEditSupplierInput("");
                        }
                      }}
                    />
                    <Button
                      variant="default"
                      onClick={() => {
                        const v = editSupplierInput.trim();
                        if (!v) return;
                        setNewProduct({
                          ...newProduct,
                          suppliers: Array.from(
                            new Set([...(newProduct.suppliers || []), v]),
                          ),
                        });
                        setEditSupplierInput("");
                      }}
                    >
                      {t("common.add")}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLocation">{t("warehouse.location")}</Label>
                <Input
                  id="editLocation"
                  placeholder="A1-B2"
                  value={newProduct.location}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, location: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={editProduct}>
                {t("warehouse.update_product")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingProduct(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* {t("warehouse.stock_in")} Dialog */}
      <Dialog open={isStockInDialogOpen} onOpenChange={setIsStockInDialogOpen}>
        <DialogContent
          className="max-w-md min-h-[420px]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-green-600" />
              {t("warehouse.stock_in")}
            </DialogTitle>
            <DialogDescription>
              {t("warehouse.add_stock")} {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stockInLocation">
                {t("warehouse.location")} *
              </Label>
              <Select value={stockLocation} onValueChange={setStockLocation}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("warehouse.select_filial_location")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(stockFromType === "other_filial"
                    ? filialOptions.filter((f) => f.id !== stockFrom)
                    : filialOptions
                  ).map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockInQuantity">
                {t("warehouse.quantity_to_add")} *
              </Label>
              <Input
                id="stockInQuantity"
                type="number"
                min="1"
                value={stockQuantity}
                onChange={(e) =>
                  setStockQuantity(parseInt(e.target.value) || 0)
                }
                placeholder={t("warehouse.enter_quantity")}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stockFromType">
                  {t("warehouse.from_origin")} *
                </Label>
                <Select value={stockFromType} onValueChange={setStockFromType}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("warehouse.select_origin_type")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">
                      {t("warehouse.supplier")}
                    </SelectItem>
                    <SelectItem value="customer_return">
                      {t("warehouse.customer_return")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {stockFromType && (
                <div className="space-y-2">
                  <Label htmlFor="stockFrom">
                    {stockFromType === "supplier" && (
                      <>{t("warehouse.supplier_name")} *</>
                    )}
                    {stockFromType === "other_filial" && (
                      <>{t("warehouse.filial_branch_name")} *</>
                    )}
                    {stockFromType === "customer_return" && (
                      <>{t("warehouse.customer_name")} *</>
                    )}
                  </Label>
                  {stockFromType === "supplier" && (
                    <Select value={stockFrom} onValueChange={setStockFrom}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            supplierOptions.length
                              ? t("warehouse.choose_supplier")
                              : t("warehouse.no_suppliers_found")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {supplierOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {stockFromType === "other_filial" && (
                    <Select value={stockFrom} onValueChange={setStockFrom}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("warehouse.filial_branch_name")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filialOptions
                          .filter((f) => f.id !== stockLocation)
                          .map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                  {stockFromType === "customer_return" && (
                    <Select value={stockFrom} onValueChange={setStockFrom}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("sales.client_name")} />
                      </SelectTrigger>
                      <SelectContent>
                        {clientOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockInReason">
                    {t("warehouse.reason")} *
                  </Label>
                  <Select
                    value={stockReason}
                    onValueChange={setStockReason}
                    disabled={
                      stockFromType === "supplier" ||
                      stockFromType === "customer_return"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("warehouse.select_reason")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Purchase">
                        {t("warehouse.purchase")}
                      </SelectItem>
                      <SelectItem value="Return">
                        {t("warehouse.return")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockInNotes">
                {t("warehouse.notes_optional")}
              </Label>
              <Textarea
                id="stockInNotes"
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                placeholder={t("warehouse.additional_notes_placeholder")}
                rows={3}
              />
            </div>
            {selectedProduct && (
              <div className="p-2 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  {t("warehouse.current_stock")}:{" "}
                  <span className="font-medium">
                    {selectedProduct ? getQuantityAtLocation(selectedProduct, stockLocation) : 0}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("warehouse.new_stock")}:{" "}
                  <span className="font-medium">
                    {(selectedProduct ? getQuantityAtLocation(selectedProduct, stockLocation) : 0) + stockQuantity}
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleStockIn}>
                <ArrowUp className="mr-2 h-4 w-4" />
                {t("warehouse.add_stock")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsStockInDialogOpen(false);
                  setStockQuantity(0);
                  setStockReason("");
                  setStockNotes("");
                  setStockLocation("");
                  setStockFrom("");
                  setStockFromType("");
                  setSelectedProduct(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* {t("warehouse.stock_out")} Dialog */}
      <Dialog
        open={isStockOutDialogOpen}
        onOpenChange={setIsStockOutDialogOpen}
      >
        <DialogContent
          className="max-w-md min-h-[420px]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-red-600" />
              {t("warehouse.stock_out")}
            </DialogTitle>
            <DialogDescription>
              {t("warehouse.remove_stock")} {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stockOutLocation">
                {t("warehouse.location")} *
              </Label>
              <Select value={stockLocation} onValueChange={setStockLocation}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("warehouse.select_filial_location")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filialOptions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockOutQuantity">
                {t("warehouse.quantity_to_remove")} *
              </Label>
              <Input
                id="stockOutQuantity"
                type="number"
                min="1"
                max={selectedProduct ? getQuantityAtLocation(selectedProduct, stockLocation) : 0}
                value={stockQuantity}
                onChange={(e) =>
                  setStockQuantity(parseInt(e.target.value) || 0)
                }
                placeholder={t("warehouse.enter_quantity")}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stockToType">
                  {t("warehouse.to_destination")} *
                </Label>
                <Select value={stockToType} onValueChange={setStockToType}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("warehouse.select_destination_type")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">
                      {t("warehouse.client")}
                    </SelectItem>
                    <SelectItem value="other_filial">
                      {t("warehouse.other_filial")}
                    </SelectItem>
                    <SelectItem value="discarded">
                      {t("warehouse.discarded")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {stockToType && (
                <div className="space-y-2">
                  <Label htmlFor="stockTo">
                    {stockToType === "client" && (
                      <>{t("sales.client_name")} *</>
                    )}
                    {stockToType === "other_filial" && (
                      <>{t("warehouse.filial_branch_name")} *</>
                    )}
                  </Label>
                  {stockToType === "client" && (
                    <Select value={stockTo} onValueChange={setStockTo}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("sales.client_name")} />
                      </SelectTrigger>
                      <SelectContent>
                        {clientOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {stockToType === "other_filial" && (
                    <Select value={stockTo} onValueChange={setStockTo}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("warehouse.filial_branch_name")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filialOptions
                          .filter((f) => f.id !== stockLocation)
                          .map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                  {stockToType === "discarded" && (
                    <div className="space-y-2">
                      <Label htmlFor="discardReason">
                        {t("warehouse.discard_reason")} *
                      </Label>
                      <Select
                        value={discardReason}
                        onValueChange={(v) => {
                          setDiscardReason(v);
                          if (v !== "Other") {
                            setDiscardOther("");
                            setStockTo(v);
                          } else {
                            setStockTo("");
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("warehouse.select_reason")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Expired">
                            {t("warehouse.expired")}
                          </SelectItem>
                          <SelectItem value="Broken">
                            {t("warehouse.broken")}
                          </SelectItem>
                          <SelectItem value="Lost">
                            {t("warehouse.lost")}
                          </SelectItem>
                          <SelectItem value="Other">
                            {t("warehouse.other")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {discardReason === "Other" && (
                        <Input
                          id="discardOther"
                          value={discardOther}
                          onChange={(e) => {
                            setDiscardOther(e.target.value);
                            setStockTo(e.target.value);
                          }}
                          placeholder={t("warehouse.write_reason")}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="stockOutReason">
                    {t("warehouse.reason")} *
                  </Label>
                  <Input
                    id="stockOutReason"
                    value={stockReason}
                    readOnly
                    placeholder={t("warehouse.reason")}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockOutNotes">
                {t("warehouse.notes_optional")}
              </Label>
              <Textarea
                id="stockOutNotes"
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                placeholder={t("warehouse.additional_notes_placeholder")}
                rows={2}
                className="text-sm"
              />
            </div>
            {selectedProduct && (
              <div className="p-2 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  {t("warehouse.current_stock")}:{" "}
                  <span className="font-medium">
                    {selectedProduct ? getQuantityAtLocation(selectedProduct, stockLocation) : 0}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("warehouse.remaining_stock")}:{" "}
                  <span className="font-medium">
                    {Math.max(0, (selectedProduct ? getQuantityAtLocation(selectedProduct, stockLocation) : 0) - stockQuantity)}
                  </span>
                </div>
                {selectedProduct && stockQuantity > getQuantityAtLocation(selectedProduct, stockLocation) && (
                  <div className="text-sm text-red-600 mt-1">
                    ⚠️ {t("warehouse.cannot_remove_more_than_available")}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleStockOut}>
                <ArrowDown className="mr-2 h-4 w-4" />
                {t("warehouse.remove_stock")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsStockOutDialogOpen(false);
                  setStockQuantity(0);
                  setStockReason("");
                  setStockNotes("");
                  setStockLocation("");
                  setStockTo("");
                  setStockToType("");
                  setDiscardReason("");
                  setDiscardOther("");
                  setSelectedProduct(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent
          className="max-w-xl max-h-[85vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("warehouse.product_details")}
            </DialogTitle>
            <DialogDescription>
              {t("warehouse.product_details_desc")}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <DetailCard
              title={selectedProduct.name}
              subtitle={t("warehouse.product_details_desc")}
              left={[
                {
                  label: t("warehouse.sku"),
                  value: (
                    <div className="font-mono text-sm">
                      {selectedProduct.sku}
                    </div>
                  ),
                },
                {
                  label: t("warehouse.category"),
                  value: selectedProduct.category,
                },
                {
                  label: t("warehouse.suppliers"),
                  value: (
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.suppliers &&
                      selectedProduct.suppliers.length > 0 ? (
                        selectedProduct.suppliers.map((s, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm"
                          >
                            {s}
                          </span>
                        ))
                      ) : selectedProduct.supplier ? (
                        <div className="text-sm">
                          {selectedProduct.supplier}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">—</div>
                      )}
                    </div>
                  ),
                },
              ]}
              right={[
                {
                  label: t("common.description"),
                  value: selectedProduct.description || "—",
                },
                {
                  label: t("warehouse.location"),
                  value: selectedProduct.location || "N/A",
                },
              ]}
              stats={[
                {
                  label: t("warehouse.total_stock"),
                  value: getVisibleQuantity(selectedProduct as Product),
                },
                {
                  label: t("warehouse.min_stock"),
                  value: selectedProduct.minStock,
                },
                {
                  label: t("warehouse.max_stock"),
                  value: selectedProduct.maxStock,
                },
              ]}
            >
              {/* children: store distribution + prices */}

              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Package2 className="h-3 w-3" />
                  {t("warehouse.store_distribution")}
                </div>
                <div className="space-y-2">
                  {selectedProduct.stores.length > 0 ? (
                    visibleStores(selectedProduct.stores).map((store) => {
                      const fi = filialOptions.find(
                        (f) => f.id === store.storeId,
                      );
                      const storeType = fi?.type
                        ? t(`filials.types.${fi.type}`)
                        : t("warehouse.unknown");
                      const typeColor =
                        fi?.type === "warehouse"
                          ? "text-blue-600"
                          : fi?.type === "retail"
                            ? "text-green-600"
                            : fi?.type === "online"
                              ? "text-purple-600"
                              : "text-gray-600";
                      return (
                        <div
                          key={store.storeId}
                          className="flex items-center justify-between py-2 px-2 bg-background/80 rounded-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {filialOptions.find((f) => f.id === store.storeId)
                                ?.name ||
                                store.storeName ||
                                store.storeId}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {store.location}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div
                              className={`text-xs px-1 py-0.5 rounded bg-muted/50 ${typeColor}`}
                            >
                              {storeType}
                            </div>
                            <div className="text-sm font-bold min-w-[2rem]">
                              {store.quantity}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-muted-foreground italic py-4">
                      {t("warehouse.no_stock_distribution")}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("warehouse.cost_price_label")}
                  </div>
                  <div className="text-sm font-semibold">
                    ${selectedProduct.costPrice}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("warehouse.selling_price_label")}
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    ${selectedProduct.sellingPrice}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground border-t pt-3 mt-3">
                <div className="space-y-1">
                  <div>📍 {selectedProduct.location || "N/A"}</div>
                  <div>
                    📅 {t("warehouse.created")}: {selectedProduct.createdAt}
                  </div>
                  {selectedProduct.expiryDate && (
                    <div>
                      ⏰ {t("warehouse.expiry_date")}: {selectedProduct.expiryDate}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div>
                    🔄 {t("warehouse.updated")}: {selectedProduct.updatedAt}
                  </div>
                  <div>
                    💰 {t("warehouse.profit")}:{" "}
                    <span className="font-medium text-green-600">
                      {selectedProduct.sellingPrice > 0
                        ? (
                            ((selectedProduct.sellingPrice -
                              selectedProduct.costPrice) /
                              selectedProduct.sellingPrice) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </DetailCard>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

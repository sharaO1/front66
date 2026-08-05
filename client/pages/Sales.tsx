import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  ShoppingCart,
  Edit,
  Trash2,
  Filter,
  Eye,
  Download,
  Receipt,
  Calculator,
  Minus,
  DollarSign,
  X,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileSpreadsheet, FileJson } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  type: "retail" | "wholesale" | "distributor";
}

interface Product {
  id: string;
  name: string;
  unitPrice: number;
  category: string;
  sku?: string;
}

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  status: "active" | "inactive" | "terminated" | "on_leave";
  avatar?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientType: "retail" | "wholesale" | "distributor";
  employeeId?: string;
  employeeName?: string;
  employeeAvatar?: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: "draft" | "sent" | "borrow" | "paid" | "overdue" | "cancelled";
  paymentMethod: "cash" | "card" | "bank_transfer" | "credit";
  notes: string;
  borrow?: boolean;
  returnDate?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledDate?: string;
}

// Clients and products will be loaded from the backend API

const mockEmployees: Employee[] = [
  {
    id: "1",
    employeeId: "EMP001",
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@businesspro.com",
    department: "Sales",
    position: "Sales Manager",
    status: "active",
    avatar:
      "https://images.pexels.com/photos/25651531/pexels-photo-25651531.jpeg",
  },
  {
    id: "2",
    employeeId: "EMP002",
    firstName: "Michael",
    lastName: "Rodriguez",
    email: "michael.rodriguez@businesspro.com",
    department: "Sales",
    position: "Sales Representative",
    status: "active",
    avatar:
      "https://images.pexels.com/photos/3613388/pexels-photo-3613388.jpeg",
  },
  {
    id: "4",
    employeeId: "EMP004",
    firstName: "Jennifer",
    lastName: "Patel",
    email: "jennifer.patel@businesspro.com",
    department: "Sales",
    position: "Sales Representative",
    status: "active",
    avatar:
      "https://images.pexels.com/photos/7640433/pexels-photo-7640433.jpeg",
  },
];

const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    clientId: "1",
    clientName: "Tech Solutions Ltd",
    clientEmail: "contact@techsolutions.com",
    clientType: "wholesale",
    employeeId: "1",
    employeeName: "Sarah Chen",
    employeeAvatar:
      "https://images.pexels.com/photos/25651531/pexels-photo-25651531.jpeg",
    date: "2024-01-15T09:30:45",
    dueDate: "2024-02-15T17:00:00",
    items: [
      {
        id: "1",
        productId: "1",
        productName: "iPhone 15 Pro",
        quantity: 10,
        unitPrice: 899,
        discount: 10,
        total: 8091,
      },
      {
        id: "2",
        productId: "2",
        productName: "MacBook Air M3",
        quantity: 5,
        unitPrice: 1299,
        discount: 5,
        total: 6170.25,
      },
    ],
    subtotal: 14261.25,
    taxRate: 8.5,
    taxAmount: 1212.21,
    discountAmount: 570.45,
    total: 14903.01,
    status: "paid",
    paymentMethod: "bank_transfer",
    notes: "Wholesale order with volume discount applied",
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-002",
    clientId: "2",
    clientName: "John Smith",
    clientEmail: "john.smith@email.com",
    clientType: "retail",
    employeeId: "2",
    employeeName: "Michael Rodriguez",
    employeeAvatar:
      "https://images.pexels.com/photos/3613388/pexels-photo-3613388.jpeg",
    date: "2024-01-20T14:05:10",
    dueDate: "2024-01-25T12:00:00",
    items: [
      {
        id: "1",
        productId: "3",
        productName: "Samsung Galaxy S24",
        quantity: 1,
        unitPrice: 899,
        discount: 0,
        total: 899,
      },
    ],
    subtotal: 899,
    taxRate: 8.5,
    taxAmount: 76.42,
    discountAmount: 0,
    total: 975.42,
    status: "sent",
    paymentMethod: "card",
    notes: "Retail purchase",
  },
];

export default function Sales() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState(""); // applied values
  const [endDate, setEndDate] = useState(""); // applied values
  const [tempStartDate, setTempStartDate] = useState(""); // editing values
  const [tempEndDate, setTempEndDate] = useState(""); // editing values
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [useExistingClient, setUseExistingClient] = useState(true);
  const [forBorrow, setForBorrow] = useState(false);

  // Default return date for borrowed items: 7 days from today
  const defaultReturnDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const [borrowReturnDate, setBorrowReturnDate] =
    useState<string>(defaultReturnDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // PDF export dialog state
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [pdfPeriod, setPdfPeriod] = useState<
    "today" | "last_month" | "last_year"
  >("today");
  const isMobile = useIsMobile();
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const barcodeScanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const justScannedRef = useRef(false);
  const quantityInputRef = useRef<HTMLInputElement | null>(null);

  const closeExportLayers = () => {
    setExportMenuOpen(false);
    setIsPdfDialogOpen(false);
    try {
      const el = document.activeElement as HTMLElement | null;
      el?.blur?.();
    } catch {}
    try {
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    } catch {}
  };

  // Real clients/products will be loaded from backend
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientType: "retail",
    employeeId: "",
    employeeName: "",
    items: [],
    taxRate: 0,
    discountAmount: 0,
    paymentMethod: "cash",
    notes: "",
  });
  const [currentItem, setCurrentItem] = useState<Partial<InvoiceItem>>({
    productId: "",
    productName: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
  });
  const { toast } = useToast();

  const handleBarcodeScanned = useCallback(
    (sku: string) => {
      const product = products.find(
        (p) => p.sku?.toLowerCase() === sku.toLowerCase(),
      );
      if (!product) {
        toast({
          title: "Product Not Found",
          description: `No product found with SKU: ${sku}`,
          variant: "destructive",
        });
        return;
      }

      const wasDialogClosed = !isCreateDialogOpen;

      // Mark that a barcode was just scanned to prevent accidental invoice creation
      justScannedRef.current = true;
      if (barcodeScanTimeoutRef.current) {
        clearTimeout(barcodeScanTimeoutRef.current);
      }
      barcodeScanTimeoutRef.current = setTimeout(() => {
        justScannedRef.current = false;
      }, 500);

      // Set current item (this will select it in the product dropdown)
      setCurrentItem({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        discount: 0,
      });

      if (wasDialogClosed) {
        setIsCreateDialogOpen(true);
        // Give dialog time to render and focus quantity input
        setTimeout(() => {
          quantityInputRef.current?.focus();
        }, 100);
      } else {
        // Dialog is already open, focus quantity input immediately
        quantityInputRef.current?.focus();
      }
    },
    [products, isCreateDialogOpen, toast],
  );

  // Reset form state when dialog closes, and focus body when dialog opens to enable barcode scanning
  useEffect(() => {
    if (!isCreateDialogOpen) {
      clearNewInvoice();
    } else {
      // When dialog opens, blur any focused input to allow barcode scanning
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (
          (activeElement && activeElement.tagName === "INPUT") ||
          activeElement?.tagName === "SELECT" ||
          activeElement?.tagName === "BUTTON"
        ) {
          activeElement.blur();
        }
      }, 100);
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isQuantityInput = activeElement?.id === "quantity";
      const isDiscountInput = activeElement?.id === "discount";
      const isItemRelatedInput = isQuantityInput || isDiscountInput;
      const isOtherInput =
        (activeElement?.tagName === "INPUT" && !isItemRelatedInput) ||
        activeElement?.tagName === "TEXTAREA";

      // Handle Enter key
      if (event.key === "Enter") {
        event.preventDefault();

        // If a product is selected and Enter is pressed from quantity or discount field, add item
        if (currentItem.productId && isItemRelatedInput) {
          addItemToInvoice();
          return;
        }

        // If a product is selected and Enter is pressed (not from other inputs), add item
        if (currentItem.productId && !isOtherInput && isCreateDialogOpen) {
          addItemToInvoice();
          return;
        }

        // If a product is selected but Enter from another field (like notes), don't do anything
        if (currentItem.productId && isOtherInput) {
          return;
        }

        // If barcode buffer has content and not in an input field, treat as barcode scan
        if (!isOtherInput && barcodeBuffer.trim().length > 0) {
          handleBarcodeScanned(barcodeBuffer.trim());
          setBarcodeBuffer("");
          if (barcodeTimeoutRef.current) {
            clearTimeout(barcodeTimeoutRef.current);
          }
          return;
        }

        // If no product selected and dialog is open, create invoice
        // But don't do this if a barcode was just scanned (prevents error)
        if (
          !currentItem.productId &&
          isCreateDialogOpen &&
          !justScannedRef.current
        ) {
          createInvoice();
        }
        return;
      }

      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      // Allow barcode scanning even if Select is focused, but not text inputs or textareas
      if (isItemRelatedInput) {
        return;
      }

      // Allow barcode input if a text input is focused but only certain ones (prevent barcode in text inputs)
      if (activeElement?.tagName === "INPUT" && !isItemRelatedInput) {
        return;
      }

      if (activeElement?.tagName === "TEXTAREA") {
        return;
      }

      // If product is selected and not in any input field, allow numbers to be quantity
      if (currentItem.productId) {
        const char = event.key;
        if (/\d/.test(char)) {
          event.preventDefault();
          const currentQuantity = currentItem.quantity || 0;
          const newQuantity = currentQuantity * 10 + parseInt(char);
          setCurrentItem({
            ...currentItem,
            quantity: newQuantity,
          });
        } else if (char === "Backspace" || char === "Delete") {
          event.preventDefault();
          const currentQuantity = currentItem.quantity || 0;
          const newQuantity = Math.floor(currentQuantity / 10);
          setCurrentItem({
            ...currentItem,
            quantity: newQuantity,
          });
        }
        return;
      }

      // Otherwise, treat as barcode input
      const char = event.key;
      if (char.length === 1 && /[a-zA-Z0-9\-]/i.test(char)) {
        event.preventDefault();
        const newBuffer = barcodeBuffer + char;
        setBarcodeBuffer(newBuffer);

        if (barcodeTimeoutRef.current) {
          clearTimeout(barcodeTimeoutRef.current);
        }

        barcodeTimeoutRef.current = setTimeout(() => {
          setBarcodeBuffer("");
        }, 2000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, [
    barcodeBuffer,
    products,
    isCreateDialogOpen,
    currentItem,
    handleBarcodeScanned,
  ]);

  const buildInvoiceReport = (inv: Invoice) => {
    const sep = "========================================";
    const line = (s: string) => s;
    const money = (n: number) => `${n.toFixed(2)}c`;
    const fmtDate = (d: string) =>
      new Date(d).toLocaleString(i18n.language || "en");

    const title = `${t("sales.report.invoice_heading", "INVOICE")} ${inv.invoiceNumber}`;

    const clientSection = [
      `${t("sales.report.client_information", "Client Information")}:
------------------`,
      `${t("common.name")}: ${inv.clientName}`,
      `${t("common.email")}: ${inv.clientEmail}`,
      `${t("clients.type", "Type")}: ${t(`clients.${inv.clientType}`)}`,
      !inv.borrow
        ? `${t("sales.payment_method")}: ${t(`sales.${inv.paymentMethod}`)}`
        : "",
    ].join("\n");

    const detailsSection = [
      `${t("sales.report.invoice_details", "Invoice Details")}:
---------------`,
      `${t("common.date")}: ${fmtDate(inv.date)}`,
      `${t("sales.due_date", "Due Date")}: ${inv.dueDate ? fmtDate(inv.dueDate) : "-"}`,
      `${t("common.status")}: ${t(`status.${inv.status}`)}`,
      inv.employeeName
        ? `${t("sales.sales_employee", "Sales Employee")}: ${inv.employeeName}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const itemsHeader = `${t("sales.invoice_items")}:\n------`;
    const itemsBody = inv.items
      .map(
        (item, index) =>
          `${index + 1}. ${item.productName}
   ${t("sales.qty")} : ${item.quantity}
   ${t("sales.unit_price")}: ${money(item.unitPrice)}
   ${t("sales.discount")}: ${item.discount}%
   ${t("common.total")}: ${money(item.total)}`,
      )
      .join("\n\n");

    const summarySection = [
      `${t("sales.report.summary", "Summary")}:
--------`,
      `${t("sales.subtotal")}: ${money(inv.subtotal)}`,
      `${t("sales.tax")} (${inv.taxRate}%): ${money(inv.taxAmount)}`,
      inv.discountAmount > 0
        ? `${t("sales.discount")}: -${money(inv.discountAmount)}`
        : "",
      `${t("common.total").toUpperCase()}: ${money(inv.total)}`,
    ]
      .filter(Boolean)
      .join("\n");

    const notes = inv.notes ? `\n${t("common.notes")}: ${inv.notes}\n` : "\n";
    const generated = `${t("sales.report.generated_on", "Generated on")}: ${new Date().toLocaleString(i18n.language || "en")}`;

    return [
      title,
      sep,
      "",
      clientSection,
      "",
      detailsSection,
      "",
      itemsHeader,
      itemsBody,
      "",
      summarySection,
      notes,
      generated,
    ].join("\n");
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toCSV = (rows: any[], headers: string[]) => {
    const escape = (val: any) => {
      const s = String(val ?? "");
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const lines = [headers.join(",")];
    for (const r of rows)
      lines.push(headers.map((h) => escape(r[h])).join(","));
    return lines.join("\n");
  };

  const handleExportCSV = () => {
    setExportMenuOpen(false);
    const headers = [
      "invoiceNumber",
      "date",
      "clientName",
      "clientEmail",
      "employeeName",
      "status",
      "paymentMethod",
      "subtotal",
      "taxRate",
      "taxAmount",
      "discountAmount",
      "total",
    ];
    const rows = sortedInvoices
      .filter((inv) => inv.status === "paid" || inv.borrow)
      .map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        date: new Date(inv.date).toISOString(),
        clientName: inv.clientName,
        clientEmail: inv.clientEmail,
        employeeName: inv.employeeName || "",
        status: inv.status,
        paymentMethod: inv.paymentMethod,
        subtotal: inv.subtotal,
        taxRate: inv.taxRate,
        taxAmount: inv.taxAmount,
        discountAmount: inv.discountAmount,
        total: inv.total,
      }));
    const csv = toCSV(rows, headers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const today = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `sales-report-${today}.csv`);
  };

  const handleExportJSON = () => {};

  const handleExportExcel = () => {
    setExportMenuOpen(false);
    const headers = [
      t("sales.invoice_number"),
      t("clients.client", { defaultValue: "Client" }),
      t("common.date"),
      t("common.amount"),
      t("common.status"),
    ];
    const rows = filteredInvoices
      .filter((inv) => inv.status === "paid" || inv.borrow)
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(
        (inv) =>
          `<tr>
            <td>${inv.invoiceNumber}</td>
            <td>${inv.clientName}</td>
            <td>${formatDateTime(inv.date)}</td>
            <td>${inv.total.toFixed(2)}</td>
            <td>${inv.borrow ? t("finance.borrow", "Borrow") : t(`status.${inv.status}`)}</td>
          </tr>`,
      )
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8" /><style>
      body{font-family:Inter,Arial,sans-serif}
      .header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
      .brand{width:36px;height:36px;border-radius:8px;border:1px solid #e5e7eb;object-fit:contain}
      .seal{width:44px;height:44px;border:3px solid #2563eb;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff;box-shadow:0 0 0 4px rgba(37,99,235,.12)}
      .seal .text{color:#2563eb;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      h1{font-size:16px;margin:0}
      .subtitle{color:#64748b;font-size:12px}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left;font-size:12px}
      th{background:#f8fafc}
    </style></head><body>
      <div class="header">
        <div class="seal"><div class="text">${t("sales.official_seal", "Official Seal")}</div></div>
        <div>
          <h1>${t("navigation.sales")} ��� ${t("dashboard.recent_activity", "Recent Activity")}</h1>
          <div class="subtitle">${new Date().toLocaleString(i18n.language || "en")}</div>
        </div>
      </div>
      <table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const today = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `sales-report-${today}.xls`);
  };

  // Open a print window using a hidden iframe (reduces browser freezes)
  const openPrintWindow = (html: string, title: string) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>${title}</title>
      <style>
        :root { --primary: #2563eb; --muted:#f8fafc; --text:#0f172a; }
        * { box-sizing: border-box; }
        body { font-family: Inter, system-ui, -apple-system, sans-serif; color: var(--text); margin: 0; background: #ffffff; }
        .container { max-width: 1000px; margin: 24px auto; padding: 24px; }
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 2px 6px rgba(0,0,0,.04); }
        .header { display:flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .brandwrap { display:flex; align-items:center; gap:12px; }
        .brand { width: 36px; height: 36px; border-radius: 8px; object-fit: contain; border: 1px solid #e5e7eb; background:#fff; }
        .stamp { position: fixed; right: 32px; bottom: 32px; width: 120px; height: 120px; z-index: 1000; opacity: 1; }
        .stamp svg { width: 100%; height: 100%; }
        h1 { font-size: 24px; margin: 0 0 8px; }
        .subtitle { color:#64748b; font-size: 14px; }
        .badge { display:inline-block; padding: 4px 10px; background: rgba(37,99,235,.08); color: var(--primary); border:1px solid rgba(37,99,235,.18); border-radius: 999px; font-weight: 600; font-size: 12px; }
        .meta { text-align:right; }
        .meta .date { font-size:14px; font-weight:700; color:#0f172a; }
        .meta .generated { font-size:12px; color:#64748b; margin-top:4px; }
        .grid { display:grid; grid-template-columns: 1fr; gap:16px; }
        .section h3 { margin: 0 0 8px; font-size: 14px; color:#334155; text-transform: uppercase; letter-spacing:.06em; }
        table { width:100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        th { background: var(--muted); color:#334155; font-weight:600; }
        tfoot td { font-weight: 700; }
        .right { text-align:right; }
        .muted { color:#64748b; }
        .totals { margin-top: 12px; }
        .totals .row { display:flex; justify-content: space-between; padding: 6px 0; }
        .footer { margin-top: 16px; color:#64748b; font-size:12px; }
        @media print { .no-print { display:none; } body { background:white; } .card { box-shadow:none; border:0; } .stamp { right: 24px; bottom: 24px; } }
      </style>
    </head><body>${html}</body></html>`);
    doc.close();

    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    };

    const doPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {}
      setTimeout(cleanup, 800);
    };

    if (iframe.contentWindow?.document.readyState === "complete") {
      setTimeout(doPrint, 200);
    } else {
      iframe.onload = () => setTimeout(doPrint, 200);
    }
  };

  const formatCurrency = (n: number) =>
    `${new Intl.NumberFormat(i18n.language || "en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)}c`;

  const formatDateTime = (
    d: string | Date,
    opts?: Intl.DateTimeFormatOptions,
  ) =>
    new Intl.DateTimeFormat(
      i18n.language || "en",
      opts || {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(new Date(d));

  const toMs = (v: string | number | Date): number => {
    if (v instanceof Date) return v.getTime();
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const tryParse = (s: string) => {
        const d = new Date(s);
        const t = d.getTime();
        return Number.isFinite(t) ? t : NaN;
      };
      let s = v.trim();
      let t = tryParse(s);
      if (!Number.isFinite(t)) t = tryParse(s.replace(/,/g, ""));
      if (!Number.isFinite(t)) {
        const m = s.match(
          /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i,
        );
        if (m) {
          const a = parseInt(m[1], 10);
          const b = parseInt(m[2], 10);
          const yyyy = parseInt(m[3], 10);
          let hh = m[4] ? parseInt(m[4], 10) : 0;
          const mm = m[5] ? parseInt(m[5], 10) : 0;
          const ss = m[6] ? parseInt(m[6], 10) : 0;
          const ampm = m[7]?.toUpperCase();
          if (ampm === "PM" && hh < 12) hh += 12;
          if (ampm === "AM" && hh === 12) hh = 0;
          const day = a > 12 ? a : b;
          const mon = a > 12 ? b : a;
          t = new Date(yyyy, mon - 1, day, hh, mm, ss).getTime();
        }
      }
      if (!Number.isFinite(t) && /T\d{2}:\d{2}/.test(s) && !/[zZ]$/.test(s)) {
        t = Date.parse(`${s}Z`);
      }
      return Number.isFinite(t) ? t : 0;
    }
    return 0;
  };

  const renderOfficialSealSVG = (brand = "OLIMPY") => `
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-label="Official Seal">
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#1e40af"/>
        </linearGradient>
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#1e3a8a" flood-opacity="0.25"/>
        </filter>
      </defs>
      <circle cx="60" cy="60" r="56" fill="#ffffff" opacity="0.9"/>
      <circle cx="60" cy="60" r="54" fill="none" stroke="url(#ringGrad)" stroke-width="6" filter="url(#softShadow)"/>
      <circle cx="60" cy="60" r="40" fill="none" stroke="#93c5fd" stroke-width="2" stroke-dasharray="4 6"/>
      <g font-family="Inter, system-ui, -apple-system, sans-serif" text-anchor="middle">
        <text x="60" y="58" font-size="18" font-weight="800" fill="#1e3a8a" letter-spacing="1">${brand}</text>
        <text x="60" y="76" font-size="10" font-weight="700" fill="#2563eb" letter-spacing=".3em">OFFICIAL SEAL</text>
      </g>
    </svg>`;

  const buildSalesReportHTML = (
    period: "today" | "last_month" | "last_year",
    dateStr: string,
    data: Invoice[],
  ) => {
    const periodLabel =
      period === "today"
        ? `${t("sales.today")} (${dateStr})`
        : period === "last_month"
          ? `${t("sales.this_month", "This Month")} (${dateStr})`
          : `${t("finance.last_12_months", "Last 12 Months")} (${dateStr})`;

    // Include only paid or borrow invoices in the report
    const included = data.filter((i) => i.status === "paid" || i.borrow);
    const sorted = included
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totals = sorted.reduce(
      (acc, inv) => {
        acc.subtotal += Number(inv.subtotal) || 0;
        acc.tax += Number(inv.taxAmount) || 0;
        acc.discount += Number(inv.discountAmount) || 0;
        acc.total += Number(inv.total) || 0;
        return acc;
      },
      { subtotal: 0, tax: 0, discount: 0, total: 0 },
    );

    const PAGE_SIZE = 40; // auto-split into multiple printed pages
    const pages: Invoice[][] = [];
    for (let i = 0; i < sorted.length; i += PAGE_SIZE) {
      pages.push(sorted.slice(i, i + PAGE_SIZE));
    }

    const renderRows = (items: Invoice[]) =>
      items
        .map(
          (inv) => `<tr>
          <td>${inv.invoiceNumber}</td>
          <td>${inv.clientName}</td>
          <td>${formatDateTime(inv.date)}</td>
          <td class="right">${formatCurrency(inv.total)}</td>
          <td><span class="badge">${inv.borrow ? t("finance.borrow", "Borrow") : t(`status.${inv.status}`)}</span></td>
        </tr>`,
        )
        .join("");

    const totalPages = pages.length;
    const tables = pages
      .map(
        (group, idx) => `
        ${idx > 0 ? '<div class="page-break"></div>' : ""}
        <div class="page-head">
          <div><strong>${t("navigation.sales")} ��� ${t("dashboard.recent_activity", "Recent Activity")}</strong></div>
          <div class="meta-small">${t("common.date")}: ${periodLabel} • ${t("sales.report.generated_on", "Generated on")}: ${formatDateTime(new Date())} • ${t("common.page", { defaultValue: "Page" })} ${idx + 1}/${totalPages}</div>
        </div>
        <div class="section">
          <table>
            <thead>
              <tr>
                <th>${t("sales.invoice_number")}</th>
                <th>${t("clients.client", "Client")}</th>
                <th>${t("common.date")}</th>
                <th class="right">${t("common.amount")}</th>
                <th>${t("common.status")}</th>
              </tr>
            </thead>
            <tbody>${renderRows(group) || `<tr><td colspan="5" class="muted">${t("clients.no_products", "No data")}</td></tr>`}</tbody>
          </table>
        </div>`,
      )
      .join("");

    return `
      <style>
        body{font-family:Inter,Arial,sans-serif}
        @media print{ .page-break{ page-break-before: always; } thead{display:table-header-group} tfoot{display:table-footer-group} }
        .page-head{display:flex;justify-content:space-between;align-items:flex-end;margin:8px 0 6px;border-bottom:1px solid #e5e7eb;padding-bottom:6px}
        .page-head .meta-small{color:#64748b;font-size:12px}
        table{border-collapse:collapse;width:100%}
        th,td{border-bottom:1px solid #e5e7eb;padding:10px 12px;text-align:left;font-size:12px}
        tbody tr:nth-child(even){background:#f8fafc}
        th:nth-child(1){width:18%}
        th:nth-child(2){width:32%}
        th:nth-child(3){width:22%}
        th:nth-child(4){width:14%}
        th:nth-child(5){width:14%}
      </style>
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="brandwrap">
              <div>
                <h1>${t("navigation.sales")} — ${t("dashboard.recent_activity", "Recent Activity")}</h1>
                <div class="subtitle">${t("finance.report_title", "FINANCIAL REPORT").replace("FINANCIAL", t("navigation.sales"))}</div>
              </div>
            </div>
            <div class="meta"><div class="date">${t("common.date")}: ${periodLabel}</div><div class="generated">${t("sales.report.generated_on", "Generated on")}: ${formatDateTime(new Date())}</div></div>
          </div>
          <div class="section" style="margin:16px 0;">
            <div class="grid">
              <div>
                <h3>${t("dashboard.kpi_at_glance", "KPI at a glance")}</h3>
                <div class="totals">
                  <div class="row"><span>${t("sales.total_invoices")}</span><span class="right">${sorted.length}</span></div>
                  <div class="row"><span>${t("sales.total_revenue")}</span><span class="right">${formatCurrency(totals.total)}</span></div>
                  <div class="row"><span>${t("sales.subtotal")}</span><span class="right">${formatCurrency(totals.subtotal)}</span></div>
                  <div class="row"><span>${t("sales.tax")}</span><span class="right">${formatCurrency(totals.tax)}</span></div>
                  <div class="row"><span>${t("sales.discount")}</span><span class="right">-${formatCurrency(totals.discount)}</span></div>
                </div>
              </div>
            </div>
          </div>
          ${tables}
          <div class="footer">${t("sales.report.generated_on", "Generated on")}: ${formatDateTime(new Date())}</div>
        </div>
      </div>
      <div class="stamp">${renderOfficialSealSVG("OLIMPY")}</div>`;
  };

  const handleExportPDF = () => {
    const now = new Date();

    const startOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const endOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    const getPeriodRange = (
      period: "today" | "last_month" | "last_year",
    ): { start: Date; end: Date; label: string } => {
      if (period === "today") {
        const start = startOfDay(now);
        const end = endOfDay(now);
        const label = new Intl.DateTimeFormat(i18n.language || "en", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(now);
        return { start, end, label };
      }

      if (period === "last_month") {
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
          0,
          0,
          0,
          0,
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );
        const label = new Intl.DateTimeFormat(i18n.language || "en", {
          year: "numeric",
          month: "long",
        }).format(now);
        return { start, end, label };
      }

      // Last 12 months (rolling): from first day of the month 12 months ago to end of current month
      const start = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );
      const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      const fmt = new Intl.DateTimeFormat(i18n.language || "en", {
        month: "short",
        year: "numeric",
      });
      const label = `${fmt.format(start)} – ${fmt.format(end)}`;
      return { start, end, label };
    };

    const { start, end, label } = getPeriodRange(pdfPeriod);

    // Export should ignore table search/status filters; use full dataset
    const data = invoices
      .filter((i) => {
        const ms = toMs(i.date);
        return ms >= start.getTime() && ms <= end.getTime();
      })
      .filter((i) => i.status === "paid" || i.borrow);

    const html = buildSalesReportHTML(pdfPeriod, label, data);
    closeExportLayers();
    setTimeout(() => {
      openPrintWindow(
        html,
        `${t("navigation.sales")} ${t("common.export")} PDF`,
      );
    }, 50);
  };

  const buildInvoicePDF = (inv: Invoice) => {
    const money = (n: number) => formatCurrency(n);
    const items = inv.items
      .map(
        (it, idx) => `<tr>
      <td>${idx + 1}</td>
      <td>${it.productName}</td>
      <td class="right">${it.quantity}</td>
      <td class="right">${money(it.unitPrice)}</td>
      <td class="right">${it.discount}%</td>
      <td class="right">${money(it.total)}</td>
    </tr>`,
      )
      .join("");

    const html = `
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="brandwrap">
              <div>
                <h1>${t("sales.report.invoice_heading", "INVOICE")} ${inv.invoiceNumber}</h1>
                <div class="subtitle">${t("sales.invoice_details")}</div>
              </div>
            </div>
            <div class="badge">${t(`status.${inv.status}`)}</div>
          </div>
          <div class="section" style="margin-top:16px;">
            <div class="grid">
              <div>
                <h3>${t("sales.client_information")}</h3>
                <div class="totals">
                  <div class="row"><span>${t("common.name")}</span><span class="right">${inv.clientName}</span></div>
                  <div class="row"><span>${t("common.email")}</span><span class="right">${inv.clientEmail || "-"}</span></div>
                  <div class="row"><span>${t("clients.type", "Type")}</span><span class="right">${t(`clients.${inv.clientType}`)}</span></div>
                  ${!inv.borrow ? `<div class="row"><span>${t("sales.payment_method")}</span><span class="right">${t(`sales.${inv.paymentMethod}`)}</span></div>` : ""}
                </div>
              </div>
              <div>
                <h3>${t("sales.report.invoice_details", "Invoice Details")}</h3>
                <div class="totals">
                  <div class="row"><span>${t("common.date")}</span><span class="right">${formatDateTime(inv.date)}</span></div>
                  <div class="row"><span>${t("sales.due_date", "Due Date")}</span><span class="right">${inv.dueDate ? formatDateTime(inv.dueDate) : "-"}</span></div>
                  ${inv.employeeName ? `<div class="row"><span>${t("sales.sales_employee", "Sales Employee")}</span><span class="right">${inv.employeeName}</span></div>` : ""}
                </div>
              </div>
            </div>
          </div>
          <div class="section">
            <h3>${t("sales.invoice_items")}</h3>
            <table>
              <thead><tr>
                <th>#</th><th>${t("sales.product_name")}</th><th class="right">${t("sales.qty")}</th><th class="right">${t("sales.unit_price")}</th><th class="right">${t("sales.discount")}</th><th class="right">${t("common.total")}</th>
              </tr></thead>
              <tbody>${items}</tbody>
            </table>
          </div>
          <div class="section">
            <div class="grid">
              <div></div>
              <div>
                <div class="totals">
                  <div class="row"><span>${t("sales.subtotal")}</span><span class="right">${money(inv.subtotal)}</span></div>
                  <div class="row"><span>${t("sales.tax")} (${inv.taxRate}%)</span><span class="right">${money(inv.taxAmount)}</span></div>
                  ${inv.discountAmount > 0 ? `<div class="row"><span>${t("sales.discount")}</span><span class="right">-${money(inv.discountAmount)}</span></div>` : ""}
                  <div class="row" style="font-weight:700;"><span>${t("common.total").toUpperCase()}</span><span class="right">${money(inv.total)}</span></div>
                </div>
              </div>
            </div>
          </div>
          ${inv.notes ? `<div class="section"><h3>${t("common.notes")}</h3><div class="muted">${inv.notes}</div></div>` : ""}
          <div class="footer">${t("sales.report.generated_on", "Generated on")}: ${formatDateTime(new Date())}</div>
        </div>
      </div>
      <div class="stamp">${renderOfficialSealSVG("OLIMPY")}</div>`;

    openPrintWindow(
      html,
      `${t("sales.report.invoice_heading", "INVOICE")} ${inv.invoiceNumber}`,
    );
  };

  const { t, i18n } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);

  const clearCurrentItem = () => {
    // Blur any focused input to prevent scanned SKU from going to quantity field
    const activeElement = document.activeElement as HTMLElement;
    if (
      activeElement &&
      (activeElement.id === "quantity" || activeElement.id === "discount")
    ) {
      activeElement.blur();
    }
    setCurrentItem({
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
    });
  };

  const handleAddItemWithProduct = (productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId);
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Product not found",
        variant: "destructive",
      });
      return;
    }

    const itemData: Partial<InvoiceItem> = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: currentItem.quantity || 1,
      unitPrice: selectedProduct.unitPrice,
      discount: currentItem.discount || 0,
    };

    addItemToInvoice(itemData);
  };

  const clearNewInvoice = () => {
    setNewInvoice({
      clientId: "",
      clientName: "",
      clientEmail: "",
      clientType: "retail",
      employeeId: "",
      employeeName: "",
      items: [],
      taxRate: 0,
      discountAmount: 0,
      paymentMethod: "cash",
      notes: "",
    });
    clearCurrentItem();
    setUseExistingClient(true);
    setForBorrow(false);
    setBorrowReturnDate(defaultReturnDate);
  };

  const metrics = useMemo(() => {
    // Only count revenue from paid invoices
    const revenue = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    // Pending is everything not paid and not cancelled
    const pending = invoices
      .filter((i) => i.status !== "paid" && i.status !== "cancelled")
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const cancelled = invoices.filter((i) => i.status === "cancelled").length;
    return { revenue, pending, cancelled };
  }, [invoices]);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.employeeName &&
        invoice.employeeName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    // Date filtering logic
    let matchesDate = true;
    if (dateFilter !== "all") {
      const invoiceDate = new Date(invoice.date);
      const today = new Date();

      switch (dateFilter) {
        case "today": {
          matchesDate =
            invoiceDate.getFullYear() === today.getFullYear() &&
            invoiceDate.getMonth() === today.getMonth() &&
            invoiceDate.getDate() === today.getDate();
          break;
        }
        case "last_week": {
          const start = new Date(today);
          start.setDate(today.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          const end = new Date(today);
          end.setHours(23, 59, 59, 999);
          matchesDate = invoiceDate >= start && invoiceDate <= end;
          break;
        }
        case "last_month": {
          const lastMonth = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1,
          );
          const start = new Date(
            lastMonth.getFullYear(),
            lastMonth.getMonth(),
            1,
          );
          const end = new Date(
            lastMonth.getFullYear(),
            lastMonth.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          );
          matchesDate = invoiceDate >= start && invoiceDate <= end;
          break;
        }
        case "last_year": {
          const start = new Date(today);
          start.setFullYear(today.getFullYear() - 1);
          start.setHours(0, 0, 0, 0);
          const end = new Date(today);
          end.setHours(23, 59, 59, 999);
          matchesDate = invoiceDate >= start && invoiceDate <= end;
          break;
        }
        case "custom": {
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = invoiceDate >= start && invoiceDate <= end;
          }
          break;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const sortedInvoices = useMemo(
    () =>
      filteredInvoices
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [filteredInvoices],
  );

  const getStatusBadge = (status: string, borrow?: boolean) => {
    if (status === "borrow") {
      return (
        <Badge variant="default" className="bg-purple-100 text-purple-800">
          {t("finance.borrow", "Borrow")}
        </Badge>
      );
    }
    switch (status) {
      case "draft":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {t("status.draft")}
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            {t("status.sent")}
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t("status.paid")}
          </Badge>
        );
      case "overdue":
        return <Badge variant="destructive">{t("status.overdue")}</Badge>;
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            {t("status.cancelled")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("common.unknown")}</Badge>;
    }
  };

  const canDownloadInvoice = (inv: Invoice) =>
    inv.status === "borrow" ||
    inv.status === "paid" ||
    inv.status === "cancelled";

  const calculateItemTotal = (item: Partial<InvoiceItem>) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const discount = item.discount || 0;
    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const calculateInvoiceTotal = (
    items: InvoiceItem[],
    taxRate: number = 0,
    discountAmount: number = 0,
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discountAmount;
    return { subtotal, taxAmount, total };
  };

  const addItemToInvoice = (itemData?: Partial<InvoiceItem>) => {
    const itemToAdd = itemData || currentItem;
    const quantity = itemToAdd.quantity || 1;

    if (!itemToAdd.productId || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a product and enter quantity",
        variant: "destructive",
      });
      return;
    }

    const product = products.find((p) => p.id === itemToAdd.productId);
    if (!product) {
      toast({
        title: "Error",
        description: "Selected product not found",
        variant: "destructive",
      });
      return;
    }

    const newDiscount = itemToAdd.discount || 0;

    // Check if an item with the same product ID and discount already exists
    const existingItemIndex = (newInvoice.items || []).findIndex(
      (item) =>
        item.productId === itemToAdd.productId && item.discount === newDiscount,
    );

    let updatedItems: InvoiceItem[];

    if (existingItemIndex >= 0) {
      // Merge with existing item: increase quantity
      updatedItems = newInvoice.items!.map((item, index) => {
        if (index === existingItemIndex) {
          const newQuantity = item.quantity + quantity;
          return {
            ...item,
            quantity: newQuantity,
            total: calculateItemTotal({
              ...item,
              quantity: newQuantity,
            }),
          };
        }
        return item;
      });
    } else {
      // Add as new item
      const item: InvoiceItem = {
        id: Date.now().toString(),
        productId: itemToAdd.productId!,
        productName: itemToAdd.productName!,
        quantity: quantity,
        unitPrice: itemToAdd.unitPrice!,
        discount: newDiscount,
        total: calculateItemTotal({ ...itemToAdd, quantity }),
      };

      updatedItems = [...(newInvoice.items || []), item];
    }

    const { subtotal, taxAmount, total } = calculateInvoiceTotal(
      updatedItems,
      newInvoice.taxRate,
      newInvoice.discountAmount,
    );

    setNewInvoice({
      ...newInvoice,
      items: updatedItems,
      subtotal,
      taxAmount,
      total,
    });

    clearCurrentItem();

    /* no toast on item add */
  };

  const removeItemFromInvoice = (itemId: string) => {
    const item = newInvoice.items?.find((i) => i.id === itemId);
    const updatedItems = (newInvoice.items || []).filter(
      (item) => item.id !== itemId,
    );
    const { subtotal, taxAmount, total } = calculateInvoiceTotal(
      updatedItems,
      newInvoice.taxRate,
      newInvoice.discountAmount,
    );

    setNewInvoice({
      ...newInvoice,
      items: updatedItems,
      subtotal,
      taxAmount,
      total,
    });

    /* no toast on item remove */
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `INV-${year}-${count.toString().padStart(3, "0")}`;
  };

  const createInvoice = async () => {
    // If this invoice is for borrow, client is required
    if (forBorrow) {
      if (
        useExistingClient &&
        (!newInvoice.clientId || newInvoice.clientId === "")
      ) {
        toast({
          title: "Error",
          description: "Please select a client for borrowed items",
          variant: "destructive",
        });
        return;
      }
      if (
        !useExistingClient &&
        (!newInvoice.clientName || newInvoice.clientName.trim() === "")
      ) {
        toast({
          title: "Error",
          description: "Please enter client name for borrowed items",
          variant: "destructive",
        });
        return;
      }

      if (!borrowReturnDate || borrowReturnDate.trim() === "") {
        toast({
          title: "Error",
          description: "Please select a return date for borrowed items",
          variant: "destructive",
        });
        return;
      }
    }

    if (!newInvoice.items?.length) {
      toast({
        title: "Error",
        description: "Please add at least one item to the invoice",
        variant: "destructive",
      });
      return;
    }

    // Determine clientId field value per requirements
    const clientIdForPayload: string | null = useExistingClient
      ? newInvoice.clientId || null
      : newInvoice.clientName?.trim()
        ? newInvoice.clientName.trim()
        : null;

    // Build payload expected by backend
    const itemsPayload = (newInvoice.items || []).map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      discount: it.discount,
      total: it.total,
    }));

    const payload = {
      items: itemsPayload,
      clientId: clientIdForPayload,
      subtotal: Number(newInvoice.subtotal ?? 0),
      taxRate: Number(newInvoice.taxRate ?? 0),
      taxAmount: Number(newInvoice.taxAmount ?? 0),
      discountAmount: Number(newInvoice.discountAmount ?? 0),
      total: Number(newInvoice.total ?? 0),
      paymentMethod: forBorrow ? null : newInvoice.paymentMethod || "cash",
      notes: newInvoice.notes || "",
      borrow: !!forBorrow,
      returnDate: forBorrow ? borrowReturnDate : undefined,
      cancellationReason: undefined as any,
    };

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/Sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      const result = (data && (data.result || data.data || data)) || {};
      const apiStatus =
        typeof data?.status === "number"
          ? data.status
          : typeof result?.status === "number"
            ? result.status
            : null;
      const apiOk = data?.ok;
      if (
        !res.ok ||
        apiOk === false ||
        (apiStatus != null && apiStatus >= 400)
      ) {
        const errMsg =
          result?.response?.message ||
          result?.message ||
          data?.message ||
          data?.error ||
          "Request failed";
        throw new Error(errMsg);
      }

      // Build local invoice view from request fields (backend accepted)
      const invoice: Invoice = {
        id: String(result.id || Date.now()),
        invoiceNumber: String(result.invoiceNumber || generateInvoiceNumber()),
        clientId: String(newInvoice.clientId || ""),
        clientName: String(newInvoice.clientName || ""),
        clientEmail: String(newInvoice.clientEmail || ""),
        clientType: (newInvoice.clientType || "retail") as any,
        employeeId: newInvoice.employeeId,
        employeeName: newInvoice.employeeName,
        date: new Date().toISOString(),
        dueDate: "",
        items: newInvoice.items!,
        subtotal: Number(newInvoice.subtotal ?? 0),
        taxRate: Number(newInvoice.taxRate ?? 0),
        taxAmount: Number(newInvoice.taxAmount ?? 0),
        discountAmount: Number(newInvoice.discountAmount ?? 0),
        total: Number(newInvoice.total ?? 0),
        status: "draft",
        paymentMethod: (newInvoice.paymentMethod || "cash") as any,
        notes: newInvoice.notes || "",
        borrow: !!forBorrow,
        returnDate: forBorrow ? borrowReturnDate : undefined,
      };

      setInvoices([invoice, ...invoices]);
      clearNewInvoice();
      setIsCreateDialogOpen(false);
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.message || "Could not create invoice",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCancelDialog = (invoice: Invoice) => {
    setInvoiceToCancel(invoice);
    setCancellationReason("");
    setIsCancelDialogOpen(true);
  };

  const cancelInvoice = async () => {
    if (!invoiceToCancel || !cancellationReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a cancellation reason",
        variant: "destructive",
      });
      return;
    }

    await updateInvoiceStatus(
      invoiceToCancel.id,
      "cancelled",
      cancellationReason.trim(),
    );

    setIsCancelDialogOpen(false);
    setInvoiceToCancel(null);
    setCancellationReason("");
  };

  const normalizeApiSale = (r: any): Invoice => {
    const lookupName = (pid: string) => {
      const p = products.find((x) => x.id === pid);
      return p ? p.name : pid;
    };
    const rawStatus = String(
      r.status ?? r.state ?? r.orderStatus ?? r.paymentStatus ?? "draft",
    )
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");

    const isCancelled =
      !!r.cancellationReason ||
      rawStatus === "cancelled" ||
      rawStatus === "canceled" ||
      rawStatus === "void" ||
      rawStatus === "refunded" ||
      rawStatus === "reversed" ||
      rawStatus === "failed" ||
      rawStatus === "rejected";

    const map: Record<string, Invoice["status"]> = {
      // Paid equivalents
      paid: "paid",
      complete: "paid",
      completed: "paid",
      success: "paid",
      successful: "paid",
      approved: "paid",
      confirmed: "paid",
      received: "paid",
      payment_received: "paid",
      fulfilled: "paid",
      closed: "paid",
      closed_won: "paid",
      won: "paid",
      delivered: "paid",
      finished: "paid",
      done: "paid",
      sale: "paid",
      sold: "paid",
      // Sent/pending equivalents
      sent: "sent",
      pending: "sent",
      unpaid: "sent",
      awaiting_payment: "sent",
      processing: "sent",
      in_progress: "sent",
      open: "draft",
      issued: "draft",
      created: "draft",
      // Borrow equivalents
      borrow: "borrow",
      borrowed: "borrow",
      loan: "borrow",
      // Overdue equivalents
      overdue: "overdue",
      past_due: "overdue",
      late: "overdue",
    };

    const status: Invoice["status"] = isCancelled
      ? "cancelled"
      : (map[rawStatus] ??
        (["draft", "sent", "borrow", "paid", "overdue", "cancelled"].includes(
          rawStatus,
        )
          ? (rawStatus as Invoice["status"])
          : "draft"));

    return {
      id: String(r.id),
      invoiceNumber: String(r.invoiceNumber || ""),
      clientId: String(r.clientId || ""),
      clientName: String(r.clientName || ""),
      clientEmail: "",
      clientType: "retail",
      employeeId: r.userId ? String(r.userId) : undefined,
      employeeName: r.userName || undefined,
      date: r.createdAt || new Date().toISOString(),
      dueDate: "",
      items: (r.items || []).map((it: any) => ({
        id: String(it.id || `${r.id}-${it.productId}`),
        productId: String(it.productId || ""),
        productName: lookupName(String(it.productId || "")),
        quantity: Number(it.quantity || 0),
        unitPrice: 0,
        discount: parseFloat(String(it.discount ?? 0)),
        total: parseFloat(String(it.total ?? 0)),
      })),
      subtotal: parseFloat(String(r.subtotal ?? 0)),
      taxRate: parseFloat(String(r.taxRate ?? 0)),
      taxAmount: parseFloat(String(r.taxAmount ?? 0)),
      discountAmount: parseFloat(String(r.discountAmount ?? 0)),
      total: parseFloat(String(r.total ?? 0)),
      status,
      paymentMethod: (r.paymentMethod || "cash") as any,
      notes: r.notes || "",
      borrow: !!(r.isBorrow ?? r.borrow),
      returnDate: r.returnDate || undefined,
      cancellationReason:
        r.cancellationReason || r.cancelReason || r.reason || undefined,
      cancelledBy:
        r.cancelledBy ||
        r.canceledBy ||
        r.cancelled_by ||
        r.canceled_by ||
        undefined,
      cancelledDate:
        r.cancelledAt ||
        r.canceledAt ||
        r.cancelledDate ||
        r.canceledDate ||
        undefined,
    };
  };

  const serverUpdateInvoice = async (id: string, payload: any) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const urls = [
      `${API_BASE}/Sales/${encodeURIComponent(id)}`,
      `${API_BASE}/Sales`,
      `${API_BASE}/Sales/`,
    ];
    const methods: RequestInit["method"][] = ["PATCH", "PUT", "POST"];
    let lastError: any = null;

    for (const url of urls) {
      for (const method of methods) {
        try {
          const enriched =
            url.endsWith("/Sales") || url.endsWith("/Sales/")
              ? {
                  // include identifiers for backends expecting body IDs
                  id,
                  saleId: id,
                  saleID: id,
                  ...payload,
                }
              : payload;

          const res = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(enriched),
          });
          const data = await res.json().catch(() => null);
          if (res.ok) {
            return (data && (data.result || data.data || data)) || {};
          }
          lastError =
            (data && (data.message || data.error)) || res.statusText || "Error";
        } catch (e) {
          lastError = e;
        }
      }
    }

    throw new Error(
      typeof lastError === "string"
        ? lastError
        : lastError?.message || "Request failed",
    );
  };

  const updateInvoiceStatus = async (
    invoiceId: string,
    newStatus: string,
    reason?: string,
  ) => {
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(invoiceId);
      return next;
    });

    try {
      const payload: any = { status: newStatus };
      if (newStatus === "borrow") {
        payload.borrow = true;
        payload.isBorrow = true;
      }
      // ensure backend receives cancellation details only for cancelled status
      if (newStatus === "cancelled" && reason) {
        payload.cancellationReason = reason;
        payload.cancelReason = reason;
        payload.reason = reason;
        payload.cancellation_reason = reason as any;
      }
      if (newStatus === "cancelled") {
        payload.isCancelled = true;
        payload.cancelled = true;
        payload.cancelledAt = new Date().toISOString();
        if (currentUser?.id) {
          payload.cancelledBy = currentUser.id;
          (payload as any).cancelled_by = currentUser.id;
        }
        // duplicate reason in common fields for maximum compatibility
        if (reason) {
          payload.cancellationReason = reason;
          (payload as any).cancelReason = reason;
          (payload as any).reason = reason;
          (payload as any).cancellation_reason = reason;
        }
      }

      const result = await serverUpdateInvoice(invoiceId, payload);
      const normalized = normalizeApiSale(result);

      // Ensure local cancellation details are preserved if API didn't echo them
      if (newStatus === "cancelled") {
        if (reason && !normalized.cancellationReason)
          normalized.cancellationReason = reason;
        if (!normalized.cancelledBy && currentUser?.name)
          normalized.cancelledBy = currentUser.name;
        if (!normalized.cancelledDate)
          normalized.cancelledDate = new Date().toISOString();
      }

      setInvoices((curr) =>
        curr.map((inv) => (inv.id === invoiceId ? normalized : inv)),
      );
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.message || "Could not update invoice",
        variant: "destructive",
      });
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(invoiceId);
        return next;
      });
    }
  };

  const getSalesEmployees = () => {
    return mockEmployees.filter(
      (emp) => emp.department === "Sales" && emp.status === "active",
    );
  };

  // Load clients and products from backend (best-effort; fall back to empty arrays)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/clients`);
        const data = await res.json().catch(() => null);
        if (mounted && res.ok && data && data.result) {
          const normalized = data.result.map((c: any) => ({
            id: c.id,
            name: c.userName || c.name || "",
            email: c.email || "",
            type: (c.type || "retail").toLowerCase(),
          }));
          setClients(normalized);
        }
      } catch (e) {
        console.warn("Failed to load clients", e);
      }

      try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json().catch(() => null);
        if (mounted && res.ok && data && data.result) {
          const normalized = data.result.map((p: any) => {
            const rawPriceCandidates = [
              p.unitPrice,
              p.price,
              p.sellingPrice,
              p.selling_price,
              p.retailPrice,
              p.sellPrice,
              p.salePrice,
              p.cost,
              p.value,
              p.amount,
              // nested patterns
              p?.price?.amount,
              p?.sellingPrice?.amount,
              p?.selling_price?.amount,
            ];
            let parsedPrice = 0;
            for (const cand of rawPriceCandidates) {
              if (cand === undefined || cand === null) continue;
              const num =
                typeof cand === "string"
                  ? parseFloat(cand.replace(/[^0-9.-]+/g, ""))
                  : Number(cand);
              if (!Number.isNaN(num) && num !== 0) {
                parsedPrice = num;
                break;
              }
              // prefer a zero if that's the only numeric value found
              if (!Number.isNaN(num) && parsedPrice === 0) parsedPrice = num;
            }

            return {
              id: p.id,
              name: p.name || p.title || "",
              unitPrice: parsedPrice,
              category: p.category || "",
              sku: p.sku || "",
            };
          });
          setProducts(normalized);
        }
      } catch (e) {
        console.warn("Failed to load products", e);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Load sales invoices from backend
  useEffect(() => {
    let mounted = true;
    const loadInvoices = async () => {
      try {
        const res = await fetch(`${API_BASE}/Sales`, {
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
        const data = await res.json().catch(() => null);
        const result = (data && (data.result || data.data || data)) || [];
        const apiStatus =
          typeof data?.status === "number"
            ? data.status
            : typeof result?.status === "number"
              ? result.status
              : null;
        const apiOk = data?.ok;
        if (
          !res.ok ||
          apiOk === false ||
          (apiStatus != null && apiStatus >= 400)
        ) {
          const errMsg =
            result?.response?.message ||
            result?.message ||
            data?.message ||
            data?.error ||
            "Request failed";
          throw new Error(errMsg);
        }

        const lookupName = (pid: string) => {
          const p = products.find((x) => x.id === pid);
          return p ? p.name : pid;
        };

        const normalized: Invoice[] = Array.isArray(result)
          ? result.map(normalizeApiSale)
          : [];

        if (mounted) setInvoices(normalized);
      } catch (e: any) {
        if (mounted) {
          toast({
            title: "Failed",
            description: e?.message || "Could not load invoices",
            variant: "destructive",
          });
        }
      }
    };

    loadInvoices();
    return () => {
      mounted = false;
    };
  }, [accessToken, products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("sales.title")}
          </h1>
          <p className="text-muted-foreground">{t("sales.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu open={exportMenuOpen} onOpenChange={setExportMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />{" "}
                {t("dashboard.export_report")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {t("dashboard.export_options")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setExportMenuOpen(false);
                  setTimeout(() => setIsPdfDialogOpen(true), 10);
                }}
              >
                <Receipt className="mr-2 h-4 w-4" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleExportExcel();
                }}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isMobile ? (
            <Drawer
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DrawerTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("sales.new_invoice")}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[85vh]">
                <DrawerHeader>
                  <DrawerTitle>{t("sales.create_new_invoice")}</DrawerTitle>
                  <DrawerDescription>
                    {t("sales.generate_invoice")}
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4 overflow-y-auto space-y-6">
                  {/* Client Information */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="radio"
                        id="existing-client"
                        name="client-type"
                        checked={useExistingClient}
                        onChange={() => setUseExistingClient(true)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="existing-client">
                        {t("sales.select_existing_client")}
                      </Label>
                      <input
                        type="radio"
                        id="new-client"
                        name="client-type"
                        checked={!useExistingClient}
                        onChange={() => setUseExistingClient(false)}
                        className="h-4 w-4 ml-2"
                      />
                      <Label htmlFor="new-client">
                        {t("sales.enter_new_client")}
                      </Label>
                      <label className="ml-2 flex items-center space-x-2 text-sm">
                        <input
                          id="for-borrow"
                          type="checkbox"
                          checked={forBorrow}
                          onChange={(e) => {
                            setForBorrow(e.target.checked);
                            if (e.target.checked)
                              setNewInvoice({
                                ...newInvoice,
                                paymentMethod: undefined as any,
                              });
                          }}
                          className="h-4 w-4"
                        />
                        <span>{t("sales.for_borrow")}</span>
                      </label>
                    </div>

                    {useExistingClient ? (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="client">
                            {forBorrow
                              ? `${t("sales.select_client")} *`
                              : t("sales.select_client")}
                          </Label>
                          <Select
                            value={newInvoice.clientId || ""}
                            onValueChange={(value) => {
                              const selectedClient = clients.find(
                                (c) => c.id === value,
                              );
                              if (selectedClient) {
                                setNewInvoice({
                                  ...newInvoice,
                                  clientId: selectedClient.id,
                                  clientName: selectedClient.name,
                                  clientEmail: selectedClient.email || "",
                                  clientType: selectedClient.type || "retail",
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("sales.choose_client")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {client.name}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {client.email} • {client.type}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="clientName">
                            {forBorrow
                              ? `${t("sales.client_name")} *`
                              : t("sales.client_name")}
                          </Label>
                          <Input
                            id="clientName"
                            placeholder={t("sales.enter_client_name") as string}
                            value={newInvoice.clientName || ""}
                            onChange={(e) =>
                              setNewInvoice({
                                ...newInvoice,
                                clientName: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {forBorrow && (
                      <div className="mt-3 w-full sm:w-1/3">
                        <Label htmlFor="return-date">
                          {t("sales.return_date")} *
                        </Label>
                        <Input
                          id="return-date"
                          type="date"
                          value={borrowReturnDate}
                          onChange={(e) => setBorrowReturnDate(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!forBorrow && (
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">
                          {t("sales.payment_method")}
                        </Label>
                        <Select
                          value={newInvoice.paymentMethod}
                          onValueChange={(value) =>
                            setNewInvoice({
                              ...newInvoice,
                              paymentMethod: value as any,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">
                              {t("sales.cash")}
                            </SelectItem>
                            <SelectItem value="card">
                              {t("sales.card")}
                            </SelectItem>
                            <SelectItem value="bank_transfer">
                              {t("sales.bank_transfer")}
                            </SelectItem>
                            <SelectItem value="credit">
                              {t("sales.credit")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Add Item Section */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      {t("sales.add_invoice_item")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product">
                          {t("sales.select_product")} *
                        </Label>
                        <Select
                          value={currentItem.productId || ""}
                          onValueChange={(value) => {
                            const selectedProduct = products.find(
                              (p) => p.id === value,
                            );
                            if (selectedProduct) {
                              setCurrentItem({
                                ...currentItem,
                                productId: selectedProduct.id,
                                productName: selectedProduct.name,
                                unitPrice: selectedProduct.unitPrice,
                                quantity: currentItem.quantity || 1,
                              });
                              // Auto-focus quantity input after product selection
                              setTimeout(() => {
                                quantityInputRef.current?.focus();
                              }, 0);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("sales.choose_product")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => {
                              const price = Number(product.unitPrice) || 0;
                              return (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium capitalize">
                                      {product.name}
                                    </span>
                                    {product.category ? (
                                      <span className="text-sm text-muted-foreground ml-2">
                                        • {product.category}
                                      </span>
                                    ) : null}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">
                          {t("employees.quantity_label")}
                        </Label>
                        <Input
                          ref={quantityInputRef}
                          id="quantity"
                          type="number"
                          min="1"
                          value={currentItem.quantity ?? 1}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          onKeyDown={(e) => {
                            const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
                            if (allowed.includes(e.key)) return;
                            if (!/^\d$/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount">{t("sales.discount")}</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          max="100"
                          value={currentItem.discount ?? 0}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              discount: parseFloat(e.target.value) || 0,
                            })
                          }
                          onKeyDown={(e) => {
                            const allowed = ['Backspace', 'Delete', '.', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
                            if (allowed.includes(e.key)) return;
                            if (!/^\d$/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("common.total")}</Label>
                        <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-medium">
                          ${calculateItemTotal(currentItem).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {currentItem.productId && (
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <strong>{t("sales.product_name")}:</strong>{" "}
                            {currentItem.productName}
                          </div>
                          <div>
                            <strong>{t("sales.unit_price")}:</strong> $
                            {currentItem.unitPrice?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        onClick={() => {
                          if (currentItem.productId) {
                            handleAddItemWithProduct(currentItem.productId);
                          } else {
                            toast({
                              title: "Error",
                              description: "Please select a product first",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("sales.add_item")}
                      </Button>
                      <Button variant="outline" onClick={clearCurrentItem}>
                        <X className="mr-2 h-4 w-4" />
                        {t("sales.cancel_item")}
                      </Button>
                    </div>
                  </div>

                  {newInvoice.items && newInvoice.items.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">
                        {t("sales.invoice_items")}
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("sales.product_name")}</TableHead>
                            <TableHead>{t("sales.qty")}</TableHead>
                            <TableHead>{t("sales.unit_price")}</TableHead>
                            <TableHead>{t("sales.discount")}</TableHead>
                            <TableHead>{t("common.total")}</TableHead>
                            <TableHead>{t("common.actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {newInvoice.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                {item.unitPrice.toFixed(2)}c
                              </TableCell>
                              <TableCell>{item.discount}%</TableCell>
                              <TableCell>{item.total.toFixed(2)}c</TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeItemFromInvoice(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="taxRate">
                              {t("sales.tax_rate")}
                            </Label>
                            <Input
                              id="taxRate"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={newInvoice.taxRate}
                              onChange={(e) => {
                                const taxRate = parseFloat(e.target.value) || 0;
                                const { subtotal, taxAmount, total } =
                                  calculateInvoiceTotal(
                                    newInvoice.items!,
                                    taxRate,
                                    newInvoice.discountAmount,
                                  );
                                setNewInvoice({
                                  ...newInvoice,
                                  taxRate,
                                  taxAmount,
                                  total,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="discountAmount">
                              {t("sales.additional_discount")}
                            </Label>
                            <Input
                              id="discountAmount"
                              type="number"
                              min="0"
                              step="0.01"
                              value={newInvoice.discountAmount}
                              onChange={(e) => {
                                const discountAmount =
                                  parseFloat(e.target.value) || 0;
                                const { subtotal, taxAmount, total } =
                                  calculateInvoiceTotal(
                                    newInvoice.items!,
                                    newInvoice.taxRate,
                                    discountAmount,
                                  );
                                setNewInvoice({
                                  ...newInvoice,
                                  discountAmount,
                                  total,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("sales.final_total")}</Label>
                            <div className="h-10 px-3 py-2 border rounded-md bg-primary/10 flex items-center font-semibold">
                              ${(newInvoice.total || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            {t("sales.subtotal")}: $
                            {(newInvoice.subtotal || 0).toFixed(2)}
                          </div>
                          <div>
                            {t("sales.tax")} ({newInvoice.taxRate}%): $
                            {(newInvoice.taxAmount || 0).toFixed(2)}
                          </div>
                          <div>
                            {t("sales.discount")}: -$
                            {(newInvoice.discountAmount || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t("common.notes")}</Label>
                    <Textarea
                      id="notes"
                      placeholder={
                        t("sales.additional_notes_placeholder") as string
                      }
                      value={newInvoice.notes}
                      onChange={(e) =>
                        setNewInvoice({ ...newInvoice, notes: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <DrawerFooter className="border-t">
                  <Button
                    className="w-full"
                    onClick={createInvoice}
                    disabled={isSubmitting}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    {isSubmitting
                      ? t("common.loading")
                      : t("sales.create_invoice")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearNewInvoice();
                      setIsCreateDialogOpen(false);
                    }}
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <X className="mr-2 h-4 w-4" /> {t("common.cancel")}
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          ) : (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("sales.new_invoice")}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[100vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("sales.create_new_invoice")}</DialogTitle>
                  <DialogDescription>
                    {t("sales.generate_invoice")}
                  </DialogDescription>
                </DialogHeader>
                {/* Reuse same content as drawer */}
                <div className="space-y-6 px-1 sm:px-0">
                  {/* Client Information */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="radio"
                        id="existing-client"
                        name="client-type"
                        checked={useExistingClient}
                        onChange={() => setUseExistingClient(true)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="existing-client">
                        {t("sales.select_existing_client")}
                      </Label>
                      <input
                        type="radio"
                        id="new-client"
                        name="client-type"
                        checked={!useExistingClient}
                        onChange={() => setUseExistingClient(false)}
                        className="h-4 w-4 ml-2"
                      />
                      <Label htmlFor="new-client">
                        {t("sales.enter_new_client")}
                      </Label>
                      <label className="ml-2 flex items-center space-x-2 text-sm">
                        <input
                          id="for-borrow"
                          type="checkbox"
                          checked={forBorrow}
                          onChange={(e) => {
                            setForBorrow(e.target.checked);
                            if (e.target.checked)
                              setNewInvoice({
                                ...newInvoice,
                                paymentMethod: undefined as any,
                              });
                          }}
                          className="h-4 w-4"
                        />
                        <span>{t("sales.for_borrow")}</span>
                      </label>
                    </div>

                    {useExistingClient ? (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="client">
                            {forBorrow
                              ? `${t("sales.select_client")} *`
                              : t("sales.select_client")}
                          </Label>
                          <Select
                            value={newInvoice.clientId || ""}
                            onValueChange={(value) => {
                              const selectedClient = clients.find(
                                (c) => c.id === value,
                              );
                              if (selectedClient) {
                                setNewInvoice({
                                  ...newInvoice,
                                  clientId: selectedClient.id,
                                  clientName: selectedClient.name,
                                  clientEmail: selectedClient.email || "",
                                  clientType: selectedClient.type || "retail",
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("sales.choose_client")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {client.name}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {client.email} ��� {client.type}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="clientName">
                            {forBorrow
                              ? `${t("sales.client_name")} *`
                              : t("sales.client_name")}
                          </Label>
                          <Input
                            id="clientName"
                            placeholder={t("sales.enter_client_name") as string}
                            value={newInvoice.clientName || ""}
                            onChange={(e) =>
                              setNewInvoice({
                                ...newInvoice,
                                clientName: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {forBorrow && (
                      <div className="mt-3 w-full sm:w-1/3">
                        <Label htmlFor="return-date">
                          {t("sales.return_date")} *
                        </Label>
                        <Input
                          id="return-date"
                          type="date"
                          value={borrowReturnDate}
                          onChange={(e) => setBorrowReturnDate(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!forBorrow && (
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">
                          {t("sales.payment_method")}
                        </Label>
                        <Select
                          value={newInvoice.paymentMethod}
                          onValueChange={(value) =>
                            setNewInvoice({
                              ...newInvoice,
                              paymentMethod: value as any,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">
                              {t("sales.cash")}
                            </SelectItem>
                            <SelectItem value="card">
                              {t("sales.card")}
                            </SelectItem>
                            <SelectItem value="bank_transfer">
                              {t("sales.bank_transfer")}
                            </SelectItem>
                            <SelectItem value="credit">
                              {t("sales.credit")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Add Item Section */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      {t("sales.add_invoice_item")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product">
                          {t("sales.select_product")} *
                        </Label>
                        <Select
                          value={currentItem.productId || ""}
                          onValueChange={(value) => {
                            const selectedProduct = products.find(
                              (p) => p.id === value,
                            );
                            if (selectedProduct) {
                              setCurrentItem({
                                ...currentItem,
                                productId: selectedProduct.id,
                                productName: selectedProduct.name,
                                unitPrice: selectedProduct.unitPrice,
                                quantity: currentItem.quantity || 1,
                              });
                              // Auto-focus quantity input after product selection
                              setTimeout(() => {
                                quantityInputRef.current?.focus();
                              }, 0);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("sales.choose_product")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => {
                              const price = Number(product.unitPrice) || 0;
                              return (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium capitalize">
                                      {product.name}
                                    </span>
                                    {product.category ? (
                                      <span className="text-sm text-muted-foreground ml-2">
                                        • {product.category}
                                      </span>
                                    ) : null}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">
                          {t("employees.quantity_label")}
                        </Label>
                        <Input
                          ref={quantityInputRef}
                          id="quantity"
                          type="number"
                          min="1"
                          value={currentItem.quantity ?? 1}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          onKeyDown={(e) => {
                            const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
                            if (allowed.includes(e.key)) return;
                            if (!/^\d$/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount">{t("sales.discount")}</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          max="100"
                          value={currentItem.discount ?? 0}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              discount: parseFloat(e.target.value) || 0,
                            })
                          }
                          onKeyDown={(e) => {
                            const allowed = ['Backspace', 'Delete', '.', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
                            if (allowed.includes(e.key)) return;
                            if (!/^\d$/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("common.total")}</Label>
                        <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-medium">
                          ${calculateItemTotal(currentItem).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {currentItem.productId && (
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <strong>{t("sales.product_name")}:</strong>{" "}
                            {currentItem.productName}
                          </div>
                          <div>
                            <strong>{t("sales.unit_price")}:</strong> $
                            {currentItem.unitPrice?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        onClick={() => {
                          if (currentItem.productId) {
                            handleAddItemWithProduct(currentItem.productId);
                          } else {
                            toast({
                              title: "Error",
                              description: "Please select a product first",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("sales.add_item")}
                      </Button>
                      <Button variant="outline" onClick={clearCurrentItem}>
                        <X className="mr-2 h-4 w-4" />
                        {t("sales.cancel_item")}
                      </Button>
                    </div>
                  </div>

                  {newInvoice.items && newInvoice.items.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">
                        {t("sales.invoice_items")}
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("sales.product_name")}</TableHead>
                            <TableHead>{t("sales.qty")}</TableHead>
                            <TableHead>{t("sales.unit_price")}</TableHead>
                            <TableHead>{t("sales.discount")}</TableHead>
                            <TableHead>{t("common.total")}</TableHead>
                            <TableHead>{t("common.actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {newInvoice.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                {item.unitPrice.toFixed(2)}c
                              </TableCell>
                              <TableCell>{item.discount}%</TableCell>
                              <TableCell>{item.total.toFixed(2)}c</TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeItemFromInvoice(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="taxRate">
                              {t("sales.tax_rate")}
                            </Label>
                            <Input
                              id="taxRate"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={newInvoice.taxRate}
                              onChange={(e) => {
                                const taxRate = parseFloat(e.target.value) || 0;
                                const { subtotal, taxAmount, total } =
                                  calculateInvoiceTotal(
                                    newInvoice.items!,
                                    taxRate,
                                    newInvoice.discountAmount,
                                  );
                                setNewInvoice({
                                  ...newInvoice,
                                  taxRate,
                                  taxAmount,
                                  total,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="discountAmount">
                              {t("sales.additional_discount")}
                            </Label>
                            <Input
                              id="discountAmount"
                              type="number"
                              min="0"
                              step="0.01"
                              value={newInvoice.discountAmount}
                              onChange={(e) => {
                                const discountAmount =
                                  parseFloat(e.target.value) || 0;
                                const { subtotal, taxAmount, total } =
                                  calculateInvoiceTotal(
                                    newInvoice.items!,
                                    newInvoice.taxRate,
                                    discountAmount,
                                  );
                                setNewInvoice({
                                  ...newInvoice,
                                  discountAmount,
                                  total,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("sales.final_total")}</Label>
                            <div className="h-10 px-3 py-2 border rounded-md bg-primary/10 flex items-center font-semibold">
                              ${(newInvoice.total || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            {t("sales.subtotal")}: $
                            {(newInvoice.subtotal || 0).toFixed(2)}
                          </div>
                          <div>
                            {t("sales.tax")} ({newInvoice.taxRate}%): $
                            {(newInvoice.taxAmount || 0).toFixed(2)}
                          </div>
                          <div>
                            {t("sales.discount")}: -$
                            {(newInvoice.discountAmount || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t("common.notes")}</Label>
                    <Textarea
                      id="notes"
                      placeholder={
                        t("sales.additional_notes_placeholder") as string
                      }
                      value={newInvoice.notes}
                      onChange={(e) =>
                        setNewInvoice({ ...newInvoice, notes: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={createInvoice}
                      disabled={isSubmitting}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      {isSubmitting
                        ? t("common.loading")
                        : t("sales.create_invoice")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        clearNewInvoice();
                        setIsCreateDialogOpen(false);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="mr-2 h-4 w-4" /> {t("common.cancel")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Export PDF Dialog */}
          <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {t("finance.export_pdf_title", "PDF Report")}
                </DialogTitle>
                <DialogDescription>
                  {t("dashboard.export_report", "Export Report")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("common.filter")}</Label>
                  <Select
                    value={pdfPeriod}
                    onValueChange={(v) => setPdfPeriod(v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">{t("sales.today")}</SelectItem>
                      <SelectItem value="last_month">
                        {t("sales.this_month", "This Month")}
                      </SelectItem>
                      <SelectItem value="last_year">
                        {t("finance.last_12_months", "Last 12 Months")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleExportPDF}>
                    <Download className="mr-2 h-4 w-4" /> {t("common.export")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsPdfDialogOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("sales.total_invoices")}
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter((i) => i.status === "paid").length} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("sales.total_revenue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("sales.from_paid_invoices")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("sales.pending_amount")}
            </CardTitle>
            <Calculator className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.pending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("sales.awaiting_payment")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("status.cancelled")}
            </CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cancelled}</div>
            <p className="text-xs text-muted-foreground">
              {t("sales.cancelled_invoices")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sales.sales_invoices")}</CardTitle>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("sales.search_invoices")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t("common.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("employees.all_status")}
                  </SelectItem>
                  <SelectItem value="draft">{t("status.draft")}</SelectItem>
                  <SelectItem value="sent">{t("status.sent")}</SelectItem>
                  <SelectItem value="paid">{t("status.paid")}</SelectItem>
                  <SelectItem value="overdue">{t("status.overdue")}</SelectItem>
                  <SelectItem value="cancelled">
                    {t("status.cancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={dateFilter}
                onValueChange={(v) => {
                  setDateFilter(v);
                  if (v !== "custom") {
                    setTempStartDate("");
                    setTempEndDate("");
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t("sales.date_range")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("sales.all_dates")}</SelectItem>
                  <SelectItem value="today">{t("sales.today")}</SelectItem>
                  <SelectItem value="last_week">
                    {t("sales.last_week")}
                  </SelectItem>
                  <SelectItem value="last_month">
                    {t("sales.last_month")}
                  </SelectItem>
                  <SelectItem value="last_year">
                    {t("sales.last_year")}
                  </SelectItem>
                  <SelectItem value="custom">
                    {t("sales.custom_range")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {dateFilter === "custom" && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Label htmlFor="startDate" className="text-sm font-medium">
                    {t("sales.from")}:
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="endDate" className="text-sm font-medium">
                    {t("sales.to")}:
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!tempStartDate || !tempEndDate) return;
                      const s = new Date(tempStartDate);
                      const e = new Date(tempEndDate);
                      if (s > e) {
                        toast({
                          title: t("common.error", { defaultValue: "Error" }),
                          description: t("warehouse.invalid_date_range", {
                            defaultValue: "Invalid date range",
                          }),
                          variant: "destructive",
                        });
                        return;
                      }
                      setStartDate(tempStartDate);
                      setEndDate(tempEndDate);
                    }}
                    disabled={!tempStartDate || !tempEndDate}
                  >
                    {t("common.apply")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateFilter("all");
                      setStartDate("");
                      setEndDate("");
                      setTempStartDate("");
                      setTempEndDate("");
                    }}
                  >
                    {t("common.clear")}
                  </Button>
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t("sales.showing_invoices", {
                  count: filteredInvoices.length,
                  total: invoices.length,
                })}
                {dateFilter !== "all" && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {dateFilter === "custom" && startDate && endDate
                      ? `${startDate} ${t("sales.to")} ${endDate}`
                      : t(`sales.${dateFilter}`)}
                  </span>
                )}
              </span>
              <span>
                {t("sales.total_value")}: $
                {filteredInvoices
                  .reduce((sum, inv) => sum + inv.total, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[720px] sm:min-w-0 table-fixed [&_th]:px-4 [&_td]:px-4 md:[&_th]:px-6 md:[&_td]:px-6">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("sales.invoice_number")}</TableHead>
                    <TableHead>{t("sales.client")}</TableHead>
                    <TableHead>{t("employees.employee")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("common.amount")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="w-[140px]">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {invoice.clientName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.clientEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {invoice.employeeName ? (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={invoice.employeeAvatar}
                                  alt={invoice.employeeName}
                                />
                                <AvatarFallback className="text-xs">
                                  {invoice.employeeName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {invoice.employeeName}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {t("sales.no_employee")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>
                            {new Intl.DateTimeFormat(i18n.language || "en", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            }).format(new Date(invoice.date))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {invoice.total.toFixed(2)}c
                        </div>
                        {!invoice.borrow && (
                          <div className="text-sm text-muted-foreground">
                            {t(`sales.${invoice.paymentMethod}`)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status, invoice.borrow)}
                      </TableCell>
                      <TableCell className="w-[140px]">
                        <div className="flex gap-1 justify-end">
                          {canDownloadInvoice(invoice) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {canDownloadInvoice(invoice) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                buildInvoicePDF(invoice);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === "draft" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingIds.has(invoice.id)}
                                onClick={() =>
                                  updateInvoiceStatus(invoice.id, "sent")
                                }
                              >
                                {t("sales.send")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingIds.has(invoice.id)}
                                onClick={() => openCancelDialog(invoice)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {invoice.status === "sent" && (
                            <>
                              {invoice.borrow ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={updatingIds.has(invoice.id)}
                                  onClick={() =>
                                    updateInvoiceStatus(invoice.id, "borrow")
                                  }
                                  className="text-purple-600"
                                >
                                  {t("sales.mark_borrow", "Mark Borrow")}
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={updatingIds.has(invoice.id)}
                                  onClick={() =>
                                    updateInvoiceStatus(invoice.id, "paid")
                                  }
                                  className="text-green-600"
                                >
                                  {t("sales.mark_paid")}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingIds.has(invoice.id)}
                                onClick={() => openCancelDialog(invoice)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {sortedInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-xl border p-4 bg-card shadow-business"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("sales.invoice_number")}
                    </div>
                    <div className="text-base font-semibold">
                      {invoice.invoiceNumber}
                    </div>
                  </div>
                  {getStatusBadge(invoice.status, invoice.borrow)}
                </div>
                <div className="mt-3">
                  <div className="font-medium">{invoice.clientName}</div>
                  {invoice.clientEmail ? (
                    <div className="text-xs text-muted-foreground">
                      {invoice.clientEmail}
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatDateTime(invoice.date)}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
                {canDownloadInvoice(invoice) && (
                  <div className="mt-4 grid gap-2 grid-cols-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" /> {t("common.view", "View")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        buildInvoicePDF(invoice);
                      }}
                    >
                      <Download className="h-4 w-4" /> PDF
                    </Button>
                  </div>
                )}
                {(invoice.status === "draft" || invoice.status === "sent") && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {invoice.status === "draft" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingIds.has(invoice.id)}
                          onClick={() =>
                            updateInvoiceStatus(invoice.id, "sent")
                          }
                        >
                          {t("sales.send")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={updatingIds.has(invoice.id)}
                          onClick={() => openCancelDialog(invoice)}
                        >
                          {t("common.cancel")}
                        </Button>
                      </>
                    )}
                    {invoice.status === "sent" && (
                      <>
                        {invoice.borrow ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-purple-600"
                            disabled={updatingIds.has(invoice.id)}
                            onClick={() =>
                              updateInvoiceStatus(invoice.id, "borrow")
                            }
                          >
                            {t("sales.mark_borrow", "Mark Borrow")}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                            disabled={updatingIds.has(invoice.id)}
                            onClick={() =>
                              updateInvoiceStatus(invoice.id, "paid")
                            }
                          >
                            {t("sales.mark_paid")}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={updatingIds.has(invoice.id)}
                          onClick={() => openCancelDialog(invoice)}
                        >
                          {t("common.cancel")}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {t("sales.invoice_details")}: {selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>
              {t("sales.complete_invoice_info")}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-semibold mb-2">
                    {t("sales.invoice_information")}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      {t("sales.invoice_number")}:{" "}
                      {selectedInvoice.invoiceNumber}
                    </div>
                    <div>
                      {t("common.date")}:{" "}
                      {new Intl.DateTimeFormat(i18n.language || "en", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }).format(new Date(selectedInvoice.date))}
                    </div>
                    <div>
                      {t("common.status")}:{" "}
                      {getStatusBadge(
                        selectedInvoice.status,
                        selectedInvoice.borrow,
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {t("sales.client_information")}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div>{selectedInvoice.clientName}</div>
                    <div>{selectedInvoice.clientEmail}</div>
                    <div className="capitalize">
                      {t(`clients.${selectedInvoice.clientType}`)}
                    </div>
                    {!selectedInvoice.borrow && (
                      <div className="capitalize">
                        {t("sales.payment")}:{" "}
                        {t(`sales.${selectedInvoice.paymentMethod}`)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Employee Information */}
              {selectedInvoice.employeeName && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 rounded-lg text-sm">
                  <h3 className="font-semibold mb-2">
                    {t("employees.sales_team")}
                  </h3>
                  <div className="text-sm">{selectedInvoice.employeeName}</div>
                </div>
              )}

              {/* Invoice Items */}
              <div>
                <h3 className="font-semibold mb-4">Invoice Items</h3>
                {/* Mobile list */}
                <div className="md:hidden space-y-3">
                  {selectedInvoice.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border p-3 bg-card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          {t("sales.qty")}: {item.quantity}
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">
                          {t("sales.unit_price")}
                        </div>
                        <div className="text-right">
                          ${item.unitPrice.toFixed(2)}
                        </div>
                        <div className="text-muted-foreground">
                          {t("sales.discount")}
                        </div>
                        <div className="text-right">{item.discount}%</div>
                        <div className="font-medium">{t("common.total")}</div>
                        <div className="text-right font-semibold">
                          {item.total.toFixed(2)}c
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("sales.product_name")}</TableHead>
                        <TableHead>{t("sales.qty")}</TableHead>
                        <TableHead>{t("sales.unit_price")}</TableHead>
                        <TableHead>{t("sales.discount")}</TableHead>
                        <TableHead>{t("common.total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell>{item.discount}%</TableCell>
                          <TableCell>${item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="border rounded-lg p-4 space-y-2 bg-muted text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{selectedInvoice.subtotal.toFixed(2)}c</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({selectedInvoice.taxRate}%):</span>
                  <span>{selectedInvoice.taxAmount.toFixed(2)}c</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-{selectedInvoice.discountAmount.toFixed(2)}c</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{selectedInvoice.total.toFixed(2)}c</span>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <h3 className="font-semibold mb-2">{t("common.notes")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedInvoice.notes}
                  </p>
                </div>
              )}

              {/* Cancellation Information */}
              {selectedInvoice.status === "cancelled" &&
                selectedInvoice.cancellationReason && (
                  <div className="border rounded-lg p-4 bg-red-50">
                    <h3 className="font-semibold mb-2 text-red-800">
                      {t("sales.cancellation_details")}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">
                          {t("sales.reason")}:
                        </span>
                        <p className="text-red-700 mt-1">
                          {selectedInvoice.cancellationReason}
                        </p>
                      </div>
                      {selectedInvoice.cancelledBy && (
                        <div>
                          <span className="font-medium">
                            {t("sales.cancelled_by")}:
                          </span>{" "}
                          {selectedInvoice.cancelledBy}
                        </div>
                      )}
                      {selectedInvoice.cancelledDate && (
                        <div>
                          <span className="font-medium">
                            {t("sales.cancelled_on")}:
                          </span>{" "}
                          {selectedInvoice.cancelledDate}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              <div className="flex gap-2">
                {selectedInvoice && canDownloadInvoice(selectedInvoice) && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (!selectedInvoice) return;
                      buildInvoicePDF(selectedInvoice);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("sales.download_pdf")}
                  </Button>
                )}
                {selectedInvoice.status !== "cancelled" &&
                  selectedInvoice.status !== "paid" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        openCancelDialog(selectedInvoice);
                        setIsViewDialogOpen(false);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Invoice Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t("sales.cancel_invoice")}
            </DialogTitle>
            <DialogDescription>
              {t("sales.cancel_invoice_desc", {
                number: invoiceToCancel?.invoiceNumber,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancellationReason">
                {t("sales.cancellation_reason_required")}
              </Label>
              <Textarea
                id="cancellationReason"
                placeholder={t("sales.cancellation_reason_placeholder")}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={cancelInvoice}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Invoice
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCancelDialogOpen(false);
                  setInvoiceToCancel(null);
                  setCancellationReason("");
                }}
              >
                {t("sales.keep_invoice")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

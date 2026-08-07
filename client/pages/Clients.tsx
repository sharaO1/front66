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
import DetailCard from "@/components/DetailCard";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  Filter,
  Phone,
  Mail,
  CreditCard,
  AlertTriangle,
  Eye,
  Send,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PaginationControls } from "@/components/ui/pagination";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: "retail" | "wholesale" | "distributor";
  creditLimit: number;
  currentDebt: number;
  status: "active" | "inactive" | "overdue";
  totalPurchases: number;
  lastPurchase: string;
  notes: string;
}

import { API_BASE } from "@/lib/api";

type SortKey = "name" | "type" | "currentDebt" | "status" | "totalPurchases";

type SortOrder = "asc" | "desc";

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    type: "retail",
    creditLimit: 1000,
    notes: "",
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [clientPage, setClientPage] = useState(1);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(`${API_BASE}/clients`);
        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Failed to fetch clients");
        }

        const normalizedClients: Client[] = data.result.map((c: any) => ({
          id: c.id,
          name: c.userName,
          email: c.email,
          phone: c.phone,
          address: c.address || "",
          type: c.type.toLowerCase() as "retail" | "wholesale" | "distributor",
          creditLimit: c.creditLimit,
          currentDebt: c.currentDebt,
          status: c.status.toLowerCase() as "active" | "inactive" | "overdue",
          totalPurchases: c.totalPurchases,
          lastPurchase: c.lastPurchase || "",
          notes: c.notes || "",
        }));

        setClients(normalizedClients);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm);
    const matchesType =
      typeFilter === "all" || client.type === (typeFilter as Client["type"]);
    const matchesStatus =
      statusFilter === "all" ||
      client.status === (statusFilter as Client["status"]);
    return matchesSearch && matchesType && matchesStatus;
  });

  useEffect(() => {
    setClientPage(1);
  }, [searchTerm, typeFilter, statusFilter, sortKey, sortOrder]);

  const statusOrder: Record<Client["status"], number> = {
    active: 0,
    inactive: 1,
    overdue: 2,
  };

  const sortedClients = [...filteredClients].sort((a, b) => {
    const dir = sortOrder === "asc" ? 1 : -1;
    switch (sortKey) {
      case "name":
        return a.name.localeCompare(b.name) * dir;
      case "type":
        return a.type.localeCompare(b.type) * dir;
      case "currentDebt":
        return (a.currentDebt - b.currentDebt) * dir;
      case "status":
        return (statusOrder[a.status] - statusOrder[b.status]) * dir;
      case "totalPurchases":
        return (a.totalPurchases - b.totalPurchases) * dir;
      default:
        return 0;
    }
  });

  const paginatedClients = sortedClients.slice((clientPage - 1) * 10, clientPage * 10);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t("status.active")}
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {t("status.inactive")}
          </Badge>
        );
      case "overdue":
        return <Badge variant="destructive">{t("status.overdue")}</Badge>;
      default:
        return <Badge variant="outline">{t("warehouse.unknown")}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "retail":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            {t("clients.retail")}
          </Badge>
        );
      case "wholesale":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            {t("clients.wholesale")}
          </Badge>
        );
      case "distributor":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            {t("clients.distributor")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("warehouse.unknown")}</Badge>;
    }
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email || !newClient.phone) {
      toast({
        title: t("common.error"),
        description: t("clients.required_fields_error"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: newClient.name,
          email: newClient.email,
          phone: newClient.phone,
          address: newClient.address || "",
          type: (newClient.type || "RETAIL").toUpperCase(),
          creditLimit: newClient.creditLimit || 1000,
          notes: newClient.notes || "",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to add client");
      }

      const result = data.result;
      const client: Client = {
        id: result.id,
        name: result.userName,
        email: result.email,
        phone: result.phone,
        address: result.address || "",
        type: result.type.toLowerCase() as
          | "retail"
          | "wholesale"
          | "distributor",
        creditLimit: result.creditLimit,
        currentDebt: result.currentDebt,
        status: result.status.toLowerCase() as "active" | "inactive",
        totalPurchases: result.totalPurchases,
        lastPurchase: result.lastPurchase || "",
        notes: result.notes || "",
      };

      setClients((prev) => [...prev, client]);
      setNewClient({
        name: "",
        email: "",
        phone: "",
        address: "",
        type: "retail",
        creditLimit: 1000,
        notes: "",
      });
      setIsAddDialogOpen(false);

      toast({
        title: t("clients.toast.added_title"),
        description: t("clients.toast.added_desc", { name: client.name }),
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error?.message || t("common.error"),
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;

    try {
      const response = await fetch(`${API_BASE}/clients/${selectedClient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: selectedClient.name,
          email: selectedClient.email,
          phone: selectedClient.phone,
          address: selectedClient.address,
          type: selectedClient.type.toUpperCase(),
          creditLimit: selectedClient.creditLimit,
          notes: selectedClient.notes,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to update client");
      }

      const result = data.result;
      const updatedClient: Client = {
        id: result.id,
        name: result.userName,
        email: result.email,
        phone: result.phone,
        address: result.address || "",
        type: result.type.toLowerCase() as
          | "retail"
          | "wholesale"
          | "distributor",
        creditLimit: result.creditLimit,
        currentDebt: result.currentDebt,
        status: result.status.toLowerCase() as "active" | "inactive",
        totalPurchases: result.totalPurchases,
        lastPurchase: result.lastPurchase || "",
        notes: result.notes || "",
      };

      setClients((prev) =>
        prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)),
      );

      setIsEditDialogOpen(false);
      setSelectedClient(null);

      toast({
        title: t("clients.toast.updated_title"),
        description: t("clients.toast.updated_desc", {
          name: updatedClient.name,
        }),
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error?.message || t("common.error"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`${API_BASE}/clients/${clientId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.message || "Failed to delete client");
      }

      setClients((prev) => prev.filter((c) => c.id !== clientId));

      toast({
        title: t("clients.toast.deleted_title"),
        description: t("clients.toast.deleted_desc"),
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error?.message || t("common.error"),
        variant: "destructive",
      });
    }
  };

  const sendReminder = (client: Client) => {
    toast({
      title: t("clients.toast.reminder_title"),
      description: `${t("clients.toast.reminder_desc_prefix")} ${client.name} ${t(
        "clients.toast.reminder_desc_suffix",
      )}`,
    });
  };

  const headerSortIndicator = (key: SortKey) =>
    sortKey === key ? (sortOrder === "asc" ? " ▲" : " ▼") : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("clients.title")}
          </h1>
          <p className="text-muted-foreground">{t("clients.subtitle")}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hidden sm:inline-flex">
              <Plus className="mr-2 h-4 w-4" />
              {t("clients.add_client")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("clients.add_new_client")}</DialogTitle>
              <DialogDescription>
                {t("clients.create_client_profile")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("clients.company_name")} *</Label>
                <Input
                  id="name"
                  placeholder={t("clients.enter_client_name")}
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("clients.client_email")}
                  value={newClient.email}
                  onChange={(e) =>
                    setNewClient({ ...newClient, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("common.phone")} *</Label>
                <Input
                  id="phone"
                  placeholder={t("clients.phone_number")}
                  value={newClient.phone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t("common.address")}</Label>
                <Textarea
                  id="address"
                  placeholder={t("clients.full_address")}
                  value={newClient.address}
                  onChange={(e) =>
                    setNewClient({ ...newClient, address: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">{t("clients.client_type")}</Label>
                  <Select
                    value={newClient.type}
                    onValueChange={(value) =>
                      setNewClient({ ...newClient, type: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">
                        {t("clients.retail")}
                      </SelectItem>
                      <SelectItem value="wholesale">
                        {t("clients.wholesale")}
                      </SelectItem>
                      <SelectItem value="distributor">
                        {t("clients.distributor")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">
                    {t("clients.credit_limit")}
                  </Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    placeholder="1000"
                    value={newClient.creditLimit}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        creditLimit: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t("common.notes")}</Label>
                <Textarea
                  id="notes"
                  placeholder={t("clients.additional_notes")}
                  value={newClient.notes}
                  onChange={(e) =>
                    setNewClient({ ...newClient, notes: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleAddClient}>
                  {t("clients.add_client")}
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
              {t("clients.total_clients")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              {clients.filter((c) => c.status === "active").length}{" "}
              {t("status.active")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("clients.total_debt")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                clients.reduce((sum, c) => sum + Number(c.currentDebt || 0), 0),
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("clients.across_all_clients")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("clients.overdue_payments")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter((c) => c.status === "overdue").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("clients.clients_need_followup")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.total_sales")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                clients.reduce(
                  (sum, c) => sum + Number(c.totalPurchases || 0),
                  0,
                ),
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("clients.all_time_revenue")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>{t("clients.client_directory")}</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("clients.search_clients")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t("clients.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("clients.all_types")}</SelectItem>
                <SelectItem value="retail">{t("clients.retail")}</SelectItem>
                <SelectItem value="wholesale">
                  {t("clients.wholesale")}
                </SelectItem>
                <SelectItem value="distributor">
                  {t("clients.distributor")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("clients.all_status")}</SelectItem>
                <SelectItem value="active">{t("status.active")}</SelectItem>
                <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                <SelectItem value="overdue">{t("status.overdue")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="sm:hidden space-y-3">
            {paginatedClients.map((client) => (
              <div
                key={client.id}
                className="rounded-xl border bg-card p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{client.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("common.total")}:{" "}
                      {formatCurrency(client.totalPurchases)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {getTypeBadge(client.type)}
                    {getStatusBadge(client.status)}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3 w-3" />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="h-3 w-3" />
                    {client.phone}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-medium">
                      {formatCurrency(client.currentDebt)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("clients.credit_limit")}:{" "}
                      {formatCurrency(client.creditLimit)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="View"
                      onClick={() => {
                        setSelectedClient(client);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Edit"
                      onClick={() => {
                        setSelectedClient(client);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {client.status === "overdue" && (
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Remind"
                        className="text-orange-600"
                        onClick={() => sendReminder(client)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Delete"
                      className="text-red-600"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="-mx-2 sm:mx-0 overflow-x-auto hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    aria-sort={sortKey === "name" ? sortOrder : undefined}
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => handleSort("name")}
                    >
                      {t("clients.client")}
                      <span>{headerSortIndicator("name")}</span>
                    </button>
                  </TableHead>
                  <TableHead
                    aria-sort={sortKey === "type" ? sortOrder : undefined}
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => handleSort("type")}
                    >
                      {t("clients.type")}
                      <span>{headerSortIndicator("type")}</span>
                    </button>
                  </TableHead>
                  <TableHead>{t("clients.contact")}</TableHead>
                  <TableHead
                    aria-sort={
                      sortKey === "currentDebt" ? sortOrder : undefined
                    }
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => handleSort("currentDebt")}
                    >
                      {t("clients.debt")}
                      <span>{headerSortIndicator("currentDebt")}</span>
                    </button>
                  </TableHead>
                  <TableHead
                    aria-sort={sortKey === "status" ? sortOrder : undefined}
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => handleSort("status")}
                    >
                      {t("common.status")}
                      <span>{headerSortIndicator("status")}</span>
                    </button>
                  </TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {t("common.total")}:{" "}
                          {formatCurrency(client.totalPurchases)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(client.type)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(client.currentDebt)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("clients.credit_limit")}:{" "}
                          {formatCurrency(client.creditLimit)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(client);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(client);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {client.status === "overdue" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendReminder(client)}
                            className="text-orange-600"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls page={clientPage} totalItems={sortedClients.length} onPageChange={setClientPage} />
        </CardContent>
      </Card>

      {/* View Client Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("clients.client_details")}</DialogTitle>
            <DialogDescription>
              {t("clients.complete_information")} {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <DetailCard
              title={selectedClient.name}
              subtitle={`${t("clients.complete_information")} ${selectedClient.name}`}
              left={[
                {
                  label: t("clients.type"),
                  value: getTypeBadge(selectedClient.type),
                },
                {
                  label: t("common.email"),
                  value: selectedClient.email || "-",
                },
                {
                  label: t("common.address"),
                  value: selectedClient.address || "-",
                },
                {
                  label: t("clients.last_purchase"),
                  value: selectedClient.lastPurchase || t("clients.never"),
                },
              ]}
              right={[
                {
                  label: t("common.phone"),
                  value: selectedClient.phone || "-",
                },
                {
                  label: t("clients.credit_limit"),
                  value: formatCurrency(selectedClient.creditLimit),
                },
                {
                  label: t("clients.current_debt"),
                  value: formatCurrency(selectedClient.currentDebt),
                },
                {
                  label: t("clients.total_purchases"),
                  value: formatCurrency(selectedClient.totalPurchases),
                },
              ]}
              actions={
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  {t("common.close")}
                </Button>
              }
            >
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {t("common.notes")}
                </div>
                <div className="text-sm">
                  {selectedClient.notes || t("clients.no_notes")}
                </div>
              </div>
            </DetailCard>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("clients.edit_client")}</DialogTitle>
            <DialogDescription>
              {t("clients.update_client_info")}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="editName">{t("clients.company_name")}</Label>
                <Input
                  id="editName"
                  value={selectedClient.name}
                  onChange={(e) =>
                    setSelectedClient({
                      ...selectedClient,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">{t("common.phone")}</Label>
                <Input
                  id="editPhone"
                  value={selectedClient.phone}
                  onChange={(e) =>
                    setSelectedClient({
                      ...selectedClient,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editType">{t("clients.client_type")}</Label>
                  <Select
                    value={selectedClient.type}
                    onValueChange={(value) =>
                      setSelectedClient({
                        ...selectedClient,
                        type: value as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">
                        {t("clients.retail")}
                      </SelectItem>
                      <SelectItem value="wholesale">
                        {t("clients.wholesale")}
                      </SelectItem>
                      <SelectItem value="distributor">
                        {t("clients.distributor")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editStatus">{t("common.status")}</Label>
                  <Select
                    value={selectedClient.status}
                    onValueChange={(value) =>
                      setSelectedClient({
                        ...selectedClient,
                        status: value as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        {t("status.active")}
                      </SelectItem>
                      <SelectItem value="inactive">
                        {t("status.inactive")}
                      </SelectItem>
                      <SelectItem value="overdue">
                        {t("status.overdue")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editCreditLimit">
                    {t("clients.credit_limit")}
                  </Label>
                  <Input
                    id="editCreditLimit"
                    type="number"
                    value={selectedClient.creditLimit}
                    onChange={(e) =>
                      setSelectedClient({
                        ...selectedClient,
                        creditLimit: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDebt">{t("clients.current_debt")}</Label>
                  <Input
                    id="editDebt"
                    type="number"
                    value={selectedClient.currentDebt}
                    onChange={(e) =>
                      setSelectedClient({
                        ...selectedClient,
                        currentDebt: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNotes">{t("common.notes")}</Label>
                <Textarea
                  id="editNotes"
                  value={selectedClient.notes}
                  onChange={(e) =>
                    setSelectedClient({
                      ...selectedClient,
                      notes: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleEditClient}>
                  {t("clients.update_client")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-24 right-4 z-40 sm:hidden">
        <Button
          size="icon"
          className="shadow-business-lg"
          aria-label="Add Client"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

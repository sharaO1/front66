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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MobileEmployeeCard from "@/components/MobileEmployeeCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Award,
  UserCheck,
  UserX,
  Eye,
  Star,
  TrendingUp,
  Target,
  ShoppingCart,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  ChevronDown,
  X,
} from "lucide-react";
import DetailCard from "@/components/DetailCard";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { string } from "zod";
import { useRBACStore } from "@/stores/rbacStore";
import { useAuthStore } from "@/stores/authStore";
import {
  joinApi,
  getErrorMessageFromResponse,
  apiFetch,
  API_BASE,
} from "@/lib/api";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  accountId?: string;
  phone: string;
  address: string;
  department: string;
  position: string;
  role: "admin" | "manager" | "worker" | "intern";
  salary: number;
  commission: number;
  hireDate: string;
  status: "active" | "inactive" | "terminated" | "on_leave";
  avatar?: string;
  filialId?: string;
  manager?: string;
  skills: string[];
  notes: string;
  salesTarget?: number;
}

interface WorkerApiItem {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  employeeId?: string;
  accountId?: string;
  phone?: string;
  address?: string;
  position?: string;
  salary?: number;
  commission?: number;
  status?: string;
  skills?: string[];
  notes?: string;
  salesTarget?: number;
  firstName?: string;
  lastName?: string;
  role?: string;
  department?: string;
  avatar?: string;
  filialId?: string;
}

interface DailySale {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  quantity: number;
  clientName: string;
  productsSold: string[];
  commission: number;
  notes?: string;
}

interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours: number;
  status: "present" | "absent" | "late" | "half_day";
  notes?: string;
}

interface AttendanceEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  status: "present" | "absent" | "late" | "half_day" | "on_break";
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
}

const mockDailySales: DailySale[] = [
  {
    id: "1",
    employeeId: "EMP001",
    date: "2024-01-22",
    amount: 5500,
    quantity: 3,
    clientName: "Tech Solutions Ltd",
    productsSold: ["iPhone 15 Pro", "MacBook Air M3"],
    commission: 275,
    notes: "Large enterprise deal",
  },
  {
    id: "2",
    employeeId: "EMP002",
    date: "2024-01-22",
    amount: 2200,
    quantity: 2,
    clientName: "Startup Inc",
    productsSold: ["Samsung Galaxy S24"],
    commission: 66,
    notes: "First time customer",
  },
  {
    id: "3",
    employeeId: "EMP001",
    date: "2024-01-21",
    amount: 3800,
    quantity: 4,
    clientName: "Local Business",
    productsSold: ["Various Electronics"],
    commission: 190,
  },
  {
    id: "4",
    employeeId: "EMP004",
    date: "2024-01-22",
    amount: 1500,
    quantity: 1,
    clientName: "Individual Customer",
    productsSold: ["iPad Pro"],
    commission: 52.5,
    notes: "Retail sale",
  },
  {
    id: "5",
    employeeId: "EMP002",
    date: "2024-01-21",
    amount: 1200,
    quantity: 1,
    clientName: "Small Business",
    productsSold: ["MacBook Air"],
    commission: 36,
  },
];

const mockTimeEntries: TimeEntry[] = [
  {
    id: "1",
    employeeId: "EMP001",
    date: "2024-01-22",
    clockIn: "08:30",
    clockOut: "17:15",
    totalHours: 8.75,
    status: "present",
  },
  {
    id: "2",
    employeeId: "EMP002",
    date: "2024-01-22",
    clockIn: "09:15",
    clockOut: "18:00",
    totalHours: 8.75,
    status: "late",
    notes: "Traffic delay",
  },
  {
    id: "3",
    employeeId: "EMP003",
    date: "2024-01-22",
    clockIn: "08:00",
    clockOut: "16:30",
    totalHours: 8.5,
    status: "present",
  },
];

// Sample sales performance data
const salesPerformanceData = [
  { month: "Jan", johnSales: 450, sarahSales: 280, lisaSales: 200 },
  { month: "Feb", johnSales: 5200, sarahSales: 3200, lisaSales: 250 },
  { month: "Mar", johnSales: 48, sarahSales: 350, lisaSales: 280 },
  { month: "Apr", johnSales: 610, sarahSales: 380, lisaSales: 300 },
  { month: "May", johnSales: 550, sarahSales: 420, lisaSales: 320 },
  { month: "Jun", johnSales: 670, sarahSales: 450, lisaSales: 350 },
  { month: "Aug", johnSales: 670, sarahSales: 450, lisaSales: 350 },
  { month: "Sep", johnSales: 670, sarahSales: 45000, lisaSales: 350 },
  { month: "Okt", johnSales: 670, sarahSales: 450, lisaSales: 350 },
  { month: "Nov", johnSales: 670, sarahSales: 450, lisaSales: 350 },
];

const departmentData = [
  { department: "Sales", employees: 8, productivity: 92, avgSales: 35000 },
  { department: "Marketing", employees: 5, productivity: 88, avgSales: 0 },
  { department: "IT", employees: 12, productivity: 95, avgSales: 0 },
  { department: "Finance", employees: 4, productivity: 89, avgSales: 0 },
  { department: "HR", employees: 3, productivity: 87, avgSales: 0 },
];

export default function Employees() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dailySales, setDailySales] = useState(mockDailySales);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Dialog states
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [isViewEmployeeOpen, setIsViewEmployeeOpen] = useState(false);
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [isViewSalesOpen, setIsViewSalesOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [filialOptions, setFilialOptions] = useState<
    { id: string; name: string }[]
  >([]);

  // Selected items
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [selectedEmployeeSales, setSelectedEmployeeSales] =
    useState<Employee | null>(null);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    position: "",
    role: "worker",
    salary: 0,
    commission: 0,
    skills: [],
    notes: "",
    salesTarget: 0,
  });
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const [newAttendance, setNewAttendance] = useState<Partial<AttendanceEntry>>({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    clockIn: "",
    clockOut: "",
    status: "present",
    notes: "",
  });

  const [newSale, setNewSale] = useState<Partial<DailySale>>({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    quantity: 0,
    clientName: "",
    productsSold: [],
    notes: "",
  });

  // Skills management
  const [currentSkill, setCurrentSkill] = useState("");

  const { toast } = useToast();
  const { users, loadUsers } = useRBACStore();

  const authUser = useAuthStore((s) => s.user);
  const scopedEmployees =
    authUser?.role === "manager" && authUser?.filialId
      ? employees.filter((e) => (e as any).filialId === authUser.filialId)
      : employees;

  const filteredEmployees = scopedEmployees.filter((employee) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    const email = (employee.email || "").toLowerCase();
    const empId = (employee.employeeId || "").toLowerCase();
    const matchesSearch =
      fullName.includes(term) || email.includes(term) || empId.includes(term);
    const matchesDepartment =
      departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus =
      statusFilter === "all" || employee.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  useEffect(() => {
    loadUsers().catch(() => {});

    const toAbsolute = (avatar?: string) => {
      if (!avatar) return undefined;
      if (/^(https?:)?\/\//i.test(avatar)) return avatar;
      if (avatar.startsWith("data:")) return avatar;
      const base = API_BASE.replace(/\/+$/, "");
      if (avatar.startsWith("/api/"))
        return `${base.replace(/\/api$/, "")}${avatar}`;
      if (avatar.startsWith("/")) return `${base}${avatar}`;
      if (/^(api\/|uploads\/|static\/|files\/)/i.test(avatar))
        return `${base}/${avatar}`;
      return `${base}/${avatar}`;
    };

    const loadEmployeesFromApi = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch<{ ok?: boolean; result?: WorkerApiItem[] }>(
          "/workers",
        );
        const list = Array.isArray(data?.result) ? data.result : [];
        const mapped: Employee[] = list.map((w) => ({
          id: w.id,
          employeeId: w.employeeId || w.id,
          firstName: w.firstName || "",
          lastName: w.lastName || "",
          email: undefined,
          accountId: w.accountId ? String(w.accountId) : undefined,
          phone: w.phone || "",
          address: w.address || "",
          department: (() => {
            const d = (w.department || "").trim();
            if (!d) return "";
            return d.charAt(0).toUpperCase() + d.slice(1);
          })(),
          position: w.position || "",
          role: ((): Employee["role"] => {
            const r = (w.role || "worker").toLowerCase();
            if (r === "admin" || r === "manager" || r === "intern")
              return r as any;
            return "worker";
          })(),
          salary: typeof w.salary === "number" ? w.salary : 0,
          commission: typeof w.commission === "number" ? w.commission : 0,
          hireDate:
            (w.createdAt &&
              new Date(w.createdAt).toISOString().split("T")[0]) ||
            new Date().toISOString().split("T")[0],
          status: ((): Employee["status"] => {
            const s = (w.status || "active").toLowerCase();
            return s === "inactive" || s === "terminated" || s === "on_leave"
              ? (s as any)
              : "active";
          })(),
          avatar: toAbsolute(w.avatar),
          filialId: w.filialId ? String(w.filialId) : undefined,
          manager: undefined,
          skills: Array.isArray(w.skills) ? w.skills : [],
          notes: w.notes || "",
          salesTarget: typeof w.salesTarget === "number" ? w.salesTarget : 0,
        }));
        setEmployees(mapped);
      } catch (e: any) {
        setError(e?.message || "Failed to load employees");
      } finally {
        setLoading(false);
      }
    };

    loadEmployeesFromApi();
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadFilials = async () => {
      try {
        const { useAuthStore } = await import("@/stores/authStore");
        const token = useAuthStore.getState().accessToken;
        const res = await fetch(joinApi("/filials"), {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const arr = Array.isArray((data as any)?.result)
          ? (data as any).result
          : Array.isArray(data)
            ? (data as any)
            : [];
        const mapped = arr
          .map((f: any) => {
            const id =
              f?.id ?? f?.filialId ?? f?.filialID ?? f?.storeId ?? f?.branchId;
            const name =
              f?.name ?? f?.title ?? f?.filialName ?? f?.storeName ?? id;
            if (!id) return null;
            return { id: String(id), name: String(name) };
          })
          .filter(Boolean) as { id: string; name: string }[];
        if (mounted) setFilialOptions(mapped);
      } catch {
        // ignore
      }
    };
    loadFilials();
    return () => {
      mounted = false;
    };
  }, []);

  // Fill missing employee emails from users by accountId
  useEffect(() => {
    if (!users || !users.length) return;
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.email) return e;
        const accId = (e as any).accountId;
        if (!accId) return e;
        const u = users.find((uu) => uu.id === accId);
        return u && u.email ? { ...e, email: u.email } : e;
      }),
    );
  }, [users]);

  // --- Load Mock Attendance for Selected Date ---
  const loadMockAttendanceForDate = async (date: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock attendance data for the selected date
    const mockAttendance: AttendanceEntry[] = [
      {
        id: "att1",
        employeeId: "1",
        date: date,
        clockIn: "08:30",
        clockOut: "17:15",
        totalHours: 8.75,
        status: "present",
        notes: "Regular day",
      },
      {
        id: "att2",
        employeeId: "2",
        date: date,
        clockIn: "09:00",
        clockOut: "18:00",
        totalHours: 8.0,
        status: "present",
      },
      {
        id: "att3",
        employeeId: "3",
        date: date,
        clockIn: "08:45",
        clockOut: "17:30",
        totalHours: 8.75,
        status: "present",
      },
      {
        id: "att4",
        employeeId: "4",
        date: date,
        clockIn: "09:15",
        clockOut: "17:45",
        totalHours: 8.5,
        status: "late",
        notes: "Traffic delay",
      },
    ];

    setAttendanceEntries(mockAttendance);
  };

  useEffect(() => {
    loadMockAttendanceForDate(selectedDate);
  }, [selectedDate]);

  const getSalesEmployees = () =>
    employees.filter(
      (emp) => emp.department === "Sales" && emp.status === "active",
    );

  const getDailySalesForEmployee = (employeeId: string, date: string) => {
    return dailySales.filter(
      (sale) => sale.employeeId === employeeId && sale.date === date,
    );
  };

  const getTotalSalesForEmployee = (employeeId: string, date: string) => {
    return getDailySalesForEmployee(employeeId, date).reduce(
      (sum, sale) => sum + sale.amount,
      0,
    );
  };

  const getTotalCommissionForEmployee = (employeeId: string, date: string) => {
    return getDailySalesForEmployee(employeeId, date).reduce(
      (sum, sale) => sum + sale.commission,
      0,
    );
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
      case "terminated":
        return <Badge variant="destructive">{t("status.terminated")}</Badge>;
      case "on_leave":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {t("status.on_leave")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("common.unknown")}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            {t("roles.labels.admin")}
          </Badge>
        );
      case "manager":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            {t("roles.labels.manager")}
          </Badge>
        );
      case "worker":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            {t("employees.employee_role")}
          </Badge>
        );
      case "intern":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            {t("employees.intern")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("common.unknown")}</Badge>;
    }
  };

  const generateEmployeeId = () => {
    const count = employees.length + 1;
    return `EMP${count.toString().padStart(3, "0")}`;
  };

  const clearNewEmployee = () => {
    setNewEmployee({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      department: "",
      position: "",
      role: "worker",
      salary: 0,
      commission: 0,
      skills: [],
      notes: "",
      salesTarget: 0,
    });
    setSelectedAccountId("");
    setCurrentSkill("");
  };

  const clearNewSale = () => {
    setNewSale({
      employeeId: "",
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      quantity: 0,
      clientName: "",
      productsSold: [],
      notes: "",
    });
  };

  const clearNewAttendance = () => {
    setNewAttendance({
      employeeId: "",
      date: new Date().toISOString().split("T")[0],
      clockIn: "",
      clockOut: "",
      status: "present",
      notes: "",
    });
  };

  const addAttendanceEntry = async () => {
    if (!newAttendance.employeeId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Calculate total hours if both clock in and out are provided
    let totalHours = 0;
    if (newAttendance.clockIn && newAttendance.clockOut) {
      const clockIn = new Date(`2000-01-01T${newAttendance.clockIn}:00`);
      const clockOut = new Date(`2000-01-01T${newAttendance.clockOut}:00`);
      totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
    }

    const attendanceEntry: AttendanceEntry = {
      id: Date.now().toString(),
      employeeId: newAttendance.employeeId!,
      date: newAttendance.date!,
      clockIn: newAttendance.clockIn,
      clockOut: newAttendance.clockOut,
      totalHours: totalHours,
      status: newAttendance.status || "present",
      notes: newAttendance.notes || "",
    };

    setAttendanceEntries([...attendanceEntries, attendanceEntry]);
    clearNewAttendance();
    setIsAttendanceOpen(false);

    const employee = employees.find(
      (emp) => emp.id === newAttendance.employeeId,
    );
    toast({
      title: "Attendance recorded",
      description: `Attendance recorded for ${employee?.firstName} ${employee?.lastName}.`,
    });
  };

  const getAttendanceForEmployee = (employeeId: string, date: string) => {
    return attendanceEntries.filter(
      (entry) => entry.employeeId === employeeId && entry.date === date,
    );
  };

  const getTodaysAttendance = () => {
    const today = selectedDate;
    return employees.map((employee) => {
      const attendance = getAttendanceForEmployee(employee.id, today)[0];
      return {
        employee,
        attendance,
      };
    });
  };

  const addSkill = () => {
    if (
      currentSkill.trim() &&
      !newEmployee.skills?.includes(currentSkill.trim())
    ) {
      setNewEmployee({
        ...newEmployee,
        skills: [...(newEmployee.skills || []), currentSkill.trim()],
      });
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setNewEmployee({
      ...newEmployee,
      skills:
        newEmployee.skills?.filter((skill) => skill !== skillToRemove) || [],
    });
  };

  const addEmployee = async () => {
    if (!selectedAccountId) {
      toast({
        title: "Error",
        description: "Please select an email (user account)",
        variant: "destructive",
      });
      return;
    }

    try {
      const { useAuthStore } = await import("@/stores/authStore");
      const token = useAuthStore.getState().accessToken;

      const body = {
        accountId: selectedAccountId,
        phone: newEmployee.phone || "",
        address: newEmployee.address || "",
        position: newEmployee.position || "",
        salary: newEmployee.salary || 0,
        commission: newEmployee.commission || 0,
        status: "active",
        skills: newEmployee.skills || [],
        notes: newEmployee.notes || "",
        salesTarget: newEmployee.salesTarget || 0,
      } as any;

      const res = await fetch(joinApi("/workers"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        throw new Error(msg);
      }

      const selectedUser = users.find((u) => u.id === selectedAccountId);
      const nameParts = (selectedUser?.name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const mapRole = (r?: string): Employee["role"] => {
        switch ((r || "").toLowerCase()) {
          case "admin":
          case "super_admin":
            return "admin";
          case "manager":
          case "team_lead":
            return "manager";
          case "intern":
            return "intern";
          default:
            return "worker";
        }
      };

      const employeeToAdd: Employee = {
        id: Date.now().toString(),
        employeeId: generateEmployeeId(),
        firstName,
        lastName,
        email: selectedUser?.email || newEmployee.email!,
        accountId: selectedAccountId,
        phone: newEmployee.phone || "",
        address: newEmployee.address || "",
        department: selectedUser?.department || newEmployee.department || "",
        position: newEmployee.position || "",
        role: mapRole(selectedUser?.role),
        salary: newEmployee.salary || 0,
        commission: newEmployee.commission || 0,
        status: "active",
        skills: newEmployee.skills || [],
        notes: newEmployee.notes || "",
        salesTarget: newEmployee.salesTarget || 0,
        hireDate: new Date().toISOString().split("T")[0],
        avatar: selectedUser?.avatar,
      };

      setEmployees([...employees, employeeToAdd]);
      clearNewEmployee();
      setIsAddEmployeeOpen(false);

      toast({
        title: "Employee added",
        description:
          `${employeeToAdd.firstName || ""} ${employeeToAdd.lastName || ""}`.trim()
            .length
            ? `${employeeToAdd.firstName} ${employeeToAdd.lastName} has been added to the team.`
            : `Employee ${employeeToAdd.email} has been added to the team.`,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to add employee",
        variant: "destructive",
      });
    }
  };

  const updateEmployee = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "No employee selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const { useAuthStore } = await import("@/stores/authStore");
      const token = useAuthStore.getState().accessToken;

      const body = {
        phone: newEmployee.phone || "",
        address: newEmployee.address || "",
        position: newEmployee.position || "",
        salary: newEmployee.salary || 0,
        commission: newEmployee.commission || 0,
        status:
          (newEmployee.status as Employee["status"]) || selectedEmployee.status,
        skills: newEmployee.skills || [],
        notes: newEmployee.notes || "",
        salesTarget: newEmployee.salesTarget || 0,
      };

      const res = await fetch(joinApi(`/workers/${selectedEmployee.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        throw new Error(msg);
      }

      const updatedEmployee: Employee = {
        ...selectedEmployee,
        phone: body.phone,
        address: body.address,
        position: body.position,
        salary: body.salary,
        commission: body.commission,
        status: body.status,
        skills: body.skills,
        notes: body.notes,
        salesTarget: body.salesTarget,
      };

      setEmployees(
        employees.map((emp) =>
          emp.id === selectedEmployee.id ||
          emp.employeeId === selectedEmployee.employeeId
            ? updatedEmployee
            : emp,
        ),
      );
      clearNewEmployee();
      setIsEditEmployeeOpen(false);
      setSelectedEmployee(null);

      toast({
        title: "Employee updated",
        description: `${updatedEmployee.firstName} ${updatedEmployee.lastName} has been updated.`,
      });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message || "Failed to update employee",
        variant: "destructive",
      });
    }
  };

  const deleteEmployee = async (idOrEmployeeId: string) => {
    const employee =
      employees.find((emp) => emp.id === idOrEmployeeId) ||
      employees.find((emp) => emp.employeeId === idOrEmployeeId);
    if (!employee) {
      toast({
        title: "Error",
        description: "Employee not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const { useAuthStore } = await import("@/stores/authStore");
      const token = useAuthStore.getState().accessToken;

      const res = await fetch(
        joinApi(`/workers/${encodeURIComponent(employee.id)}`),
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        throw new Error(msg || `HTTP ${res.status}`);
      }

      setEmployees(
        employees.filter(
          (emp) =>
            emp.id !== employee.id && emp.employeeId !== employee.employeeId,
        ),
      );
      toast({
        title: "Employee removed",
        description: `${employee.firstName} ${employee.lastName} has been removed from the team.`,
      });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message || "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  const openEditEmployeeDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setNewEmployee({
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      position: employee.position,
      salary: employee.salary,
      commission: employee.commission,
      status: employee.status,
      skills: employee.skills,
      notes: employee.notes,
      salesTarget: employee.salesTarget,
    });
    setCurrentSkill("");
    setIsEditEmployeeOpen(true);
  };

  const addDailySale = () => {
    if (!newSale.employeeId || !newSale.amount || !newSale.clientName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const employee = employees.find((emp) => emp.id === newSale.employeeId);
    const commission = (newSale.amount! * (employee?.commission || 0)) / 100;

    const sale: DailySale = {
      id: Date.now().toString(),
      employeeId: newSale.employeeId!,
      date: newSale.date!,
      amount: newSale.amount!,
      quantity: newSale.quantity || 1,
      clientName: newSale.clientName!,
      productsSold: newSale.productsSold || [],
      commission: commission,
      notes: newSale.notes || "",
    };

    setDailySales([...dailySales, sale]);
    clearNewSale();
    setIsAddSaleOpen(false);

    toast({
      title: "Sale recorded",
      description: `Sale of $${sale.amount} recorded for ${employee?.firstName} ${employee?.lastName}.`,
    });
  };

  const updateEmployeeStatus = (employeeId: string, newStatus: string) => {
    setEmployees(
      employees.map((emp) =>
        emp.id === employeeId ? { ...emp, status: newStatus as any } : emp,
      ),
    );

    toast({
      title: "Status updated",
      description: `Employee status changed to ${newStatus}.`,
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getFilialName = (id?: string) => {
    if (!id) return "";
    const f = filialOptions.find((fi) => String(fi.id) === String(id));
    return f?.name || id;
  };

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

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
        h1 { font-size: 24px; margin: 0 0 8px; }
        h3 { margin: 12px 0 8px; font-size: 14px; color:#334155; text-transform: uppercase; letter-spacing:.06em; }
        .subtitle { color:#64748b; font-size: 14px; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
        table { width:100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        th { background: var(--muted); color:#334155; font-weight:600; }
        .right { text-align:right; }
        .muted { color:#64748b; }
        .badge { background: #eef2ff; color:#3730a3; padding:4px 8px; border-radius:8px; font-size:12px; font-weight:600; }
        @media print { .card { box-shadow:none; border:0; } }
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

  const exportEmployeeReport = () => {
    const todaysSales = dailySales
      .filter((s) => s.date === selectedDate)
      .reduce((sum, s) => sum + s.amount, 0);
    const todaysCommissions = dailySales
      .filter((s) => s.date === selectedDate)
      .reduce((sum, s) => sum + s.commission, 0);
    const avgSalary = Math.round(
      employees.reduce((sum, e) => sum + e.salary, 0) /
        Math.max(employees.length, 1),
    );

    const reportData = {
      reportType: "Employee Report",
      generatedAt: new Date().toISOString(),
      summary: {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.status === "active").length,
        salesTeam: getSalesEmployees().length,
        todaysSales,
        todaysCommissions,
        avgSalary,
      },
      employees: filteredEmployees,
      dailySales,
      timeEntries,
      salesPerformanceData,
      departmentData,
    };

    const html = buildEmployeeReportHTML(reportData);
    openPrintWindow(html, t("employees.pdf_title"));

    toast({
      title: t("employees.pdf_title"),
      description: t("employees.pdf_desc"),
    });
  };

  const exportEmployeeDirectory = () => {
    let csv =
      "Employee ID,First Name,Last Name,Email,Phone,Department,Position,Role,Status,Hire Date,Salary,Commission %,Sales Target\n";
    filteredEmployees.forEach((employee) => {
      csv += `${employee.employeeId},"${employee.firstName}","${employee.lastName}",${employee.email},${employee.phone},${employee.department},${employee.position},${employee.role},${employee.status},${employee.hireDate},${employee.salary},${employee.commission},${employee.salesTarget || ""}\n`;
    });

    downloadFile(csv, "employee-directory.csv", "text/csv");
    toast({
      title: "Directory Exported",
      description: "Employee directory has been exported as CSV.",
    });
  };

  const exportSalesPerformance = () => {
    let csv =
      "Employee ID,Name,Date,Sales Amount,Commission,Client,Products,Notes\n";
    dailySales.forEach((sale) => {
      const employee = employees.find((e) => e.id === sale.employeeId);
      if (employee) {
        csv += `${employee.employeeId},"${employee.firstName} ${employee.lastName}",${sale.date},${sale.amount},${sale.commission},"${sale.clientName}","${sale.productsSold.join(", ")}","${sale.notes || ""}"\n`;
      }
    });

    downloadFile(csv, "sales-performance.csv", "text/csv");
    toast({
      title: "Sales Performance Exported",
      description: "Sales performance data has been exported as CSV.",
    });
  };

  const exportAttendance = () => {
    let csv =
      "Employee ID,Name,Date,Clock In,Clock Out,Total Hours,Status,Notes\n";
    timeEntries.forEach((entry) => {
      const employee = employees.find((e) => e.employeeId === entry.employeeId);
      if (employee) {
        csv += `${employee.employeeId},"${employee.firstName} ${employee.lastName}",${entry.date},${entry.clockIn},${entry.clockOut || ""},${entry.totalHours},${entry.status},"${entry.notes || ""}"\n`;
      }
    });

    downloadFile(csv, "attendance-data.csv", "text/csv");
    toast({
      title: "Attendance Exported",
      description: "Attendance data has been exported as CSV.",
    });
  };

  const buildEmployeeReportHTML = (data: any) => {
    const nf = (n: number) =>
      new Intl.NumberFormat(i18n.language || "en").format(n || 0);
    const dateStr = new Intl.DateTimeFormat(i18n.language || "en", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(data.generatedAt));

    const directoryRows = data.employees
      .map(
        (emp: any) => `
      <tr>
        <td>${emp.firstName} ${emp.lastName}</td>
        <td>${emp.department}</td>
        <td>${emp.position || ""}</td>
        <td>${t(`status.${emp.status}`)}</td>
      </tr>
    `,
      )
      .join("");

    const deptRows = data.departmentData
      .map(
        (d: any) => `
      <tr>
        <td>${d.department}</td>
        <td class="right">${nf(d.employees)}</td>
        <td class="right">${d.productivity}%</td>
      </tr>
    `,
      )
      .join("");

    const salesRows = data.dailySales
      .slice(0, 50)
      .map((s: any) => {
        const emp = data.employees.find(
          (e: any) => e.id === s.employeeId || e.employeeId === s.employeeId,
        );
        return `
        <tr>
          <td>${s.date}</td>
          <td>${emp ? emp.firstName + " " + emp.lastName : ""}</td>
          <td class="right">$${nf(s.amount)}</td>
          <td class="right">$${(Number(s.commission) || 0).toFixed(2)}</td>
        </tr>`;
      })
      .join("");

    const attendanceRows = data.timeEntries
      .slice(0, 50)
      .map((a: any) => {
        const emp = data.employees.find(
          (e: any) => e.employeeId === a.employeeId,
        );
        return `
        <tr>
          <td>${a.date}</td>
          <td>${emp ? emp.firstName + " " + emp.lastName : ""}</td>
          <td class="right">${a.totalHours}h</td>
          <td>${t(`status.${a.status}`)}</td>
        </tr>`;
      })
      .join("");

    return `
      <div class="container">
        <div class="card">
          <div class="header">
            <div>
              <h1>${t("employees.export_employee_report")}</h1>
              <div class="subtitle">${t("finance.generated_at")}: ${dateStr}</div>
            </div>
          </div>
          <div class="grid" style="margin-top:16px;">
            <div>
              <h3>${t("finance.executive_summary")}</h3>
              <table><tbody>
                <tr><td>${t("employees.total_employees")}</td><td class="right">${nf(data.summary.totalEmployees)}</td></tr>
                <tr><td>${t("status.active")}</td><td class="right">${nf(data.summary.activeEmployees)}</td></tr>
                <tr><td>${t("employees.sales_team")}</td><td class="right">${nf(data.summary.salesTeam)}</td></tr>
                <tr><td>${t("employees.todays_sales")}</td><td class="right">$${nf(data.summary.todaysSales)}</td></tr>
                <tr><td>${t("employees.commissions")}</td><td class="right">$${(Number(data.summary.todaysCommissions) || 0).toFixed(2)}</td></tr>
                <tr><td>${t("employees.average_salary")}</td><td class="right">$${nf(data.summary.avgSalary)}</td></tr>
              </tbody></table>
            </div>
            <div>
              <h3>${t("employees.department_statistics")}</h3>
              <table>
                <thead><tr><th>${t("employees.department")}</th><th class="right">${t("employees.employee")}</th><th class="right">${t("employees.productivity")}%</th></tr></thead>
                <tbody>${deptRows || `<tr><td colspan="3" class="muted">${t("clients.no_products", "No data")}</td></tr>`}</tbody>
              </table>
            </div>
          </div>
          <div style="margin-top:16px;">
            <h3>${t("employees.employee_directory")}</h3>
            <table>
              <thead><tr><th>${t("clients.name", "Name")}</th><th>${t("employees.department")}</th><th>${t("employees.position")}</th><th>${t("common.status")}</th></tr></thead>
              <tbody>${directoryRows || `<tr><td colspan="4" class="muted">${t("clients.no_products", "No data")}</td></tr>`}</tbody>
            </table>
          </div>
          <div style="margin-top:16px;">
            <h3>${t("employees.sales_performance_header")}</h3>
            <table>
              <thead><tr><th>${t("common.date")}</th><th>${t("employees.employee")}</th><th class="right">${t("sales.total_value")}</th><th class="right">${t("employees.commission")}</th></tr></thead>
              <tbody>${salesRows || `<tr><td colspan="4" class="muted">${t("clients.no_products", "No data")}</td></tr>`}</tbody>
            </table>
          </div>
          <div style="margin-top:16px;">
            <h3>${t("employees.employee_attendance_header")}</h3>
            <table>
              <thead><tr><th>${t("common.date")}</th><th>${t("employees.employee")}</th><th class="right">${t("employees.total_hours")}</th><th>${t("common.status")}</th></tr></thead>
              <tbody>${attendanceRows || `<tr><td colspan="4" class="muted">${t("clients.no_products", "No data")}</td></tr>`}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  };

  const generateEmployeeExcelContent = (data: any) => {
    return generateEmployeeCSVContent(data);
  };

  const generateEmployeeCSVContent = (data: any) => {
    let csv = "";

    // Summary
    csv += "Employee Summary\n";
    csv += `Generated,${new Date(data.generatedAt).toLocaleString()}\n`;
    csv += "\n";
    csv += "Metric,Value\n";
    csv += `Total Employees,${data.summary.totalEmployees}\n`;
    csv += `Active Employees,${data.summary.activeEmployees}\n`;
    csv += `Sales Team,${data.summary.salesTeam}\n`;
    csv += `Today's Sales,$${data.summary.todaysSales.toLocaleString()}\n`;
    csv += `Today's Commissions,$${data.summary.todaysCommissions.toFixed(2)}\n`;
    csv += `Average Salary,${data.summary.avgSalary.toLocaleString()}c\n`;
    csv += "\n";

    // Department Data
    csv += "Department Statistics\n";
    csv += "Department,Employees,Productivity %,Avg Sales\n";
    data.departmentData.forEach((dept: any) => {
      csv += `${dept.department},${dept.employees},${dept.productivity},${dept.avgSales}\n`;
    });
    csv += "\n";

    // Employee Directory
    csv += "Employee Directory\n";
    csv +=
      "Employee ID,First Name,Last Name,Email,Phone,Department,Position,Role,Status,Hire Date,Salary,Commission %,Sales Target\n";
    data.employees.forEach((employee: any) => {
      csv += `${employee.employeeId},"${employee.firstName}","${employee.lastName}",${employee.email},${employee.phone},${employee.department},${employee.position},${employee.role},${employee.status},${employee.hireDate},${employee.salary},${employee.commission},${employee.salesTarget || ""}\n`;
    });
    csv += "\n";

    // Sales Performance
    csv += "Sales Performance\n";
    csv +=
      "Employee ID,Name,Date,Sales Amount,Commission,Client,Products,Notes\n";
    data.dailySales.forEach((sale: any) => {
      const employee = data.employees.find(
        (e: any) => e.id === sale.employeeId,
      );
      if (employee) {
        csv += `${employee.employeeId},"${employee.firstName} ${employee.lastName}",${sale.date},${sale.amount},${sale.commission},"${sale.clientName}","${sale.productsSold.join(", ")}","${sale.notes || ""}"\n`;
      }
    });
    csv += "\n";

    // Attendance Data
    csv += "Attendance Data\n";
    csv +=
      "Employee ID,Name,Date,Clock In,Clock Out,Total Hours,Status,Notes\n";
    data.timeEntries.forEach((entry: any) => {
      const employee = data.employees.find(
        (e: any) => e.employeeId === entry.employeeId,
      );
      if (employee) {
        csv += `${employee.employeeId},"${employee.firstName} ${employee.lastName}",${entry.date},${entry.clockIn},${entry.clockOut || ""},${entry.totalHours},${entry.status},"${entry.notes || ""}"\n`;
      }
    });

    return csv;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-optimized header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("employees.title")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t("employees.subtitle")}
          </p>
        </div>

        {/* Mobile-first action buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-center"
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("dashboard.export_report")}
                </span>
                <span className="sm:hidden">{t("common.export")}</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>
                {t("employees.export_employee_report")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2 space-y-1">
                <div className="text-xs text-muted-foreground mb-2">
                  {t("employees.export_desc")}
                </div>
                <DropdownMenuItem
                  onClick={() => exportEmployeeReport()}
                  className="cursor-pointer"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">
                      {t("employees.pdf_title")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("employees.pdf_desc")}
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-center"
              >
                <Clock className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("employees.mark_attendance")}
                </span>
                <span className="sm:hidden">{t("employees.attendance")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {t("employees.mark_employee_attendance")}
                </DialogTitle>
                <DialogDescription>
                  {t("employees.record_attendance_desc")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="attendanceEmployee">
                    {t("employees.employee")} *
                  </Label>
                  <Select
                    value={newAttendance.employeeId}
                    onValueChange={(value) =>
                      setNewAttendance({ ...newAttendance, employeeId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("employees.select_employee")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((emp) => emp.status === "active")
                        .map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName} -{" "}
                            {employee.department}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attendanceDate">{t("common.date")}</Label>
                    <Input
                      id="attendanceDate"
                      type="date"
                      value={newAttendance.date}
                      onChange={(e) =>
                        setNewAttendance({
                          ...newAttendance,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendanceStatus">
                      {t("common.status")}
                    </Label>
                    <Select
                      value={newAttendance.status}
                      onValueChange={(value) =>
                        setNewAttendance({
                          ...newAttendance,
                          status: value as any,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">
                          {t("status.present")}
                        </SelectItem>
                        <SelectItem value="absent">
                          {t("status.absent")}
                        </SelectItem>
                        <SelectItem value="late">{t("status.late")}</SelectItem>
                        <SelectItem value="half_day">
                          {t("status.half_day")}
                        </SelectItem>
                        <SelectItem value="on_break">
                          {t("status.on_break")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clockIn">{t("employees.clock_in")}</Label>
                    <Input
                      id="clockIn"
                      type="time"
                      value={newAttendance.clockIn}
                      onChange={(e) =>
                        setNewAttendance({
                          ...newAttendance,
                          clockIn: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clockOut">{t("employees.clock_out")}</Label>
                    <Input
                      id="clockOut"
                      type="time"
                      value={newAttendance.clockOut}
                      onChange={(e) =>
                        setNewAttendance({
                          ...newAttendance,
                          clockOut: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendanceNotes">{t("common.notes")}</Label>
                  <Textarea
                    id="attendanceNotes"
                    placeholder={t("employees.additional_notes_employee")}
                    value={newAttendance.notes}
                    onChange={(e) =>
                      setNewAttendance({
                        ...newAttendance,
                        notes: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={addAttendanceEntry}>
                    {t("employees.mark_attendance")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearNewAttendance();
                      setIsAttendanceOpen(false);
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto justify-center">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("employees.add_employee")}
                </span>
                <span className="sm:hidden">{t("common.add")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("employees.add_new_employee")}</DialogTitle>
                <DialogDescription>
                  {t("employees.create_employee_profile")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email_address")} *</Label>
                    <Select
                      value={selectedAccountId}
                      onValueChange={(val) => {
                        setSelectedAccountId(val);
                        const u = users.find((x) => x.id === val);
                        setNewEmployee((prev) => ({
                          ...prev,
                          email: u?.email || "",
                          firstName: (u?.name || "").split(/\s+/)[0] || "",
                          lastName:
                            (u?.name || "").split(/\s+/).slice(1).join(" ") ||
                            "",
                          department: u?.department || "",
                          role: (u?.role?.toLowerCase?.() as any) || "worker",
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("employees.select_email_unused")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(
                            (u) => !employees.some((e) => e.email === u.email),
                          )
                          .map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.email} — {u.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("clients.phone_number")}</Label>
                    <Input
                      id="phone"
                      placeholder="+992000000000"
                      value={newEmployee.phone}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("common.address")}</Label>
                  <Textarea
                    id="address"
                    placeholder="123 Main St, City, State 12345"
                    value={newEmployee.address}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        address: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">{t("employees.position")}</Label>
                    <Input
                      id="position"
                      placeholder="Sales Manager"
                      value={newEmployee.position}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          position: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary">
                      {t("employees.annual_salary")}
                    </Label>
                    <Input
                      id="salary"
                      type="number"
                      placeholder="75000"
                      value={newEmployee.salary}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          salary: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Sales-specific fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission">
                      {t("employees.commission")} (%)
                    </Label>
                    <Input
                      id="commission"
                      type="number"
                      placeholder="5"
                      value={newEmployee.commission}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          commission: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salesTarget">
                      {t("employees.monthly_sales_target")}
                    </Label>
                    <Input
                      id="salesTarget"
                      type="number"
                      placeholder="50000"
                      value={newEmployee.salesTarget}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          salesTarget: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Skills section */}
                <div className="space-y-2">
                  <Label>{t("employees.skills")}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button type="button" onClick={addSkill} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {newEmployee.skills && newEmployee.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newEmployee.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {skill}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-2"
                            onClick={() => removeSkill(skill)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t("common.notes")}</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about the employee"
                    value={newEmployee.notes}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={addEmployee}>
                    {t("employees.add_employee")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearNewEmployee();
                      setIsAddEmployeeOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Button
        size="icon-lg"
        className="fixed right-4 bottom-24 z-40 h-14 w-14 rounded-full shadow-business-lg lg:hidden"
        aria-label={t("employees.add_employee") as string}
        onClick={() => setIsAddEmployeeOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Mobile-optimized overview cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {t("employees.total_employees")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {employees.length}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {employees.filter((e) => e.status === "active").length}{" "}
              {t("status.active")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("employees.sales_team")}
            </CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getSalesEmployees().length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("employees.active_sales_staff")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("employees.todays_sales")}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {dailySales
                .filter((s) => s.date === selectedDate)
                .reduce((sum, s) => sum + s.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailySales.filter((s) => s.date === selectedDate).length}{" "}
              {t("employees.transactions")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("employees.commissions")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {dailySales
                .filter((s) => s.date === selectedDate)
                .reduce((sum, s) => sum + s.commission, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("employees.todays_commissions_desc")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("employees.average_salary")}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {Math.round(
                employees.reduce((sum, e) => sum + e.salary, 0) /
                  employees.length,
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("employees.per_year")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 overflow-x-auto">
          <TabsTrigger value="directory" className="text-xs md:text-sm">
            {t("employees.employee_directory")}
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs md:text-sm">
            {t("sales.title")}
          </TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs md:text-sm">
            {t("employees.attendance")}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs md:text-sm">
            {t("employees.hr_analytics")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-4">
          {/* Employee Directory */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                {t("employees.employee_directory")}
              </CardTitle>
              {/* Mobile-optimized filters */}
              <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("employees.search_employees")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                  >
                    <SelectTrigger className="flex-1 md:w-[150px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("employees.department")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("employees.all_departments")}
                      </SelectItem>
                      <SelectItem value="Sales">
                        {t("departments.sales")}
                      </SelectItem>
                      <SelectItem value="Marketing">
                        {t("departments.marketing")}
                      </SelectItem>
                      <SelectItem value="IT">{t("departments.it")}</SelectItem>
                      <SelectItem value="Finance">
                        {t("departments.finance")}
                      </SelectItem>
                      <SelectItem value="HR">{t("departments.hr")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1 md:w-[130px]">
                      <SelectValue placeholder={t("common.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("employees.all_status")}
                      </SelectItem>
                      <SelectItem value="active">
                        {t("status.active")}
                      </SelectItem>
                      <SelectItem value="inactive">
                        {t("status.inactive")}
                      </SelectItem>
                      <SelectItem value="on_leave">
                        {t("status.on_leave")}
                      </SelectItem>
                      <SelectItem value="terminated">
                        {t("status.terminated")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table containerClassName="hidden md:block">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("employees.employee")}</TableHead>
                    <TableHead>{t("clients.contact")}</TableHead>
                    <TableHead>{t("employees.department")}</TableHead>
                    <TableHead>{t("employees.role")}</TableHead>
                    <TableHead>{t("employees.salary")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback>
                              {getInitials(
                                employee.firstName,
                                employee.lastName,
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {employee.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {employee.department}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.position}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(employee.role)}</TableCell>
                      <TableCell className="font-medium">
                        <div>{employee.salary.toLocaleString()}c</div>
                        <div className="text-xs text-muted-foreground">
                          {employee.commission}% {t("employees.commission")}
                        </div>
                        {employee.salesTarget && (
                          <div className="text-xs text-muted-foreground">
                            {t("employees.target_label")}: $
                            {employee.salesTarget.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsViewEmployeeOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditEmployeeDialog(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete employee?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently remove the employee from the
                                  system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {t("common.cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteEmployee(employee.id)}
                                >
                                  {t("common.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="md:hidden space-y-3 mt-3">
                {filteredEmployees.map((employee) => (
                  <MobileEmployeeCard
                    key={employee.id}
                    employee={employee as any}
                    onView={(emp) => {
                      setSelectedEmployee(emp as any);
                      setIsViewEmployeeOpen(true);
                    }}
                    onEdit={(emp) => openEditEmployeeDialog(emp as any)}
                    onDelete={(id) => deleteEmployee(id)}
                    onStatusChange={(id, status) =>
                      updateEmployeeStatus(id, status)
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {/* Daily Sales Tracking */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {t("employees.sales_performance_header")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("employees.sales_performance_subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Label htmlFor="salesDate">{t("common.date")}:</Label>
                <Input
                  id="salesDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          </div>

          {/* Sales Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            {getSalesEmployees().map((employee) => {
              const dailySalesAmount = getTotalSalesForEmployee(
                employee.id,
                selectedDate,
              );
              const dailyCommission = getTotalCommissionForEmployee(
                employee.id,
                selectedDate,
              );
              const salesCount = getDailySalesForEmployee(
                employee.id,
                selectedDate,
              ).length;
              const targetProgress = employee.salesTarget
                ? (dailySalesAmount / employee.salesTarget) * 100
                : 0;

              return (
                <Card key={employee.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(employee.firstName, employee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-sm">
                            {employee.firstName} {employee.lastName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {employee.position}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployeeSales(employee);
                          setIsViewSalesOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">
                          {t("employees.sales_label")}
                        </div>
                        <div className="font-semibold text-green-600">
                          ${dailySalesAmount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          {t("employees.commission")}
                        </div>
                        <div className="font-semibold text-blue-600">
                          ${dailyCommission.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-muted-foreground">
                        {t("employees.transactions")}: {salesCount}
                      </div>
                    </div>
                    {employee.salesTarget && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{t("employees.monthly_progress")}</span>
                          <span>{targetProgress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(targetProgress, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("employees.target_label")}: $
                          {employee.salesTarget.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t("employees.sales_performance_trend")}</CardTitle>
              <CardDescription>
                {t("employees.monthly_sales_by_employee")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="johnSales"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="John Smith"
                  />
                  <Line
                    type="monotone"
                    dataKey="sarahSales"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Sarah Johnson"
                  />
                  <Line
                    type="monotone"
                    dataKey="lisaSales"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Lisa Rodriguez"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          {/* Attendance Tracking */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {t("employees.employee_attendance_header")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("employees.employee_attendance_subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Label htmlFor="attendanceDate">{t("common.date")}:</Label>
                <Input
                  id="attendanceDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          </div>

          {/* Attendance Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("employees.present_today")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {
                    getTodaysAttendance().filter(
                      ({ attendance }) => attendance?.status === "present",
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("employees.employees_present")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("employees.late_arrivals")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {
                    getTodaysAttendance().filter(
                      ({ attendance }) => attendance?.status === "late",
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("employees.late_employees")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("employees.absent_today")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {
                    getTodaysAttendance().filter(
                      ({ attendance }) =>
                        attendance?.status === "absent" || !attendance,
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("employees.not_present")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("employees.total_hours_card")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getTodaysAttendance()
                    .reduce(
                      (sum, { attendance }) =>
                        sum + (attendance?.totalHours || 0),
                      0,
                    )
                    .toFixed(1)}
                  h
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("employees.hours_worked")}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("employees.todays_attendance")} - {selectedDate}
              </CardTitle>
              <CardDescription>
                {t("employees.clock_records_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table containerClassName="hidden md:block">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("employees.employee")}</TableHead>
                    <TableHead>{t("employees.clock_in")}</TableHead>
                    <TableHead>{t("employees.clock_out")}</TableHead>
                    <TableHead>{t("employees.total_hours")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("common.notes")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getTodaysAttendance().map(({ employee, attendance }) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getInitials(
                                employee.firstName,
                                employee.lastName,
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.employeeId} - {employee.department}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {attendance?.clockIn ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-green-500" />
                            {attendance.clockIn}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {attendance?.clockOut ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-red-500" />
                            {attendance.clockOut}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {attendance?.totalHours
                          ? `${attendance.totalHours.toFixed(1)}h`
                          : "--"}
                      </TableCell>
                      <TableCell>
                        {attendance?.status === "present" && (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            {t("status.present")}
                          </Badge>
                        )}
                        {attendance?.status === "absent" && (
                          <Badge variant="destructive">
                            {t("status.absent")}
                          </Badge>
                        )}
                        {attendance?.status === "late" && (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-800"
                          >
                            {t("status.late")}
                          </Badge>
                        )}
                        {attendance?.status === "half_day" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700"
                          >
                            {t("status.half_day")}
                          </Badge>
                        )}
                        {attendance?.status === "on_break" && (
                          <Badge
                            variant="outline"
                            className="bg-orange-50 text-orange-700"
                          >
                            {t("status.on_break")}
                          </Badge>
                        )}
                        {!attendance && (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-800"
                          >
                            {t("employees.not_marked")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {attendance?.notes || "--"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewAttendance({
                              ...newAttendance,
                              employeeId: employee.id,
                              date: selectedDate,
                            });
                            setIsAttendanceOpen(true);
                          }}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="md:hidden space-y-3 mt-3">
                {getTodaysAttendance().map(({ employee, attendance }) => (
                  <div
                    key={employee.id}
                    className="rounded-xl border p-4 bg-card shadow-business"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {`${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {employee.employeeId} • {employee.department}
                        </div>
                      </div>
                      <div>
                        {attendance?.status === "present" && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {t("status.present")}
                          </Badge>
                        )}
                        {attendance?.status === "absent" && (
                          <Badge variant="destructive" className="text-xs">
                            {t("status.absent")}
                          </Badge>
                        )}
                        {attendance?.status === "late" && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            {t("status.late")}
                          </Badge>
                        )}
                        {attendance?.status === "half_day" && (
                          <Badge variant="outline" className="text-xs">
                            {t("status.half_day")}
                          </Badge>
                        )}
                        {attendance?.status === "on_break" && (
                          <Badge variant="outline" className="text-xs">
                            {t("status.on_break")}
                          </Badge>
                        )}
                        {!attendance && (
                          <Badge variant="secondary" className="text-xs">
                            {t("employees.not_marked")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("employees.clock_in")}
                        </div>
                        <div className="flex items-center gap-1">
                          {attendance?.clockIn || "--"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("employees.clock_out")}
                        </div>
                        <div className="flex items-center gap-1">
                          {attendance?.clockOut || "--"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("employees.total_hours")}
                        </div>
                        <div>
                          {attendance?.totalHours
                            ? `${attendance.totalHours.toFixed(1)}h`
                            : "--"}
                        </div>
                      </div>
                    </div>
                    {attendance?.notes && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {attendance.notes}
                      </div>
                    )}
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewAttendance({
                            ...newAttendance,
                            employeeId: employee.id,
                            date: selectedDate,
                          });
                          setIsAttendanceOpen(true);
                        }}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* HR Analytics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>
                  Employee count and productivity by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="employees" fill="#8884d8" name="Employees" />
                    <Bar
                      dataKey="productivity"
                      fill="#82ca9d"
                      name="Productivity %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales vs Other Departments</CardTitle>
                <CardDescription>Employee distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="employees"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(${index * 45}, 70%, 60%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Department Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Department Statistics</CardTitle>
              <CardDescription>
                Detailed breakdown by department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table containerClassName="hidden md:block">
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Avg Salary</TableHead>
                    <TableHead>Productivity</TableHead>
                    <TableHead>Sales Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentData.map((dept) => {
                    const deptEmployees = employees.filter(
                      (e) => e.department === dept.department,
                    );
                    const avgSalary =
                      deptEmployees.reduce((sum, e) => sum + e.salary, 0) /
                      deptEmployees.length;

                    return (
                      <TableRow key={dept.department}>
                        <TableCell className="font-medium">
                          {dept.department}
                        </TableCell>
                        <TableCell>{dept.employees}</TableCell>
                        <TableCell>
                          {Math.round(avgSalary).toLocaleString()}c
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-green-500 rounded-full transition-all"
                                style={{ width: `${dept.productivity}%` }}
                              />
                            </div>
                            <span className="text-sm">
                              {dept.productivity}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {dept.department === "Sales" ? (
                            <div className="text-green-600 font-medium">
                              ${dept.avgSales.toLocaleString()}/month
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="md:hidden space-y-3 mt-3">
                {departmentData.map((dept) => {
                  const deptEmployees = employees.filter(
                    (e) => e.department === dept.department,
                  );
                  const avgSalary = deptEmployees.length
                    ? Math.round(
                        deptEmployees.reduce((sum, e) => sum + e.salary, 0) /
                          deptEmployees.length,
                      )
                    : 0;
                  return (
                    <div
                      key={dept.department}
                      className="rounded-xl border p-4 bg-card shadow-business"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{dept.department}</div>
                        <div className="text-sm text-muted-foreground">
                          {t("employees.productivity")}: {dept.productivity}%
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {t("employees.employee")}
                          </div>
                          <div className="font-medium">{dept.employees}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {t("employees.avg_salary", {
                              defaultValue: "Avg Salary",
                            })}
                          </div>
                          <div className="font-medium">
                            {avgSalary.toLocaleString()}c
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {dept.department === "Sales" ? (
                          <span>${dept.avgSales.toLocaleString()}/month</span>
                        ) : (
                          <span>N/A</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Employee Dialog */}
      <Dialog open={isViewEmployeeOpen} onOpenChange={setIsViewEmployeeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("employees.employee_details")}</DialogTitle>
            <DialogDescription>
              {t("employees.complete_profile")} {selectedEmployee?.firstName}{" "}
              {selectedEmployee?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <DetailCard
              title={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
              subtitle={selectedEmployee.position}
              left={[
                {
                  label: t("employees.employee_id"),
                  value: selectedEmployee.employeeId,
                },
                {
                  label: t("employees.department"),
                  value: selectedEmployee.department,
                },
                {
                  label: t("admin.users.create.labels.work_location"),
                  value: getFilialName(selectedEmployee.filialId),
                },
                {
                  label: t("employees.hire_date"),
                  value: selectedEmployee.hireDate,
                },
                {
                  label: t("auth.email_address"),
                  value:
                    selectedEmployee.email ||
                    users.find(
                      (u) => u.id === (selectedEmployee as any).accountId,
                    )?.email ||
                    "",
                },
              ]}
              right={[
                {
                  label: t("clients.phone_number"),
                  value: selectedEmployee.phone,
                },
                {
                  label: t("employees.salary"),
                  value: `${selectedEmployee.salary.toLocaleString()}c`,
                },
                selectedEmployee.commission > 0
                  ? {
                      label: t("employees.commission"),
                      value: `${selectedEmployee.commission}%`,
                    }
                  : { label: "", value: "" },
                selectedEmployee.salesTarget
                  ? {
                      label: t("employees.monthly_sales_target"),
                      value: `${selectedEmployee.salesTarget.toLocaleString()}c`,
                    }
                  : { label: "", value: "" },
              ].filter((k) => k.label)}
              stats={[
                {
                  label: t("employees.role"),
                  value: getRoleBadge(selectedEmployee.role),
                },
                {
                  label: t("common.status"),
                  value: getStatusBadge(selectedEmployee.status),
                },
              ]}
            >
              <div>
                <div className="flex items-start gap-4 mb-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedEmployee.avatar} />
                    <AvatarFallback className="text-lg">
                      {getInitials(
                        selectedEmployee.firstName,
                        selectedEmployee.lastName,
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {t("employees.skills")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.skills.map((skill, index) => (
                        <Badge key={index} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-3 mb-1">
                      {t("common.notes")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedEmployee.notes || t("clients.no_notes")}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground border-t pt-3 mt-3">
                  <div>
                    📅 {t("employees.hire_date")}: {selectedEmployee.hireDate}
                  </div>
                  <div>
                    🔄 {t("common.updated")}: {selectedEmployee.updatedAt}
                  </div>
                </div>
              </div>
            </DetailCard>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("employees.edit_employee")}</DialogTitle>
            <DialogDescription>
              {t("employees.update_employee_info")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">{t("clients.phone_number")}</Label>
                <Input
                  id="edit-phone"
                  value={newEmployee.phone}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">{t("common.address")}</Label>
                <Input
                  id="edit-address"
                  value={newEmployee.address}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, address: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-position">{t("employees.position")}</Label>
                <Input
                  id="edit-position"
                  value={newEmployee.position}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, position: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">{t("common.status")}</Label>
                <Select
                  value={(newEmployee.status as string) || "active"}
                  onValueChange={(value) =>
                    setNewEmployee({ ...newEmployee, status: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("status.active")}</SelectItem>
                    <SelectItem value="inactive">
                      {t("status.inactive")}
                    </SelectItem>
                    <SelectItem value="on_leave">
                      {t("status.on_leave")}
                    </SelectItem>
                    <SelectItem value="terminated">
                      {t("status.terminated")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-salary">
                  {t("employees.annual_salary")}
                </Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={newEmployee.salary}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      salary: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-commission">
                  {t("employees.commission")} (%)
                </Label>
                <Input
                  id="edit-commission"
                  type="number"
                  value={newEmployee.commission}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      commission: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-salesTarget">
                {t("employees.monthly_sales_target")}
              </Label>
              <Input
                id="edit-salesTarget"
                type="number"
                value={newEmployee.salesTarget}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    salesTarget: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            {/* Skills section for edit */}
            <div className="space-y-2">
              <Label>{t("employees.skills")}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" onClick={addSkill} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newEmployee.skills && newEmployee.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newEmployee.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-2"
                        onClick={() => removeSkill(skill)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={newEmployee.notes}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, notes: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="flex-1">
                    {t("employees.update_employee")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("employees.confirm_update_title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("employees.confirm_update_desc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={updateEmployee}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                onClick={() => {
                  clearNewEmployee();
                  setIsEditEmployeeOpen(false);
                  setSelectedEmployee(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Employee Sales Dialog */}
      <Dialog open={isViewSalesOpen} onOpenChange={setIsViewSalesOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("employees.sales_details_title")}</DialogTitle>
            <DialogDescription>
              {t("employees.sales_history_for")}{" "}
              {selectedEmployeeSales?.firstName}{" "}
              {selectedEmployeeSales?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployeeSales && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">
                      Today's Sales
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      $
                      {getTotalSalesForEmployee(
                        selectedEmployeeSales.id,
                        selectedDate,
                      ).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">
                      Commission Earned
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      $
                      {getTotalCommissionForEmployee(
                        selectedEmployeeSales.id,
                        selectedDate,
                      ).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">
                      Transactions
                    </div>
                    <div className="text-2xl font-bold">
                      {
                        getDailySalesForEmployee(
                          selectedEmployeeSales.id,
                          selectedDate,
                        ).length
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySales
                    .filter(
                      (sale) => sale.employeeId === selectedEmployeeSales.id,
                    )
                    .map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.date}</TableCell>
                        <TableCell className="font-medium">
                          {sale.clientName}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          ${sale.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {sale.commission.toFixed(2)}c
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sale.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

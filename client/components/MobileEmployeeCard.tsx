// Import Employee type (assuming it's defined in Employees page)
interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  position?: string;
  role: string;
  status: "active" | "inactive" | "terminated" | "on_leave";
  salary: number;
  commission: number;
  hireDate: string;
  avatar?: string;
}
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  DollarSign,
  Calendar,
} from "lucide-react";

interface MobileEmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onView: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  onStatusChange: (employeeId: string, status: string) => void;
}

export default function MobileEmployeeCard({
  employee,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
}: MobileEmployeeCardProps) {
  const { t } = useTranslation();
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs">
            {t("status.active")}
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary" className="text-xs">
            {t("status.inactive")}
          </Badge>
        );
      case "terminated":
        return (
          <Badge variant="destructive" className="text-xs">
            {t("status.terminated")}
          </Badge>
        );
      case "on_leave":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
            {t("status.on_leave")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {t("common.unknown")}
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-800 text-xs">
            {t("roles.labels.admin")}
          </Badge>
        );
      case "manager":
        return (
          <Badge className="bg-blue-100 text-blue-800 text-xs">
            {t("roles.labels.manager")}
          </Badge>
        );
      case "worker":
        return (
          <Badge variant="outline" className="text-xs">
            {t("employees.employee_role")}
          </Badge>
        );
      case "intern":
        return (
          <Badge className="bg-orange-100 text-orange-800 text-xs">
            {t("employees.intern")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {t("common.unknown")}
          </Badge>
        );
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with avatar and basic info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={employee.avatar} />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {getInitials(employee.firstName, employee.lastName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">
                  {employee.firstName} {employee.lastName}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {employee.position || t("employees.no_position")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("employees.employee_id")}: {employee.employeeId}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(employee)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("common.view")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(employee)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(employee.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(employee.status)}
            {getRoleBadge(employee.role)}
            <Badge variant="outline" className="text-xs">
              {employee.department}
            </Badge>
          </div>

          {/* Contact info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{employee.email}</span>
            </div>

            {employee.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span>{employee.phone}</span>
              </div>
            )}
          </div>

          {/* Financial info for sales roles */}
          {employee.department === "Sales" && (
            <div className="flex justify-between text-sm pt-2 border-t">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-green-600" />
                <span className="text-xs">
                  {t("employees.salary")}: {employee.salary.toLocaleString()}c
                </span>
              </div>
              {employee.commission > 0 && (
                <div className="text-xs text-muted-foreground">
                  {employee.commission}% {t("employees.commission")}
                </div>
              )}
            </div>
          )}

          {/* Hire date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Calendar className="h-3 w-3" />
            <span>
              {t("employees.hire_date")}:{" "}
              {new Date(employee.hireDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

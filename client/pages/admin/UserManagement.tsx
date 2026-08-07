import { useState, useEffect } from "react";
import { useRBACStore } from "@/stores/rbacStore";
import { Role, RBACUser, ROLE_PERMISSIONS } from "@shared/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RoleBadge, { RoleSelector } from "@/components/ui/role-badge";
import PermissionDisplay from "@/components/ui/permission-display";
import UserCreateDialog from "@/components/UserCreateDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  Users,
  AlertCircle,
  Check,
  X,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { PaginationControls } from "@/components/ui/pagination";

export default function UserManagement() {
  const {
    users,
    isLoadingUsers,
    loadUsers,
    updateUserRole,
    updateUserStatus,
    currentUser,
    canManageUser,
    isHigherRole,
  } = useRBACStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<RBACUser | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  useEffect(() => {
    (async () => {
      const res = await loadUsers();
      if (!res.ok) {
        toast({
          title: t("admin.users.toast.error"),
          description: res.message || t("admin.users.toast.load_failed"),
          variant: "destructive",
        });
      }
    })();
  }, [loadUsers, toast]);

  const authUser = useAuthStore((s) => s.user);
  const scopedUsers =
    authUser?.role === "manager" && authUser?.filialId
      ? users.filter((u) => (u as any).filialId === authUser.filialId)
      : users;

  useEffect(() => {
    setUserPage(1);
  }, [searchQuery]);

  const filteredUsers = scopedUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const paginatedUsers = filteredUsers.slice((userPage - 1) * 10, userPage * 10);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const success = await updateUserRole(userId, newRole);
    if (success) {
      toast({
        title: t("admin.users.toast.role_updated_title"),
        description: t("admin.users.toast.role_updated_desc", {
          role: t(`roles.labels.${newRole}`) || newRole.replace("_", " "),
        }),
      });
      setIsRoleDialogOpen(false);
    } else {
      toast({
        title: t("admin.users.toast.error"),
        description: t("admin.users.toast.load_failed"),
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    userId: string,
    status: "active" | "inactive" | "suspended",
  ) => {
    const success = await updateUserStatus(userId, status);
    if (success) {
      toast({
        title: t("admin.users.toast.status_updated_title"),
        description: t("admin.users.toast.status_updated_desc", {
          status: t(`status.${status}`) || status,
        }),
      });
    } else {
      toast({
        title: t("admin.users.toast.error"),
        description: t("admin.users.toast.load_failed"),
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: RBACUser["status"]) => {
    switch (status) {
      case "active":
        return <Check className="h-4 w-4 text-green-600" />;
      case "inactive":
        return <X className="h-4 w-4 text-gray-600" />;
      case "suspended":
        return <Ban className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: RBACUser["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-700 hover:bg-green-200",
      inactive: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      suspended: "bg-red-100 text-red-700 hover:bg-red-200",
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1">{t(`status.${status}`)}</span>
      </Badge>
    );
  };

  const availableRoles: Role[] = currentUser
    ? ([
        "super_admin",
        "admin",
        "manager",
        "team_lead",
        "employee",
        "intern",
        "viewer",
      ].filter((role) => isHigherRole(role as Role)) as Role[])
    : [];

  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("admin.users.title")}</h1>
        <p className="text-muted-foreground">{t("admin.users.subtitle")}</p>
      </div>

      <div className="w-full">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
            <UserCreateDialog
              trigger={
                <Button className="w-full sm:w-auto flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {t("admin.users.create.add_user_btn")}
                </Button>
              }
              onUserCreated={async () => {
                const res = await loadUsers();
                if (!res.ok) {
                  toast({
                    title: t("admin.users.toast.error"),
                    description:
                      res.message || t("admin.users.toast.load_failed"),
                    variant: "destructive",
                  });
                }
              }}
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("admin.users.stats.total")}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("admin.users.stats.active")}
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {users.filter((u) => u.status === "active").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("admin.users.stats.admins")}
                </CardTitle>
                <Shield className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {
                    users.filter(
                      (u) => u.role === "admin" || u.role === "super_admin",
                    ).length
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("admin.users.stats.suspended")}
                </CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {users.filter((u) => u.status === "suspended").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.users.card.title")}</CardTitle>
              <CardDescription>
                {t("admin.users.card.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("admin.users.search_placeholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Users List/Table */}
              {isMobile ? (
                <div className="space-y-3">
                  {paginatedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="border rounded-lg p-3 bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {user.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                        <div>{getStatusBadge(user.status)}</div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <RoleBadge role={user.role} size="sm" />
                        {user.department ? (
                          <Badge variant="outline">{user.department}</Badge>
                        ) : null}
                        <div className="ml-auto">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                              >
                                <MoreHorizontal className="h-4 w-4" />{" "}
                                {t("admin.users.table.actions")}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                {t("admin.users.menu.actions")}
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  try {
                                    const el =
                                      document.activeElement as HTMLElement | null;
                                    el?.blur?.();
                                  } catch {}
                                  setTimeout(
                                    () => setIsPermissionDialogOpen(true),
                                    10,
                                  );
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />{" "}
                                {t("admin.users.menu.view_permissions")}
                              </DropdownMenuItem>
                              {canManageUser(user.id, user.role) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user);
                                      try {
                                        const el =
                                          document.activeElement as HTMLElement | null;
                                        el?.blur?.();
                                      } catch {}
                                      setTimeout(
                                        () => setIsRoleDialogOpen(true),
                                        10,
                                      );
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />{" "}
                                    {t("admin.users.menu.change_role")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {user.status === "active" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(
                                            user.id,
                                            "inactive",
                                          )
                                        }
                                      >
                                        <UserX className="mr-2 h-4 w-4" />{" "}
                                        {t("admin.users.menu.deactivate")}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(
                                            user.id,
                                            "suspended",
                                          )
                                        }
                                        className="text-red-600"
                                      >
                                        <Ban className="mr-2 h-4 w-4" />{" "}
                                        {t("admin.users.menu.suspend")}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {user.status !== "active" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(user.id, "active")
                                      }
                                      className="text-green-600"
                                    >
                                      <UserCheck className="mr-2 h-4 w-4" />{" "}
                                      {t("admin.users.menu.activate")}
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.users.table.user")}</TableHead>
                        <TableHead>{t("admin.users.table.role")}</TableHead>
                        <TableHead>
                          {t("admin.users.table.department")}
                        </TableHead>
                        <TableHead>{t("admin.users.table.status")}</TableHead>
                        <TableHead className="text-right">
                          {t("admin.users.table.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <RoleBadge role={user.role} size="sm" />
                          </TableCell>
                          <TableCell>
                            {user.department ? (
                              <Badge variant="outline">{user.department}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                  {t("admin.users.menu.actions")}
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    try {
                                      const el =
                                        document.activeElement as HTMLElement | null;
                                      el?.blur?.();
                                    } catch {}
                                    setTimeout(
                                      () => setIsPermissionDialogOpen(true),
                                      10,
                                    );
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t("admin.users.menu.view_permissions")}
                                </DropdownMenuItem>

                                {canManageUser(user.id, user.role) && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(user);
                                        try {
                                          const el =
                                            document.activeElement as HTMLElement | null;
                                          el?.blur?.();
                                        } catch {}
                                        setTimeout(
                                          () => setIsRoleDialogOpen(true),
                                          10,
                                        );
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      {t("admin.users.menu.change_role")}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />

                                    {user.status === "active" && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleStatusChange(
                                              user.id,
                                              "inactive",
                                            )
                                          }
                                        >
                                          <UserX className="mr-2 h-4 w-4" />
                                          {t("admin.users.menu.deactivate")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleStatusChange(
                                              user.id,
                                              "suspended",
                                            )
                                          }
                                          className="text-red-600"
                                        >
                                          <Ban className="mr-2 h-4 w-4" />
                                          {t("admin.users.menu.suspend")}
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {user.status !== "active" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(user.id, "active")
                                        }
                                        className="text-green-600"
                                      >
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        {t("admin.users.menu.activate")}
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <PaginationControls page={userPage} totalItems={filteredUsers.length} onPageChange={setUserPage} />
            </CardContent>
          </Card>

          {/* Role Change Dialog */}
          <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("admin.users.dialogs.change_role.title")}
                </DialogTitle>
                <DialogDescription>
                  {t("admin.users.dialogs.change_role.desc_prefix")}{" "}
                  {selectedUser?.name}.{" "}
                  {t("admin.users.dialogs.change_role.desc_suffix")}
                </DialogDescription>
              </DialogHeader>

              {selectedUser && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Avatar>
                      <AvatarImage src={selectedUser.avatar} />
                      <AvatarFallback>
                        {selectedUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedUser.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedUser.email}
                      </div>
                      <div className="mt-1">
                        <RoleBadge role={selectedUser.role} size="sm" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      {t("admin.users.dialogs.change_role.new_role")}
                    </label>
                    <div className="mt-2">
                      <RoleSelector
                        currentRole={selectedUser.role}
                        onRoleChange={(newRole) =>
                          handleRoleChange(selectedUser.id, newRole)
                        }
                        allowedRoles={availableRoles}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <strong>{t("admin.users.dialogs.warning.title")}</strong>{" "}
                      {t("admin.users.dialogs.warning.message")}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Permission View Dialog */}
          <Dialog
            open={isPermissionDialogOpen}
            onOpenChange={setIsPermissionDialogOpen}
          >
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {t("admin.users.dialogs.permissions.title")}
                </DialogTitle>
                <DialogDescription>
                  {t("admin.users.dialogs.permissions.desc_prefix")}{" "}
                  {selectedUser?.name}
                </DialogDescription>
              </DialogHeader>

              {selectedUser && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Avatar>
                      <AvatarImage src={selectedUser.avatar} />
                      <AvatarFallback>
                        {selectedUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedUser.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedUser.email}
                      </div>
                      <div className="mt-1">
                        <RoleBadge role={selectedUser.role} size="sm" />
                      </div>
                    </div>
                  </div>

                  <PermissionDisplay permissions={selectedUser.permissions} />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

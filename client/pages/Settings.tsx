import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import {
  Settings as SettingsIcon,
  Globe,
  Moon,
  Sun,
  Bell,
  Shield,
  Building,
  Save,
  Lock,
  Key,
  Check,
  Eye,
  EyeOff,
  Plus,
  Tag,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { API_BASE, joinApi } from "@/lib/api";

interface SystemSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  currency: string;
  timezone: string;
  language: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  lowStockAlerts: boolean;
  paymentReminders: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

interface CategoryForm {
  name: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore();
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    companyName: "StockMind Corp",
    companyEmail: "admin@businesspro.com",
    companyPhone: "+1 (555) 123-4567",
    currency: "USD",
    timezone: "America/New_York",
    language: "en",
  });

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      emailNotifications: true,
      lowStockAlerts: true,
      paymentReminders: true,
      systemUpdates: true,
      securityAlerts: true,
    });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: "",
    description: "",
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const saveSystemSettings = () => {
    toast({
      title: t("settings.settings_saved"),
      description: t("settings.settings_saved_desc"),
    });
  };

  const saveNotificationSettings = () => {
    toast({
      title: t("settings.notifications_updated"),
      description: t("settings.notifications_updated_desc"),
    });
  };

  const saveSecuritySettings = () => {
    toast({
      title: t("settings.security_updated"),
      description: t("settings.security_updated_desc"),
    });
  };

  const changePassword = () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast({
        title: t("settings.error"),
        description: t("settings.fill_all_fields"),
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: t("settings.error"),
        description: t("settings.passwords_not_match"),
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: t("settings.error"),
        description: t("settings.password_too_short"),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t("settings.password_changed"),
      description: t("settings.password_changed_desc"),
    });

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowChangePassword(false);
  };

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await fetch(joinApi("categories"), {
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      if (data.ok && Array.isArray(data.result)) {
        setCategories(data.result);
      }
    } catch (error: any) {
      toast({
        title: t("settings.error"),
        description: t("settings.failed_load_categories"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const addCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({
        title: t("settings.error"),
        description: t("settings.enter_category_name"),
        variant: "destructive",
      });
      return;
    }

    setIsAddingCategory(true);
    try {
      const method = editingCategoryId ? "PUT" : "POST";
      const url = editingCategoryId
        ? joinApi(`categories/${editingCategoryId}`)
        : joinApi("categories");

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save category");
      }

      const isUpdate = editingCategoryId;
      toast({
        title: t("common.success"),
        description: isUpdate
          ? t("settings.category_updated", { name: categoryForm.name })
          : t("settings.category_created", { name: categoryForm.name }),
      });

      setCategoryForm({
        name: "",
        description: "",
      });
      setEditingCategoryId(null);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: t("settings.error"),
        description: error.message || t("settings.failed_save_category"),
        variant: "destructive",
      });
    } finally {
      setIsAddingCategory(false);
    }
  };

  const editCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });
    setEditingCategoryId(category.id);
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(joinApi(`categories/${categoryId}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      toast({
        title: t("common.success"),
        description: t("settings.category_deleted"),
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: t("settings.error"),
        description: error.message || t("settings.failed_delete_category"),
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setCategoryForm({
      name: "",
      description: "",
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("settings.title", "Settings")}
          </h1>
          <p className="text-muted-foreground">
            {t("settings.subtitle", "Manage your application preferences")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">{t("settings.general")}</TabsTrigger>
          <TabsTrigger value="notifications">
            {t("settings.notifications")}
          </TabsTrigger>
          <TabsTrigger value="security">{t("settings.security")}</TabsTrigger>
          <TabsTrigger value="account">{t("settings.account")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {t("settings.company_information")}
                </CardTitle>
                <CardDescription>
                  {t("settings.basic_company_details")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    {t("settings.company_name")}
                  </Label>
                  <Input
                    id="companyName"
                    value={systemSettings.companyName}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        companyName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">
                    {t("settings.company_email")}
                  </Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={systemSettings.companyEmail}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        companyEmail: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">
                    {t("settings.company_phone")}
                  </Label>
                  <Input
                    id="companyPhone"
                    value={systemSettings.companyPhone}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        companyPhone: e.target.value,
                      })
                    }
                  />
                </div>
                <Button onClick={saveSystemSettings} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {t("settings.save_company_info")}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  {editingCategoryId
                    ? t("settings.edit_product_category")
                    : t("settings.add_product_category")}
                </CardTitle>
                <CardDescription>
                  {editingCategoryId
                    ? t("settings.update_category_details")
                    : t("settings.create_new_product_category")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">
                    {t("settings.category_name")}
                  </Label>
                  <Input
                    id="categoryName"
                    placeholder={t("settings.category_name_placeholder")}
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    disabled={isAddingCategory}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryDescription">
                    {t("settings.description")}
                  </Label>
                  <Textarea
                    id="categoryDescription"
                    placeholder={t("settings.category_description_placeholder")}
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        description: e.target.value,
                      })
                    }
                    disabled={isAddingCategory}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={addCategory}
                    className="flex-1"
                    disabled={isAddingCategory}
                  >
                    {editingCategoryId ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {isAddingCategory
                          ? t("settings.updating")
                          : t("settings.update_category")}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {isAddingCategory
                          ? t("settings.adding")
                          : t("settings.add_category")}
                      </>
                    )}
                  </Button>
                  {editingCategoryId && (
                    <Button
                      onClick={cancelEdit}
                      variant="outline"
                      disabled={isAddingCategory}
                    >
                      {t("settings.cancel")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.manage_categories")}</CardTitle>
                <CardDescription>
                  {t("settings.manage_categories_desc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCategories ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("settings.loading_categories")}
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("settings.no_categories")}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">
                            {category.name}
                          </h4>
                          {category.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {category.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editCategory(category)}
                            title={t("settings.edit_category")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                title={t("settings.delete_category")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertCircle className="h-5 w-5 text-destructive" />
                                  {t("settings.delete_category_title")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("settings.delete_category_desc", {
                                    name: category.name,
                                  })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-3 justify-end">
                                <AlertDialogCancel>
                                  {t("common.cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCategory(category.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t("common.delete")}
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t("settings.notification_settings")}
              </CardTitle>
              <CardDescription>
                {t("settings.choose_notifications")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.email_notifications")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.receive_via_email")}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.low_stock_alerts")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.low_stock_desc")}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.lowStockAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      lowStockAlerts: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.payment_reminders")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.payment_reminders_desc")}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.paymentReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      paymentReminders: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.system_updates")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.system_updates_desc")}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.systemUpdates}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      systemUpdates: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.security_alerts")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.security_alerts_desc")}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.securityAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      securityAlerts: checked,
                    })
                  }
                />
              </div>
              <Button onClick={saveNotificationSettings} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {t("settings.save_notifications")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t("settings.security_settings")}
                </CardTitle>
                <CardDescription>
                  {t("settings.security_settings_desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("settings.two_factor_auth")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.two_factor_auth_desc")}
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        twoFactorAuth: checked,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    {t("settings.session_timeout")}
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">
                    {t("settings.max_login_attempts")}
                  </Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: parseInt(e.target.value) || 5,
                      })
                    }
                  />
                </div>
                <Button onClick={saveSecuritySettings} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {t("settings.save_security")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {t("settings.change_password")}
                </CardTitle>
                <CardDescription>
                  {t("settings.change_password_desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("settings.password_requirements")}</Label>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {t("settings.min_6_chars")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {t("settings.one_uppercase")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {t("settings.one_number")}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t("settings.change_password_label")}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowChangePassword(!showChangePassword)}
                    >
                      {showChangePassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {showChangePassword && (
                    <div className="space-y-3">
                      <Input
                        type="password"
                        placeholder={t("settings.current_password")}
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="password"
                        placeholder={t("settings.new_password")}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="password"
                        placeholder={t("settings.confirm_new_password")}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                      <Button
                        onClick={changePassword}
                        className="w-full"
                        size="sm"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        {t("settings.change_password")}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("settings.account_information")}
              </CardTitle>
              <CardDescription>
                {t("settings.manage_account_details")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-lg">
                    {user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{user?.name}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.role.replace("_", " ")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">
                      {t("settings.user_id")}
                    </Label>
                    <p className="font-medium">{user?.id || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {t("settings.role")}
                    </Label>
                    <p className="font-medium capitalize">
                      {user?.role.replace("_", " ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {t("common.email")}
                    </Label>
                    <p className="font-medium">{user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {t("settings.status")}
                    </Label>
                    <p className="font-medium">{t("settings.active")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
      title: "Settings saved",
      description: "System settings have been updated successfully.",
    });
  };

  const saveNotificationSettings = () => {
    toast({
      title: "Notifications updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const saveSecuritySettings = () => {
    toast({
      title: "Security updated",
      description: "Security settings have been applied.",
    });
  };

  const changePassword = () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password changed",
      description: "Your password has been updated successfully.",
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
        title: "Error",
        description: "Failed to load categories.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const addCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCategory(true);
    try {
      const method = editingCategoryId ? "PUT" : "POST";
      const url = editingCategoryId
        ? `http://localhost:5002/api/categories/${editingCategoryId}`
        : "http://localhost:5002/api/categories";

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
        title: "Success",
        description: `Category "${categoryForm.name}" has been ${isUpdate ? "updated" : "added"} successfully.`,
      });

      setCategoryForm({
        name: "",
        description: "",
      });
      setEditingCategoryId(null);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to save category. Please try again.",
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
      const response = await fetch(
        `http://localhost:5002/api/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      toast({
        title: "Success",
        description: "Category has been deleted successfully.",
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to delete category. Please try again.",
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
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>Basic company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
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
                  <Label htmlFor="companyEmail">Company Email</Label>
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
                  <Label htmlFor="companyPhone">Phone</Label>
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
                  Save Company Info
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
                    ? "Edit Product Category"
                    : "Add Product Category"}
                </CardTitle>
                <CardDescription>
                  {editingCategoryId
                    ? "Update category details"
                    : "Create a new product category for your inventory"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name *</Label>
                  <Input
                    id="categoryName"
                    placeholder="e.g., Transport, Electronics, Clothing"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    disabled={isAddingCategory}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryDescription">Description</Label>
                  <Textarea
                    id="categoryDescription"
                    placeholder="e.g., This category is about transports"
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
                        {isAddingCategory ? "Updating..." : "Update Category"}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {isAddingCategory ? "Adding..." : "Add Category"}
                      </>
                    )}
                  </Button>
                  {editingCategoryId && (
                    <Button
                      onClick={cancelEdit}
                      variant="outline"
                      disabled={isAddingCategory}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manage Categories</CardTitle>
                <CardDescription>
                  View, edit, and delete existing product categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCategories ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading categories...
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No categories yet. Create one above.
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
                            title="Edit category"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                title="Delete category"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertCircle className="h-5 w-5 text-destructive" />
                                  Delete Category
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the category "
                                  {category.name}"? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-3 justify-end">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCategory(category.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
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
                Notification Settings
              </CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
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
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    When inventory falls below minimum levels
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
                  <Label>Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Overdue invoice and payment notifications
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
                  <Label>System Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Software updates and maintenance notices
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
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Failed login attempts and security events
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
                Save Notifications
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
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure login and access security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
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
                    Session Timeout (minutes)
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
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
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
                  Save Security
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Password Requirements</Label>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Minimum 6 characters
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      At least one uppercase letter
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      At least one number
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Change Password</Label>
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
                        placeholder="Current password"
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
                        placeholder="New password"
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
                        placeholder="Confirm new password"
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
                        Change Password
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
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and profile
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
                    <Label className="text-muted-foreground">User ID</Label>
                    <p className="font-medium">{user?.id || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Role</Label>
                    <p className="font-medium capitalize">
                      {user?.role.replace("_", " ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="font-medium">Active</p>
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

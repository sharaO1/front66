import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { API_BASE, setApiBase } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  EyeOff,
  Package,
  Loader2,
  Lock,
  Mail,
  Server,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isServerDialogOpen, setIsServerDialogOpen] = useState(false);
  const [serverAddress, setServerAddress] = useState(API_BASE);
  const { login, isLoading } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSaveServerAddress = () => {
    try {
      setApiBase(serverAddress);
      window.location.reload();
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          error instanceof Error
            ? error.message
            : "Enter a valid server address.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: t("common.error"),
        description: t("auth.sign_in_to_continue"),
        variant: "destructive",
      });
      return;
    }

    const success = await login(email, password);

    if (success) {
      toast({
        title: t("auth.welcome_back"),
        description: t("auth.login"),
      });
      navigate("/");
    } else {
      toast({
        title: t("common.error"),
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center gap-2 mb-8 animate-slide-in">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <Package className="h-6 w-6 text-white transition-transform group-hover:rotate-12 duration-300" />
          </div>
          <div className="text-center">
            <h1 className="font-bold text-3xl text-gray-900 hover:text-blue-700 transition-colors duration-300">
              StockMind
            </h1>
            <p className="text-sm text-gray-600">Management Suite</p>
          </div>
        </div>

        <div>
          {/* Login Form */}
          <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/80 hover:shadow-2xl transition-all duration-500 animate-slide-in group">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {t("auth.welcome_back")}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {t("auth.sign_in_to_continue")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t("auth.email_address")}
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-blue-600" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("auth.email_placeholder")}
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-10 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 hover:border-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t("auth.password")}
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-blue-600" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.password_placeholder")}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-10 pr-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 hover:border-gray-300"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent transition-all duration-200 hover:scale-110"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] font-medium text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="animate-pulse">
                        {t("auth.signing_in")}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{t("auth.sign_in")}</span>
                      <div className="ml-2 w-0 group-hover:w-4 overflow-hidden transition-all duration-300">
                        →
                      </div>
                    </>
                  )}
                </Button>
              </form>

              <Dialog
                open={isServerDialogOpen}
                onOpenChange={setIsServerDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-4 w-full text-sm text-gray-600"
                  >
                    <Server className="mr-2 h-4 w-4" />
                    Server connection
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Server connection</DialogTitle>
                    <DialogDescription>
                      Set the backend API address for this device.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="server-address">API address</Label>
                    <Input
                      id="server-address"
                      type="url"
                      value={serverAddress}
                      onChange={(event) => setServerAddress(event.target.value)}
                      placeholder="http://192.168.100.58:5002/api"
                    />
                  </div>
                  <Button type="button" onClick={handleSaveServerAddress}>
                    Save and reconnect
                  </Button>
                </DialogContent>
              </Dialog>

              <div className="mt-6">
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg hover:shadow-md transition-all duration-300">
                  <p className="text-sm text-amber-800">
                    <strong className="flex items-center gap-1">
                      🔒{" "}
                      <span>
                        {t("auth.secure_access_title", {
                          defaultValue: "Secure Access",
                        })}
                        :
                      </span>
                    </strong>
                    <span className="mt-1 block text-amber-700">
                      {t("auth.secure_access_message", {
                        defaultValue:
                          "User accounts are managed by administrators only. Contact your system administrator to request access.",
                      })}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

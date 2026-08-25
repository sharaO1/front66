import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as AppToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import Warehouse from "./pages/Warehouse";
import Filials from "./pages/Filials";
import Clients from "./pages/Clients";
import Sales from "./pages/Sales";
import Finance from "./pages/Finance";
import Employees from "./pages/Employees";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import NotFound from "./pages/NotFound";
import { useThemeStore } from "./stores/themeStore";
import { useLanguageStore } from "./stores/languageStore";
import { useAuthStore } from "./stores/authStore";
import { useRBACStore } from "./stores/rbacStore";
import { useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useToast } from "@/hooks/use-toast";
import {
  suppressDefaultPropsWarnings,
  suppressResizeObserverErrors,
} from "./lib/suppressWarnings";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import Chat from "./pages/Chat";

type AccessTokenPayload = { exp?: number };

const App = () => {
  const {
    theme,
    setTheme,
    setUserId: setThemeUserId,
    restoreForUser: restoreThemeForUser,
  } = useThemeStore();
  const {
    setUserId: setLanguageUserId,
    restoreForUser: restoreLanguageForUser,
  } = useLanguageStore();
  const { isAuthenticated, user, accessToken, logout } = useAuthStore();
  const { initializeFromAuth } = useRBACStore();
  const { toast } = useToast();
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) {
      initializeFromAuth(user);
      restoreThemeForUser(user.id);
      restoreLanguageForUser(user.id);
    } else {
      setThemeUserId(null);
      setLanguageUserId(null);
      setTheme(theme);
    }
    suppressDefaultPropsWarnings();
    suppressResizeObserverErrors();
  }, [
    user,
    theme,
    initializeFromAuth,
    setTheme,
    setThemeUserId,
    setLanguageUserId,
    restoreThemeForUser,
    restoreLanguageForUser,
  ]);

  useEffect(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    if (!isAuthenticated || !accessToken) return;

    let expMs = 0;
    try {
      const decoded = jwtDecode<AccessTokenPayload>(accessToken);
      if (decoded?.exp && typeof decoded.exp === "number") {
        expMs = decoded.exp * 1000;
      }
    } catch {
      expMs = 0;
    }

    const now = Date.now();
    if (!expMs || expMs <= now) {
      // Token already expired – try to refresh immediately
      (async () => {
        const { useAuthStore } = await import("./stores/authStore");
        const ok = await useAuthStore.getState().refreshTokens();
        if (!ok) {
          logout();
          toast({
            title: "Session expired",
            description: "Please sign in again.",
          });
        }
      })();
      return;
    }

    const delay = Math.max(0, expMs - now);
    expiryTimerRef.current = setTimeout(async () => {
      const { useAuthStore } = await import("./stores/authStore");
      const ok = await useAuthStore.getState().refreshTokens();
      if (!ok) {
        logout();
        toast({
          title: "Session expired",
          description: "Please sign in again.",
        });
      }
      // If refresh succeeds, the effect will rerun due to accessToken change and reschedule
    }, delay);

    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    };
  }, [isAuthenticated, accessToken, logout, toast]);

  return (
    <TooltipProvider>
      <AppToaster />
      <Sonner />
      <PWAInstallPrompt />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/auth/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />

          {/* Full-screen chat route (independent of dashboard layout) */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/forgot-password"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />
            }
          />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/warehouse" element={<Warehouse />} />
                    <Route
                      path="/filials"
                      element={
                        <RoleProtectedRoute
                          requiredRoles={["super_admin", "admin"]}
                        >
                          <Filials />
                        </RoleProtectedRoute>
                      }
                    />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />

                    {/* Admin-only routes */}
                    <Route
                      path="/admin/users"
                      element={
                        <RoleProtectedRoute
                          requiredRoles={["super_admin", "admin"]}
                          requiredPermission={{
                            resource: "users",
                            action: "read",
                          }}
                        >
                          <UserManagement />
                        </RoleProtectedRoute>
                      }
                    />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;

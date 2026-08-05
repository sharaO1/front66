import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role } from "@shared/rbac";
import { jwtDecode } from "jwt-decode";
import { API_BASE, joinApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string | null;
  department?: string | null;
  title?: string | null;
  phone?: string | null;
  location?: string | null;
  filialId?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  updateUserRole: (newRole: Role) => void;
  updateUserAvatar: (avatarUrl: string) => void;
  isTokenExpired: (token?: string | null) => boolean;
  refreshTokens: () => Promise<boolean>;
}

function mapBackendRole(role: string): Role {
  const normalized = role?.toLowerCase();
  switch (normalized) {
    case "super_admin":
    case "superadmin":
      return "super_admin";
    case "admin":
      return "admin";
    case "manager":
      return "manager";
    case "team_lead":
    case "teamlead":
      return "team_lead";
    case "employee":
    case "worker":
      return "employee";
    case "intern":
      return "intern";
    case "viewer":
    default:
      return "viewer";
  }
}

type AccessTokenPayload = {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });

          const res = await fetch(joinApi("/auth/sign-in"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const authData = await res.json();
          if (!res.ok || !authData?.ok || !authData?.result?.accessToken) {
            set({ isLoading: false });
            return false;
          }

          const accessToken: string = authData.result.accessToken;
          const refreshToken: string = authData.result.refreshToken ?? "";

          const decoded = jwtDecode<AccessTokenPayload>(accessToken);
          const userId = decoded?.id;
          const backendRole = decoded?.role ?? "";

          if (!userId) {
            set({ isLoading: false });
            return false;
          }

          const userRes = await fetch(joinApi(`/users/${userId}`), {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const userJson = await userRes.json();
          if (!userRes.ok || !userJson?.ok || !userJson?.result) {
            set({ isLoading: false });
            return false;
          }

          const u = userJson.result as any;
          const role: Role = mapBackendRole(u.role || backendRole);
          const user: User = {
            id: u.id,
            email: u.email,
            name:
              [u.firstName, u.lastName].filter(Boolean).join(" ") ||
              u.username ||
              u.email,
            role,
            avatar: u.avatar ?? null,
            department: u.department ?? null,
            title: null,
            phone: null,
            location: u.filialName ?? null,
            filialId:
              u.filialId ??
              u.filialID ??
              u.storeId ??
              u.branchId ??
              u.locationId ??
              null,
          };

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          const { useRBACStore } = await import("./rbacStore");
          useRBACStore.getState().initializeFromAuth(user);

          return true;
        } catch (error) {
          console.error("Login error:", error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
        });

        import("./rbacStore").then(({ useRBACStore }) => {
          useRBACStore.getState().reset();
        });
      },

      isTokenExpired: (token?: string | null) => {
        if (!token) return true;
        try {
          const decoded = jwtDecode<{ exp?: number }>(token);
          if (!decoded?.exp) return true;
          const expMs = decoded.exp * 1000;
          return Date.now() >= expMs;
        } catch {
          return true;
        }
      },

      refreshTokens: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) return false;

          const res = await fetch(joinApi("/auth/refresh"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
          });
          const json = await res.json().catch(() => null as any);
          if (!res.ok || !json?.ok || !json?.result?.accessToken) {
            return false;
          }

          const newAccess: string = json.result.accessToken;
          const newRefresh: string = json.result.refreshToken ?? refreshToken;

          set({ accessToken: newAccess, refreshToken: newRefresh, isAuthenticated: true });
          return true;
        } catch (e) {
          return false;
        }
      },

      updateUserRole: (newRole: Role) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, role: newRole };
          set({ user: updatedUser });

          import("./rbacStore").then(({ useRBACStore }) => {
            useRBACStore.getState().initializeFromAuth(updatedUser);
          });
        }
      },

      updateUserAvatar: (avatarUrl: string) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, avatar: avatarUrl || null };
          set({ user: updatedUser });
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        set({ isLoading: false });
        return true;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

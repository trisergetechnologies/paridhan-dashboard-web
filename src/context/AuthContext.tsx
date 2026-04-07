"use client";

import { apiFetch } from "@/lib/api/client";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/api/sessionTokens";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export type DashboardRole = "admin" | "seller";

export interface DashboardUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  roles: string[];
  activeRole?: string;
  phone?: string;
  avatar?: string;
  isBlocked?: boolean;
  isDeleted?: boolean;
}

interface AuthContextType {
  user: DashboardUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isPlatformAdmin: boolean;
  isSeller: boolean;
  loginWithPassword: (
    email: string,
    password: string,
    requestedRole: DashboardRole,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(raw: Record<string, unknown>): DashboardUser {
  const id = raw._id ?? raw.id;
  return {
    _id: String(id),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    role: String(raw.role ?? ""),
    roles: Array.isArray(raw.roles) ? (raw.roles as string[]) : [String(raw.role ?? "")],
    activeRole: raw.activeRole != null ? String(raw.activeRole) : undefined,
    phone: raw.phone != null ? String(raw.phone) : undefined,
    avatar: raw.avatar != null ? String(raw.avatar) : undefined,
    isBlocked: Boolean(raw.isBlocked),
    isDeleted: Boolean(raw.isDeleted),
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const activeRole = user?.activeRole || user?.role || "";
  const isPlatformAdmin = activeRole === "admin";
  const isSeller = activeRole === "seller";

  const refreshProfile = useCallback(async () => {
    const res = await apiFetch("/user/me", { method: "GET" });
    if (!res.ok) {
      throw new Error("Profile fetch failed");
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || "Profile fetch failed");
    }
    setUser(normalizeUser(json.data));
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!getAccessToken() && !getRefreshToken()) {
        setIsAuthLoading(false);
        return;
      }
      try {
        await refreshProfile();
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };
    void init();
  }, [refreshProfile]);

  const loginWithPassword = async (
    email: string,
    password: string,
    requestedRole: DashboardRole,
  ) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Paridhan-Client": "dashboard",
      },
      body: JSON.stringify({ email, password, requestedRole }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Login failed");
    }
    const accessToken = json.data?.accessToken;
    const refreshToken = json.data?.refreshToken;
    if (!accessToken || !refreshToken) {
      throw new Error("Server did not return tokens. Ensure X-Paridhan-Client: dashboard is sent.");
    }
    setTokens(accessToken, refreshToken);
    await refreshProfile();
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" }, false);
    } catch {
      /* ignore */
    }
    clearTokens();
    setUser(null);
    window.location.href = "/auth";
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    isAuthLoading,
    isPlatformAdmin,
    isSeller,
    loginWithPassword,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

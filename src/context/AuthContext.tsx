"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface UserSessionData {
  id: string;
  userId: string;
  email: string;
  emailVerified: boolean;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: UserSessionData | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshSession: async () => {},
  logout: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/session");
      const data = await res.json();
      if (data.authenticated && data.session) {
        setUser(data.session);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    if (user.roles.includes("ADMIN")) return true;
    return user.roles.includes(role);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.roles.includes("ADMIN")) return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshSession,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

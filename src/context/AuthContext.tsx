import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";

export type UserRole = "admin" | "subadmin" | "reporting_authority" | "dealer" | "dealer_member" | "manager" | "sales" | "campaign_master";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: "active" | "disabled";
  cell?: string;
  location?: string;
  permissions?: { showMCA?: boolean; transferLeads?: boolean };
}

interface AuthContextType {
  currentUser: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (id: string, updates: Partial<AppUser>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = "lms_session_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (stored) setCurrentUser(JSON.parse(stored));
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("/login", { email, password });
      if (res.success && res.data?.user) {
        const u = res.data.user;
        const user: AppUser = {
          id: String(u.id),
          name: u.name || email,
          email: u.email || email,
          role: String(u.role || "sales").toLowerCase().replace(/\s+/g, "_") as UserRole,
          avatar: String(u.name || "U").slice(0, 2).toUpperCase(),
          status: u.status === "disabled" ? "disabled" : "active",
          cell: u.cell || "",
          location: u.location || u.managedArea || "",
          permissions: u.permissions,
        };
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
        if (res.data.token) await AsyncStorage.setItem("lms_token", res.data.token);
        setCurrentUser(user);
        return { success: true };
      }
      return { success: false, error: res.message || "Invalid credentials" };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    await AsyncStorage.multiRemove([SESSION_KEY, "lms_token"]);
    api.post("/logout", {}).catch(() => {});
  };

  const updateUser = async (id: string, updates: Partial<AppUser>) => {
    try {
      // Persist locally first — backend profile tables (dealers/managers) require
      // role-specific endpoints we don't have, so local cache is the source of truth here.
      const merged: AppUser = { ...(currentUser as AppUser), ...updates };
      merged.avatar = String(merged.name || "U").slice(0, 2).toUpperCase();
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(merged));
      setCurrentUser(merged);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to update profile" };
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

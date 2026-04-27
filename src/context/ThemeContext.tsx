import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const DARK = {
  mode: "dark" as const,
  bg: "#0f172a",
  bg2: "#1e293b",
  bg3: "#334155",
  card: "#1e293b",
  cardBorder: "#334155",
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  primary: "#6366f1",
  primaryBg: "#6366f122",
  danger: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6",
  tabBar: "#1e293b",
  tabBorder: "#334155",
  header: "#0f172a",
  drawer: "#1e293b",
  inputBg: "#0f172a",
  inputBorder: "#334155",
  shadow: "rgba(0,0,0,0.4)",
};

export const LIGHT = {
  mode: "light" as const,
  bg: "#f1f5f9",
  bg2: "#ffffff",
  bg3: "#e2e8f0",
  card: "#ffffff",
  cardBorder: "#e2e8f0",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  primary: "#6366f1",
  primaryBg: "#6366f115",
  danger: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6",
  tabBar: "#ffffff",
  tabBorder: "#e2e8f0",
  header: "#ffffff",
  drawer: "#ffffff",
  inputBg: "#f8fafc",
  inputBorder: "#e2e8f0",
  shadow: "rgba(0,0,0,0.08)",
};

export type Theme = typeof DARK | typeof LIGHT;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("lms_theme").then(v => {
      if (v === "light") setIsDark(false);
    });
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem("lms_theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme: isDark ? DARK : LIGHT, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}

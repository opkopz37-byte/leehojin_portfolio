"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
type Resolved = "light" | "dark";

const Ctx = createContext<{
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
}>({ theme: "system", resolved: "dark", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<Resolved>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("portfolio.theme") as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setResolved(isDark ? "dark" : "light");
    } else {
      root.setAttribute("data-theme", theme);
      setResolved(theme);
    }
    localStorage.setItem("portfolio.theme", theme);
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, resolved, setTheme: setThemeState }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);

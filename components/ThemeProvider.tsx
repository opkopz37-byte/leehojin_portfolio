"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

type Theme = "system" | "light" | "dark";
type Resolved = "light" | "dark";

const Ctx = createContext<{
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
}>({ theme: "system", resolved: "dark", setTheme: () => {} });

function applyTheme(t: Theme): Resolved {
  const root = document.documentElement;
  if (t === "system") {
    root.removeAttribute("data-theme");
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  root.setAttribute("data-theme", t);
  return t;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<Resolved>("dark");
  const userChanged = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("portfolio.theme") as Theme | null;
    const t: Theme = (stored === "light" || stored === "dark" || stored === "system") ? stored : "system";
    setResolved(applyTheme(t));
    setThemeState(t);
  }, []);

  useEffect(() => {
    if (!userChanged.current) return;
    setResolved(applyTheme(theme));
    localStorage.setItem("portfolio.theme", theme);
    userChanged.current = false;
  }, [theme]);

  function setTheme(t: Theme) {
    userChanged.current = true;
    setThemeState(t);
  }

  return (
    <Ctx.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);

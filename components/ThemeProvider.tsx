"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

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

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem("portfolio.theme");
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<Resolved>("dark");

  // Init from storage and apply to <html> on mount.
  useEffect(() => {
    const t = readStoredTheme();
    setThemeState(t);
    setResolved(applyTheme(t));
  }, []);

  // React to OS theme changes when in "system" mode.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(applyTheme("system"));
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange); // older Safari fallback
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    setResolved(applyTheme(t));
    try {
      localStorage.setItem("portfolio.theme", t);
    } catch {
      /* private mode / quota — ignore */
    }
  }, []);

  return (
    <Ctx.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);

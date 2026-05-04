"use client";

import { useEffect, useState, type ReactNode } from "react";
import { loadConfigValue, saveConfigValue } from "@/lib/configStorage";

export default function CollapsibleSection({
  number,
  title,
  storageKey,
  trailing,
  children,
  defaultOpen = false,
}: {
  number: string;
  title: string;
  storageKey: string;
  trailing?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(!defaultOpen);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(loadConfigValue<boolean>(storageKey, !defaultOpen));
    setHydrated(true);
  }, [storageKey, defaultOpen]);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    saveConfigValue(storageKey, next);
  }

  if (!hydrated) return null;

  return (
    <section className="border-t border-border px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            className="flex items-baseline gap-3 sm:gap-5 group flex-1 text-left min-w-0"
          >
            <span className="font-mono text-sm sm:text-base text-accent tracking-[0.18em] shrink-0">
              {number}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight transition-transform duration-200 origin-left group-hover:scale-[1.04] truncate">
              {title}
            </h2>
            <span
              className="font-mono text-base sm:text-lg text-muted group-hover:text-foreground transition shrink-0"
              style={{
                transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
                transition: "transform 200ms",
                display: "inline-block",
              }}
            >
              ▸
            </span>
            <span className="font-mono text-xs text-muted shrink-0 hidden sm:inline">
              {collapsed ? "펼치기" : "접기"}
            </span>
          </button>
          {trailing && <div className="shrink-0">{trailing}</div>}
        </div>
        {!collapsed && <div className="mt-8 sm:mt-12">{children}</div>}
      </div>
    </section>
  );
}

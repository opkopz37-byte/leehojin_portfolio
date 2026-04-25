"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/config";
import { getMergedConfig, setOverride } from "@/lib/siteOverrides";
import { useAdmin } from "@/hooks/useAdmin";
import InlineEdit from "@/components/InlineEdit";

export default function Footer() {
  const year = new Date().getFullYear();
  const [cfg, setCfg] = useState(siteConfig);
  const admin = useAdmin();

  useEffect(() => {
    setCfg(getMergedConfig());
    const update = () => setCfg(getMergedConfig());
    window.addEventListener("site-overrides-changed", update);
    return () => window.removeEventListener("site-overrides-changed", update);
  }, []);

  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="font-mono text-xs text-muted">
          © {year}{" "}
          {admin ? (
            <InlineEdit value={cfg.name} onSave={(v) => setOverride("name", v)} />
          ) : (
            cfg.name
          )}
          .{" "}
          {admin ? (
            <InlineEdit value={cfg.footerNote} onSave={(v) => setOverride("footerNote", v)} />
          ) : (
            cfg.footerNote
          )}
        </p>
        <p className="font-mono text-xs text-muted">
          {admin ? (
            <InlineEdit value={cfg.email} onSave={(v) => setOverride("email", v)} />
          ) : (
            <a href={`mailto:${cfg.email}`} className="hover:text-foreground transition">
              {cfg.email}
            </a>
          )}
        </p>
      </div>
    </footer>
  );
}

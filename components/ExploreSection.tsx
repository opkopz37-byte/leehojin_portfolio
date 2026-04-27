"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import InlineEdit from "@/components/InlineEdit";
import { useAdmin } from "@/hooks/useAdmin";
import { categories, type Category } from "@/lib/categories";
import { loadConfigValue, saveConfigValue } from "@/lib/configStorage";

type Override = { title?: string; blurb?: string };

function storageKey(slug: string) {
  return `portfolio.explore.${slug}`;
}

function loadOverrides(): Record<string, Override> {
  const out: Record<string, Override> = {};
  for (const c of categories) {
    const val = loadConfigValue<Override>(storageKey(c.slug), {});
    if (Object.keys(val).length > 0) out[c.slug] = val;
  }
  return out;
}

function saveOverride(slug: string, field: "title" | "blurb", value: string) {
  const key = storageKey(slug);
  const current = loadConfigValue<Override>(key, {});
  saveConfigValue(key, { ...current, [field]: value });
}

const HEADING_KEY = "portfolio.explore.heading";

export default function ExploreSection() {
  const admin = useAdmin();
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [heading, setHeading] = useState("Explore");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOverrides(loadOverrides());
    const h = loadConfigValue<string>(HEADING_KEY, "Explore");
    setHeading(h);
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  function get(c: Category, field: "title" | "blurb"): string {
    return overrides[c.slug]?.[field] ?? c[field];
  }

  function update(c: Category, field: "title" | "blurb") {
    return (val: string) => {
      saveOverride(c.slug, field, val);
      setOverrides((prev) => ({
        ...prev,
        [c.slug]: { ...prev[c.slug], [field]: val },
      }));
    };
  }

  return (
    <section id="explore" className="border-t border-border px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-baseline gap-4 mb-12">
          <span className="font-mono text-sm text-accent">↳</span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {admin ? (
              <InlineEdit
                value={heading}
                onSave={(v) => {
                  saveConfigValue(HEADING_KEY, v);
                  setHeading(v);
                }}
              />
            ) : (
              heading
            )}
          </h2>
        </div>

        <ul className="grid gap-3 sm:gap-4 grid-cols-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={c.href}
                className="group flex h-full flex-col justify-between gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-border bg-card p-4 sm:p-8 hover:border-foreground transition"
              >
                <div>
                  <p className="font-mono text-xs text-accent mb-3">
                    {c.number} · {c.label}
                  </p>
                  <h3 className="text-sm sm:text-xl font-semibold tracking-tight">
                    {admin ? (
                      <InlineEdit value={get(c, "title")} onSave={update(c, "title")} />
                    ) : (
                      get(c, "title")
                    )}
                  </h3>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-muted hidden sm:block">
                    {admin ? (
                      <InlineEdit value={get(c, "blurb")} onSave={update(c, "blurb")} multiline />
                    ) : (
                      get(c, "blurb")
                    )}
                  </p>
                </div>
                <span className="font-mono text-[10px] sm:text-xs text-muted group-hover:text-foreground transition">
                  Open {c.label} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

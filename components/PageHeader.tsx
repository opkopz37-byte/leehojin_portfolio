"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import InlineEdit from "@/components/InlineEdit";
import { useAdmin } from "@/hooks/useAdmin";

function storageKey(label: string) {
  return `portfolio.header.${label.toLowerCase()}`;
}

function loadOverrides(label: string, defaults: { title: string; description: string }) {
  try {
    const raw = localStorage.getItem(storageKey(label));
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export default function PageHeader({
  number,
  label,
  title: defaultTitle,
  description: defaultDescription,
}: {
  number: string;
  label: string;
  title: string;
  description?: string;
}) {
  const admin = useAdmin();
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription ?? "");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadOverrides(label, { title: defaultTitle, description: defaultDescription ?? "" });
    setTitle(saved.title);
    setDescription(saved.description);
    setHydrated(true);
  }, [label, defaultTitle, defaultDescription]);

  function save(field: "title" | "description", value: string) {
    const key = storageKey(label);
    try {
      const current = JSON.parse(localStorage.getItem(key) ?? "{}");
      localStorage.setItem(key, JSON.stringify({ ...current, [field]: value }));
    } catch {}
    if (field === "title") setTitle(value);
    else setDescription(value);
  }

  if (!hydrated) return null;

  return (
    <header className="px-6 pt-32 pb-12 sm:pt-40 sm:pb-16">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-block font-mono text-xs text-muted hover:text-foreground transition mb-8"
        >
          ← Back home
        </Link>
        <p className="font-mono text-sm text-accent mb-3">
          {number} · {label}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          {admin
            ? <InlineEdit value={title} onSave={(v) => save("title", v)} />
            : title}
        </h1>
        {(description || admin) && (
          <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted">
            {admin
              ? <InlineEdit value={description} onSave={(v) => save("description", v)} multiline />
              : description}
          </p>
        )}
      </div>
    </header>
  );
}

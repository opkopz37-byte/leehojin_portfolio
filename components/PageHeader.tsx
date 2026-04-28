"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import InlineEdit from "@/components/InlineEdit";
import { useAdmin } from "@/hooks/useAdmin";
import { loadConfigValue, saveConfigValue } from "@/lib/configStorage";

function storageKey(label: string) {
  return `portfolio.header.${label.toLowerCase()}`;
}

function loadOverrides(label: string, defaults: { title: string; description: string }) {
  return loadConfigValue(storageKey(label), defaults);
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
    const current = loadConfigValue<{ title?: string; description?: string }>(key, {});
    saveConfigValue(key, { ...current, [field]: value });
    if (field === "title") setTitle(value);
    else setDescription(value);
  }

  if (!hydrated) return null;

  return (
    <header className="px-4 sm:px-6 pt-28 pb-8 sm:pt-40 sm:pb-16">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-block font-mono text-xs text-muted hover:text-foreground transition mb-6 sm:mb-8"
        >
          ← Back home
        </Link>
        <p className="font-mono text-xs sm:text-sm text-accent mb-2 sm:mb-3">
          {number} · {label}
        </p>
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
          {admin
            ? <InlineEdit value={title} onSave={(v) => save("title", v)} />
            : title}
        </h1>
        {(description || admin) && (
          <p className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-lg leading-relaxed text-muted">
            {admin
              ? <InlineEdit value={description} onSave={(v) => save("description", v)} multiline />
              : description}
          </p>
        )}
      </div>
    </header>
  );
}

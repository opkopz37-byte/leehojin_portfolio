"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import InlineEdit from "@/components/InlineEdit";
import { siteConfig } from "@/lib/config";
import { getMergedConfig } from "@/lib/siteOverrides";
import { useAdmin } from "@/hooks/useAdmin";

type Channel = { id: string; label: string; value: string; href: string };

const CHANNELS_KEY = "portfolio.contact.channels";

function hrefFromValue(value: string): string {
  const v = value.trim();
  if (v.includes("@") && !v.startsWith("http")) return `mailto:${v}`;
  if (v.startsWith("http")) return v;
  if (v.startsWith("linkedin.com") || v.startsWith("github.com") ||
      v.startsWith("artstation.com") || v.startsWith("twitter.com") || v.startsWith("x.com")) {
    return `https://${v}`;
  }
  return v;
}

function buildDefaults(cfg: typeof siteConfig): Channel[] {
  const ch: Channel[] = [
    { id: "email", label: "Email", value: cfg.email, href: `mailto:${cfg.email}` },
  ];
  if (cfg.github) ch.push({ id: "github", label: "GitHub", value: cfg.github.replace("https://", ""), href: cfg.github });
  if (cfg.linkedin) ch.push({ id: "linkedin", label: "LinkedIn", value: cfg.linkedin.replace("https://", ""), href: cfg.linkedin });
  if (cfg.artstation) ch.push({ id: "artstation", label: "ArtStation", value: cfg.artstation.replace("https://", ""), href: cfg.artstation });
  if (cfg.twitter) ch.push({ id: "twitter", label: "Twitter / X", value: cfg.twitter.replace("https://", ""), href: cfg.twitter });
  return ch;
}

function loadChannels(cfg: typeof siteConfig): Channel[] {
  try {
    const stored = localStorage.getItem(CHANNELS_KEY);
    return stored ? JSON.parse(stored) : buildDefaults(cfg);
  } catch { return buildDefaults(cfg); }
}

function saveChannels(channels: Channel[]) {
  localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
}

export default function ContactPage() {
  const admin = useAdmin();
  const [cfg, setCfg] = useState(siteConfig);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const merged = getMergedConfig();
    setCfg(merged);
    const defaults = buildDefaults(merged);
    let next: Channel[] = defaults;
    try {
      const stored = localStorage.getItem(CHANNELS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          next = parsed;
        }
      }
    } catch {}
    setChannels(next);
    setHydrated(true);

    const update = () => setCfg(getMergedConfig());
    window.addEventListener("site-overrides-changed", update);
    return () => window.removeEventListener("site-overrides-changed", update);
  }, []);

  if (!hydrated) return null;

  function updateChannel(id: string, field: keyof Channel, value: string) {
    const next = channels.map((c) => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      if (field === "value") updated.href = hrefFromValue(value);
      return updated;
    });
    setChannels(next);
    saveChannels(next);
  }

  function deleteChannel(id: string) {
    const next = channels.filter((c) => c.id !== id);
    setChannels(next);
    saveChannels(next);
  }

  function addChannel() {
    const next: Channel[] = [
      ...channels,
      { id: `custom-${Date.now()}`, label: "New Channel", value: "", href: "" },
    ];
    setChannels(next);
    saveChannels(next);
  }

  return (
    <>
      <PageHeader number="04" label="Contact" title="Get in touch" description="새로운 협업이나 R&D 기회에 항상 열려 있습니다." />

      <section className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          {admin && (
            <p className="font-mono text-[11px] text-accent/70 mb-4">
              ✎ 항목을 클릭해 수정 · + 버튼으로 항목 추가 · × 버튼으로 삭제
            </p>
          )}
          <ul className="grid gap-3 sm:grid-cols-2">
            {channels.map((c) => (
              <li key={c.id} className="relative group/channel">
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 hover:border-foreground transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      {admin ? (
                        <InlineEdit
                          value={c.label}
                          onSave={(v) => updateChannel(c.id, "label", v)}
                        />
                      ) : c.label}
                    </p>
                    <p className="mt-1 text-sm font-medium truncate">
                      {admin ? (
                        <InlineEdit
                          value={c.value}
                          onSave={(v) => updateChannel(c.id, "value", v)}
                        />
                      ) : c.value}
                    </p>
                  </div>
                  {!admin && c.href && (
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="ml-3 text-muted hover:text-foreground transition shrink-0"
                    >
                      →
                    </a>
                  )}
                  {admin && (
                    <button
                      type="button"
                      onClick={() => deleteChannel(c.id)}
                      className="ml-3 shrink-0 opacity-0 group-hover/channel:opacity-100 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center text-xs text-muted hover:text-foreground hover:border-foreground transition"
                      aria-label="delete"
                    >
                      ×
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {admin && (
            <button
              type="button"
              onClick={addChannel}
              className="mt-4 font-mono text-xs text-accent border border-dashed border-accent/30 rounded-full px-4 py-1.5 hover:bg-accent/10 transition"
            >
              + Add Channel
            </button>
          )}
        </div>
      </section>
    </>
  );
}

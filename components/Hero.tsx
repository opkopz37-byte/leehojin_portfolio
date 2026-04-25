"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/config";
import { getMergedConfig, setOverride } from "@/lib/siteOverrides";
import { useAdmin } from "@/hooks/useAdmin";
import InlineEdit from "@/components/InlineEdit";

const slideImages = projects
  .map((p) => ({ src: p.coverImage, title: p.title }))
  .filter((p): p is { src: string; title: string } => Boolean(p.src));

export default function Hero() {
  const [idx, setIdx] = useState(0);
  const [cfg, setCfg] = useState(siteConfig);
  const admin = useAdmin();

  useEffect(() => {
    setCfg(getMergedConfig());
    const update = () => setCfg(getMergedConfig());
    window.addEventListener("site-overrides-changed", update);
    return () => window.removeEventListener("site-overrides-changed", update);
  }, []);

  useEffect(() => {
    if (slideImages.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slideImages.length), 5000);
    return () => clearInterval(t);
  }, []);

  const hasSlides = slideImages.length > 0;

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center px-6 pt-20 pb-16 overflow-hidden"
    >
      {hasSlides ? (
        <div className="absolute inset-0">
          {slideImages.map(({ src, title }, i) => (
            <img
              key={src}
              src={src}
              alt={title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                i === idx ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-background to-background" />
      )}

      <div className="relative mx-auto w-full max-w-5xl">
        <p className="font-mono text-sm text-accent mb-4">Hello, I&apos;m</p>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-semibold tracking-tight leading-[0.95]">
          {admin ? (
            <InlineEdit
              value={cfg.name}
              onSave={(v) => setOverride("name", v)}
            />
          ) : (
            cfg.name
          )}
        </h1>

        <h2 className="mt-4 text-xl sm:text-2xl md:text-3xl font-semibold text-muted tracking-tight">
          {admin ? (
            <InlineEdit
              value={cfg.title}
              onSave={(v) => setOverride("title", v)}
            />
          ) : (
            cfg.title
          )}
        </h2>

        <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted">
          {admin ? (
            <InlineEdit
              value={cfg.bio}
              onSave={(v) => setOverride("bio", v)}
              multiline
            />
          ) : (
            cfg.bio
          )}
        </p>

        {admin && (
          <p className="mt-3 font-mono text-[10px] text-accent/60">
            ✎ 텍스트를 클릭하면 바로 수정 가능 — localStorage에 저장됩니다
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition"
          >
            View Work →
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-foreground transition"
          >
            Get in touch
          </Link>
        </div>
      </div>

      {slideImages.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
          {slideImages.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-300 ${
                i === idx ? "w-5 h-1.5 bg-foreground" : "w-1.5 h-1.5 bg-foreground/30"
              }`}
            />
          ))}
        </div>
      )}

      <a
        href="#explore"
        aria-label="Scroll down"
        className="absolute bottom-6 right-6 font-mono text-xs text-muted hover:text-foreground transition"
      >
        ↓ explore
      </a>
    </section>
  );
}

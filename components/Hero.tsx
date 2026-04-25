"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/config";

const slideImages = projects
  .map((p) => ({ src: p.coverImage, title: p.title }))
  .filter((p): p is { src: string; title: string } => Boolean(p.src));

export default function Hero() {
  const [idx, setIdx] = useState(0);
  const hasSlides = slideImages.length > 0;

  useEffect(() => {
    if (slideImages.length < 2) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % slideImages.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-end px-6 pt-24 pb-28 overflow-hidden"
    >
      {/* Background */}
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
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-background/10" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-background to-background" />
      )}

      {/* Content */}
      <div className="relative mx-auto w-full max-w-5xl">
        <p className="font-mono text-sm text-accent mb-4">Hello, I&apos;m</p>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-semibold tracking-tight leading-[0.95]">
          {siteConfig.name}
        </h1>
        <h2 className="mt-4 text-xl sm:text-2xl md:text-3xl font-semibold text-muted tracking-tight">
          {siteConfig.title}
        </h2>
        <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted">
          {siteConfig.bio}
        </p>

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

      {/* Slide dots */}
      {slideImages.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
          {slideImages.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-300 ${
                i === idx
                  ? "w-5 h-1.5 bg-foreground"
                  : "w-1.5 h-1.5 bg-foreground/30 hover:bg-foreground/60"
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { categories } from "@/lib/categories";
import { siteConfig } from "@/lib/config";

const links = [
  { href: "/", label: "Home" },
  ...categories.map((c) => ({ href: c.href, label: c.label })),
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-mono text-sm tracking-tight">
          <span className="text-accent">/</span>
          {siteConfig.name.toLowerCase().replace(/\s+/g, "-")}
        </Link>

        <ul className="hidden gap-7 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`text-sm transition-colors ${
                  isActive(l.href)
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-md hover:bg-foreground/5 transition"
          style={{ touchAction: "manipulation" }}
        >
          <span className="relative block w-6 h-4">
            <span
              className={`absolute left-0 right-0 h-0.5 bg-foreground transition-all duration-200 ${
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-foreground transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 right-0 h-0.5 bg-foreground transition-all duration-200 ${
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
              }`}
            />
          </span>
        </button>
      </nav>

      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-200 ease-out border-t border-border bg-background ${
          open ? "max-h-96" : "max-h-0 border-t-transparent"
        }`}
      >
        <ul className="px-6 py-4 space-y-1">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-2 py-3 text-base ${
                  isActive(l.href)
                    ? "text-foreground bg-foreground/5"
                    : "text-muted hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

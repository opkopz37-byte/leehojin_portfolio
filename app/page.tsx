import Link from "next/link";
import Hero from "@/components/Hero";
import { categories } from "@/lib/categories";

export default function Page() {
  return (
    <>
      <Hero />

      <section
        id="explore"
        className="border-t border-border px-6 py-24 sm:py-32"
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex items-baseline gap-4 mb-12">
            <span className="font-mono text-sm text-accent">↳</span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Explore
            </h2>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={c.href}
                  className="group flex h-full flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-8 hover:border-foreground transition"
                >
                  <div>
                    <p className="font-mono text-xs text-accent mb-3">
                      {c.number} · {c.label}
                    </p>
                    <h3 className="text-xl font-semibold tracking-tight">
                      {c.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {c.blurb}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-muted group-hover:text-foreground transition">
                    Open {c.label} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

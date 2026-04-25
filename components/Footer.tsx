import { siteConfig } from "@/lib/config";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="font-mono text-xs text-muted">
          © {year} {siteConfig.name}. Built with Next.js.
        </p>
        <a
          href={`mailto:${siteConfig.email}`}
          className="font-mono text-xs text-muted hover:text-foreground transition"
        >
          {siteConfig.email}
        </a>
      </div>
    </footer>
  );
}

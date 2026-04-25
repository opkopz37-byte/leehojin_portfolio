import Link from "next/link";

export default function PageHeader({
  number,
  label,
  title,
  description,
}: {
  number: string;
  label: string;
  title: string;
  description?: string;
}) {
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
          {title}
        </h1>
        {description && (
          <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
    </header>
  );
}

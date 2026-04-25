import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Contact — ${siteConfig.name}`,
  description: "협업, R&D, 컨설팅 문의를 받습니다.",
};

function makeChannels() {
  const ch = [
    { label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
  ];
  if (siteConfig.github)
    ch.push({ label: "GitHub", value: siteConfig.github.replace("https://", ""), href: siteConfig.github });
  if (siteConfig.linkedin)
    ch.push({ label: "LinkedIn", value: siteConfig.linkedin.replace("https://", ""), href: siteConfig.linkedin });
  if (siteConfig.artstation)
    ch.push({ label: "ArtStation", value: siteConfig.artstation.replace("https://", ""), href: siteConfig.artstation });
  if (siteConfig.twitter)
    ch.push({ label: "Twitter / X", value: siteConfig.twitter.replace("https://", ""), href: siteConfig.twitter });
  return ch;
}

export default function ContactPage() {
  const channels = makeChannels();
  return (
    <>
      <PageHeader
        number="04"
        label="Contact"
        title="Get in touch"
        description="새로운 협업이나 R&D 기회에 항상 열려 있습니다. 셰이더, 파이프라인, 또는 그 사이의 모든 것에 대해 이야기해 보세요."
      />

      <section className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <ul className="grid gap-3 sm:grid-cols-2">
            {channels.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 hover:border-foreground transition"
                >
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      {c.label}
                    </p>
                    <p className="mt-1 text-sm font-medium">{c.value}</p>
                  </div>
                  <span className="text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

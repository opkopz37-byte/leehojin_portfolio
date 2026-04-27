"use client";

import Link from "next/link";
import { projects } from "@/lib/projects";

const previewExpertise = [
  "Shader Development",
  "Pipeline Automation",
  "Real-time Optimization",
];

export default function LandingPreview() {
  const featured = projects.filter((p) => p.coverImage).slice(0, 3);

  return (
    <>
      {/* About preview */}
      <section id="explore" className="border-t border-border px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-[1fr_2fr] sm:gap-12">
          <div>
            <p className="mb-3 font-mono text-xs text-accent">01 · About</p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              시각과 기술의 사이
            </h2>
          </div>
          <div className="space-y-6">
            <p className="text-sm leading-relaxed text-muted sm:text-base">
              테크니컬 아티스트로서 시각적 비전과 기술적 실현 가능성을 잇는 작업을 합니다.
            </p>
            <ul className="flex flex-wrap gap-2">
              {previewExpertise.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs"
                >
                  {s}
                </li>
              ))}
            </ul>
            <Link
              href="/about"
              className="inline-flex items-center gap-1 font-mono text-xs text-accent transition hover:text-foreground"
            >
              About 자세히 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* Work preview */}
      <section className="border-t border-border px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-baseline justify-between gap-4">
            <div>
              <p className="mb-2 font-mono text-xs text-accent">02 · Work</p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Selected Projects
              </h2>
            </div>
            <Link
              href="/work"
              className="shrink-0 font-mono text-xs text-muted transition hover:text-foreground"
            >
              전체 보기 →
            </Link>
          </div>

          {featured.length > 0 ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {featured.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/work/${p.slug}`}
                    className="group block overflow-hidden rounded-xl border border-border bg-card transition hover:border-foreground"
                  >
                    <div className="aspect-video overflow-hidden bg-card/50">
                      <img
                        src={p.coverImage!}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                        {p.category}
                      </p>
                      <h3 className="text-sm font-semibold leading-tight">
                        {p.title}
                      </h3>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-12 text-center text-sm text-muted">
              아직 등록된 프로젝트가 없습니다.
            </p>
          )}
        </div>
      </section>

      {/* Resume + Contact */}
      <section className="border-t border-border px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
          <Link
            href="/resume"
            className="group flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-6 transition hover:border-foreground sm:p-8"
          >
            <div>
              <p className="mb-2 font-mono text-xs text-accent">03 · Resume</p>
              <h3 className="text-xl font-semibold tracking-tight">
                경력과 학력
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                지금까지 거쳐 온 팀과 프로젝트를 시간순으로 정리했습니다.
              </p>
            </div>
            <span className="font-mono text-xs text-muted transition group-hover:text-foreground">
              Resume 보기 →
            </span>
          </Link>

          <Link
            href="/contact"
            className="group flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-6 transition hover:border-foreground sm:p-8"
          >
            <div>
              <p className="mb-2 font-mono text-xs text-accent">04 · Contact</p>
              <h3 className="text-xl font-semibold tracking-tight">
                함께 일하기
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                협업, R&amp;D, 컨설팅 문의를 받습니다. 편하게 연락 주세요.
              </p>
            </div>
            <span className="font-mono text-xs text-muted transition group-hover:text-foreground">
              Contact →
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}

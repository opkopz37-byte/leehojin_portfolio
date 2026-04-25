import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Resume — Your Name",
  description: "경력과 학력을 시간순으로 정리한 페이지.",
};

const experience = [
  {
    role: "Senior Technical Artist",
    company: "Studio Placeholder",
    period: "2023 — Present",
    desc: "오픈월드 타이틀의 셰이딩/VFX 파이프라인 전반 담당. 아티스트 워크플로우 개선과 런타임 최적화 주도.",
  },
  {
    role: "Technical Artist",
    company: "Game Company A",
    period: "2020 — 2023",
    desc: "콘솔 출시작에서 캐릭터/환경 셰이더 개발. 머티리얼 라이브러리 표준화와 검수 자동화 도구 제작.",
  },
  {
    role: "Junior Technical Artist",
    company: "Game Company B",
    period: "2018 — 2020",
    desc: "모바일 RPG 라이브 프로젝트에서 이펙트와 최적화 지원. 빌드/리포트 자동화 스크립트 운영.",
  },
];

const education = [
  {
    role: "B.S. in Computer Science",
    company: "University Placeholder",
    period: "2014 — 2018",
    desc: "그래픽스 및 게임 개발 동아리 활동. 졸업 프로젝트로 실시간 글로벌 일루미네이션 구현.",
  },
];

function Block({
  items,
}: {
  items: { role: string; company: string; period: string; desc: string }[];
}) {
  return (
    <ul className="space-y-8">
      {items.map((it) => (
        <li
          key={it.role + it.period}
          className="grid gap-2 sm:grid-cols-[180px_1fr]"
        >
          <div className="font-mono text-xs text-muted pt-1">{it.period}</div>
          <div>
            <h3 className="text-base font-semibold">{it.role}</h3>
            <p className="text-sm text-muted">{it.company}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{it.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ResumePage() {
  return (
    <>
      <PageHeader
        number="03"
        label="Resume"
        title="Resume"
        description="지금까지 거쳐 온 팀과 프로젝트를 시간순으로 정리했습니다."
      />

      <section className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl grid gap-16">
          <div>
            <h2 className="font-mono text-xs text-muted mb-6">EXPERIENCE</h2>
            <Block items={experience} />
          </div>

          <div>
            <h2 className="font-mono text-xs text-muted mb-6">EDUCATION</h2>
            <Block items={education} />
          </div>

          <div>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:border-foreground transition"
            >
              Download CV (PDF) ↓
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

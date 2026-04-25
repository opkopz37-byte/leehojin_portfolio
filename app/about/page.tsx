import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "About — Your Name",
  description:
    "테크니컬 아티스트로서의 전문 분야와 도구 스택을 소개합니다.",
};

const expertise = [
  {
    title: "Shader Development",
    desc: "HLSL · Shader Graph · Surface · 머티리얼 프로토타입과 최적화된 셰이더 작성.",
  },
  {
    title: "Pipeline Automation",
    desc: "Python · C++ · Shell · 아티스트가 반복 업무에서 벗어날 수 있는 자동화 도구 제작.",
  },
  {
    title: "Real-time Optimization",
    desc: "GPU/CPU 프로파일링과 LOD, 라이팅, 드로우콜 최적화로 안정적인 프레임 레이트 확보.",
  },
  {
    title: "DCC Tool Scripting",
    desc: "3ds Max · Maya · Blender · Substance · 아티스트 워크플로우에 맞춘 커스텀 도구 개발.",
  },
  {
    title: "Technical Support",
    desc: "아트팀과 엔지니어팀의 가교 역할. 문서화와 트레이닝 세션을 통한 지식 공유.",
  },
  {
    title: "Rapid Prototyping",
    desc: "프로덕션 도입 전 컨셉 검증과 위험 요소 식별을 위한 빠른 프로토타입 구현.",
  },
];

const stack = [
  "Unreal Engine",
  "Unity",
  "Python",
  "Lua",
  "C++",
  "C#",
  "HLSL",
  "Shell Script",
  "MaxScript",
  "3ds Max",
  "Maya",
  "Blender",
  "Photoshop",
  "Substance",
  "Houdini",
  "Git",
  "Perforce",
  "Jenkins",
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        number="01"
        label="About"
        title="시각과 기술의 사이"
        description="테크니컬 아티스트로서 시각적 비전과 기술적 실현 가능성 사이의 균형을 추구합니다. 셰이더 한 줄, 스크립트 한 줄이 팀 전체의 생산성을 바꿀 수 있다고 믿습니다."
      />

      <section className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-mono text-xs text-muted mb-8">EXPERTISE</h2>
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {expertise.map((e) => (
              <div key={e.title} className="space-y-2">
                <h3 className="text-base font-semibold">{e.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-mono text-xs text-muted mb-6">TECH STACK</h2>
          <ul className="flex flex-wrap gap-2">
            {stack.map((s) => (
              <li
                key={s}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-mono"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import InlineEdit from "@/components/InlineEdit";
import { useAdmin } from "@/hooks/useAdmin";
import { loadConfigValue, saveConfigValue } from "@/lib/configStorage";

const defaultExpertise = [
  { title: "Shader Development", desc: "HLSL · Shader Graph · Surface · 머티리얼 프로토타입과 최적화된 셰이더 작성." },
  { title: "Pipeline Automation", desc: "Python · C++ · Shell · 아티스트가 반복 업무에서 벗어날 수 있는 자동화 도구 제작." },
  { title: "Real-time Optimization", desc: "GPU/CPU 프로파일링과 LOD, 라이팅, 드로우콜 최적화로 안정적인 프레임 레이트 확보." },
  { title: "DCC Tool Scripting", desc: "3ds Max · Maya · Blender · Substance · 아티스트 워크플로우에 맞춘 커스텀 도구 개발." },
  { title: "Technical Support", desc: "아트팀과 엔지니어팀의 가교 역할. 문서화와 트레이닝 세션을 통한 지식 공유." },
  { title: "Rapid Prototyping", desc: "프로덕션 도입 전 컨셉 검증과 위험 요소 식별을 위한 빠른 프로토타입 구현." },
];

const defaultStack = [
  "Unreal Engine", "Unity", "Python", "Lua", "C++", "C#",
  "HLSL", "Shell Script", "MaxScript", "3ds Max", "Maya",
  "Blender", "Photoshop", "Substance", "Houdini", "Git", "Perforce", "Jenkins",
];

const EXPERTISE_KEY = "portfolio.about.expertise";
const STACK_KEY = "portfolio.about.stack";

export default function AboutPage() {
  const admin = useAdmin();
  const [expertise, setExpertiseState] = useState(defaultExpertise);
  const [stack, setStackState] = useState(defaultStack);
  const [stackInput, setStackInput] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setExpertiseState(loadConfigValue(EXPERTISE_KEY, defaultExpertise));
    setStackState(loadConfigValue(STACK_KEY, defaultStack));
    setHydrated(true);
  }, []);

  function saveExpertise(updated: typeof defaultExpertise) {
    setExpertiseState(updated);
    saveConfigValue(EXPERTISE_KEY, updated);
  }

  function saveStack(updated: string[]) {
    setStackState(updated);
    saveConfigValue(STACK_KEY, updated);
  }

  function updateExpertiseTitle(i: number, v: string) {
    const next = expertise.map((e, idx) => idx === i ? { ...e, title: v } : e);
    saveExpertise(next);
  }
  function updateExpertiseDesc(i: number, v: string) {
    const next = expertise.map((e, idx) => idx === i ? { ...e, desc: v } : e);
    saveExpertise(next);
  }
  function addExpertise() {
    saveExpertise([...expertise, { title: "New Skill", desc: "설명을 입력하세요." }]);
  }
  function removeExpertise(i: number) {
    saveExpertise(expertise.filter((_, idx) => idx !== i));
  }
  function addStackTag() {
    const val = stackInput.trim();
    if (!val) return;
    saveStack([...stack, val]);
    setStackInput("");
  }
  function removeStackTag(i: number) {
    saveStack(stack.filter((_, idx) => idx !== i));
  }

  return (
    <>
      <PageHeader
        number="01"
        label="About"
        title="시각과 기술의 사이"
        description="테크니컬 아티스트로서 시각적 비전과 기술적 실현 가능성 사이의 균형을 추구합니다."
      />

      <section className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-mono text-xs text-muted">EXPERTISE</h2>
            {admin && (
              <button
                type="button"
                onClick={addExpertise}
                className="font-mono text-[11px] text-accent border border-accent/30 rounded-full px-2 py-0.5 hover:bg-accent/10 transition"
              >
                + 추가
              </button>
            )}
          </div>
          <div className="grid gap-6 grid-cols-2 md:grid-cols-3">
            {expertise.map((e, i) => (
              <div key={i} className="space-y-2 relative group/exp">
                <h3 className="text-base font-semibold">
                  {admin ? (
                    <InlineEdit value={e.title} onSave={(v) => updateExpertiseTitle(i, v)} />
                  ) : e.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  {admin ? (
                    <InlineEdit value={e.desc} onSave={(v) => updateExpertiseDesc(i, v)} multiline />
                  ) : e.desc}
                </p>
                {admin && (
                  <button
                    type="button"
                    onClick={() => removeExpertise(i)}
                    className="absolute -top-2 -right-2 opacity-0 group-hover/exp:opacity-100 w-5 h-5 rounded-full bg-card border border-border text-xs text-muted hover:text-foreground transition flex items-center justify-center"
                    aria-label="삭제"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-mono text-xs text-muted mb-6">TECH STACK</h2>
          <ul className="flex flex-wrap gap-2">
            {stack.map((s, i) => (
              <li
                key={i}
                className="group/tag relative rounded-full border border-border bg-card px-3 py-1 text-xs font-mono"
              >
                {s}
                {admin && (
                  <button
                    type="button"
                    onClick={() => removeStackTag(i)}
                    className="ml-1.5 opacity-0 group-hover/tag:opacity-100 text-muted hover:text-foreground transition"
                    aria-label="삭제"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
            {admin && (
              <li className="flex items-center gap-1">
                <input
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addStackTag(); }}
                  placeholder="태그 추가"
                  className="rounded-full border border-dashed border-border bg-transparent px-3 py-1 text-xs font-mono outline-none focus:border-foreground w-24"
                />
                <button
                  type="button"
                  onClick={addStackTag}
                  className="font-mono text-xs text-accent hover:text-foreground transition"
                >
                  +
                </button>
              </li>
            )}
          </ul>
        </div>
      </section>
    </>
  );
}

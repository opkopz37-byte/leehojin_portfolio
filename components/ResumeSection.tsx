"use client";

import { useEffect, useState } from "react";
import InlineEdit from "@/components/InlineEdit";
import { useAdmin } from "@/hooks/useAdmin";
import { loadConfigValue, saveConfigValue } from "@/lib/configStorage";

type Entry = { role: string; company: string; period: string; desc: string };

const defaultProfile =
  "안녕하세요. 시각적 비전과 기술적 실현 사이를 잇는 테크니컬 아티스트입니다. 셰이더와 파이프라인, 그리고 실시간 최적화 영역에서 일하고 있습니다.";

const defaultExperience: Entry[] = [
  { role: "Senior Technical Artist", company: "Studio Placeholder", period: "2023 — Present", desc: "오픈월드 타이틀의 셰이딩/VFX 파이프라인 전반 담당. 아티스트 워크플로우 개선과 런타임 최적화 주도." },
  { role: "Technical Artist", company: "Game Company A", period: "2020 — 2023", desc: "콘솔 출시작에서 캐릭터/환경 셰이더 개발. 머티리얼 라이브러리 표준화와 검수 자동화 도구 제작." },
  { role: "Junior Technical Artist", company: "Game Company B", period: "2018 — 2020", desc: "모바일 RPG 라이브 프로젝트에서 이펙트와 최적화 지원. 빌드/리포트 자동화 스크립트 운영." },
];
const defaultEducation: Entry[] = [
  { role: "B.S. in Computer Science", company: "University Placeholder", period: "2014 — 2018", desc: "그래픽스 및 게임 개발 동아리 활동. 졸업 프로젝트로 실시간 글로벌 일루미네이션 구현." },
];
const defaultAwards: Entry[] = [
  { role: "Best Technical Demo", company: "KGC — Korea Game Conference", period: "2023", desc: "실시간 GI 프로토타입 데모로 기술 부문 수상." },
];
const defaultMilitary: Entry[] = [
  { role: "병장 만기 전역", company: "대한민국 육군", period: "2014 — 2016", desc: "" },
];
const defaultTraining: Entry[] = [
  { role: "교육 이수 예시", company: "기관명", period: "2023", desc: "이수 내용 설명." },
];

const PROFILE_KEY = "portfolio.resume.profile";
const EXP_KEY = "portfolio.resume.experience";
const EDU_KEY = "portfolio.resume.education";
const AWARDS_KEY = "portfolio.resume.awards";
const MILITARY_KEY = "portfolio.resume.military";
const TRAINING_KEY = "portfolio.resume.training";
const COLLAPSE_KEY = "portfolio.resume.collapsed";

export default function ResumeSection({ number = "" }: { number?: string }) {
  const admin = useAdmin();
  const [profile, setProfile] = useState(defaultProfile);
  const [exp, setExp] = useState(defaultExperience);
  const [edu, setEdu] = useState(defaultEducation);
  const [awards, setAwards] = useState(defaultAwards);
  const [military, setMilitary] = useState(defaultMilitary);
  const [training, setTraining] = useState(defaultTraining);
  const [collapsed, setCollapsed] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadConfigValue<string>(PROFILE_KEY, defaultProfile));
    setExp(loadConfigValue(EXP_KEY, defaultExperience));
    setEdu(loadConfigValue(EDU_KEY, defaultEducation));
    setAwards(loadConfigValue(AWARDS_KEY, defaultAwards));
    setMilitary(loadConfigValue(MILITARY_KEY, defaultMilitary));
    setTraining(loadConfigValue(TRAINING_KEY, defaultTraining));
    setCollapsed(loadConfigValue<boolean>(COLLAPSE_KEY, true));
    setHydrated(true);
  }, []);

  function saveProfile(v: string) { setProfile(v); saveConfigValue(PROFILE_KEY, v); }

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    saveConfigValue(COLLAPSE_KEY, next);
  }
  function saveExp(v: Entry[]) { setExp(v); saveConfigValue(EXP_KEY, v); }
  function saveEdu(v: Entry[]) { setEdu(v); saveConfigValue(EDU_KEY, v); }
  function saveAwards(v: Entry[]) { setAwards(v); saveConfigValue(AWARDS_KEY, v); }
  function saveMilitary(v: Entry[]) { setMilitary(v); saveConfigValue(MILITARY_KEY, v); }
  function saveTraining(v: Entry[]) { setTraining(v); saveConfigValue(TRAINING_KEY, v); }

  function makeUpdater(list: Entry[], save: (v: Entry[]) => void, i: number) {
    return (field: keyof Entry) => (val: string) => {
      const next = list.map((e, idx) => idx === i ? { ...e, [field]: val } : e);
      save(next);
    };
  }

  function EntryBlock({ items, save }: { items: Entry[]; save: (v: Entry[]) => void }) {
    return (
      <ul className="space-y-8">
        {items.map((it, i) => {
          const upd = makeUpdater(items, save, i);
          return (
            <li key={i} className="grid gap-1 sm:gap-2 sm:grid-cols-[160px_1fr] group/entry relative">
              <div className="font-mono text-[11px] sm:text-xs text-muted sm:pt-1">
                {admin ? <InlineEdit value={it.period} onSave={upd("period")} /> : it.period}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold">
                  {admin ? <InlineEdit value={it.role} onSave={upd("role")} /> : it.role}
                </h3>
                <p className="text-xs sm:text-sm text-muted">
                  {admin ? <InlineEdit value={it.company} onSave={upd("company")} /> : it.company}
                </p>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-muted whitespace-pre-wrap">
                  {admin ? <InlineEdit value={it.desc} onSave={upd("desc")} multiline /> : it.desc}
                </p>
              </div>
              {admin && (
                <button
                  type="button"
                  onClick={() => save(items.filter((_, idx) => idx !== i))}
                  className="absolute top-0 right-0 opacity-0 group-hover/entry:opacity-100 w-5 h-5 rounded-full bg-card border border-border text-xs text-muted hover:text-foreground transition flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
        {admin && (
          <li>
            <button
              type="button"
              onClick={() => save([...items, { role: "새 역할", company: "회사명", period: "Year", desc: "설명" }])}
              className="font-mono text-xs text-accent border border-dashed border-accent/30 rounded-full px-3 py-1 hover:bg-accent/10 transition"
            >
              + 항목 추가
            </button>
          </li>
        )}
      </ul>
    );
  }

  if (!hydrated) return null;

  return (
    <section className="border-t border-border px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          className="flex items-baseline gap-3 sm:gap-5 group w-full text-left"
        >
          <span className="font-mono text-sm sm:text-base text-accent tracking-[0.18em] shrink-0">
            {number || "R"}
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight transition-transform duration-200 origin-left group-hover:scale-[1.04]">
            Resume
          </h2>
          <span
            className="font-mono text-base sm:text-lg text-muted group-hover:text-foreground transition shrink-0"
            style={{
              transition: "transform 200ms",
              transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
              display: "inline-block",
            }}
          >
            ▸
          </span>
          <span className="font-mono text-xs text-muted shrink-0 hidden sm:inline">
            {collapsed ? "펼치기" : "접기"}
          </span>
        </button>

        {!collapsed && (
          <div className="mt-10 sm:mt-14 grid gap-12 sm:gap-16">
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold tracking-tight mb-4 sm:mb-6">
                Profile
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-muted whitespace-pre-wrap max-w-3xl">
                {admin ? (
                  <InlineEdit value={profile} onSave={saveProfile} multiline />
                ) : (
                  profile
                )}
              </p>
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold tracking-tight mb-4 sm:mb-6">
                Experience
              </h3>
              <EntryBlock items={exp} save={saveExp} />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold tracking-tight mb-4 sm:mb-6">
                Education
              </h3>
              <EntryBlock items={edu} save={saveEdu} />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold tracking-tight mb-4 sm:mb-6">
                Awards
              </h3>
              <EntryBlock items={awards} save={saveAwards} />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold tracking-tight mb-4 sm:mb-6">
                Military Service
              </h3>
              <EntryBlock items={military} save={saveMilitary} />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold tracking-tight mb-4 sm:mb-6">
                Training & Certificates
              </h3>
              <EntryBlock items={training} save={saveTraining} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

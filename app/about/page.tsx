"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import InlineEdit from "@/components/InlineEdit";
import CollapsibleSection from "@/components/CollapsibleSection";
import ResumeSection from "@/components/ResumeSection";
import { useAdmin } from "@/hooks/useAdmin";
import { loadConfigValue, saveConfigValue } from "@/lib/configStorage";
import { asset } from "@/lib/asset";

type DownloadItem = {
  kind: "file" | "link";
  title: string;
  url: string;
  description?: string;
};
const FILES_KEY = "portfolio.about.files";
const INTRO_KEY = "portfolio.about.intro";

const defaultIntro =
  "테크니컬 아티스트로서 시각적 비전과 기술적 실현 사이의 다리를 놓고자 합니다. 셰이딩, 파이프라인 자동화, 실시간 최적화 영역에서 아티스트가 더 멀리 갈 수 있게 돕는 도구와 시스템을 만듭니다.";

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

function normalizeDownloads(raw: unknown): DownloadItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it: unknown): DownloadItem | null => {
      if (!it || typeof it !== "object") return null;
      const o = it as Record<string, unknown>;
      const url = typeof o.url === "string" ? o.url : "";
      if (!url) return null;
      const kind = o.kind === "link" ? "link" : "file";
      const title =
        (typeof o.title === "string" && o.title) ||
        (typeof o.name === "string" && o.name) ||
        url;
      const description = typeof o.description === "string" ? o.description : "";
      return { kind, title, url, description };
    })
    .filter((x): x is DownloadItem => x !== null);
}

export default function AboutPage() {
  const admin = useAdmin();
  const [intro, setIntroState] = useState(defaultIntro);
  const [expertise, setExpertiseState] = useState(defaultExpertise);
  const [stack, setStackState] = useState(defaultStack);
  const [stackInput, setStackInput] = useState("");
  const [downloads, setDownloadsState] = useState<DownloadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [linkDraft, setLinkDraft] = useState({ title: "", url: "", description: "" });

  useEffect(() => {
    setIntroState(loadConfigValue<string>(INTRO_KEY, defaultIntro));
    setExpertiseState(loadConfigValue(EXPERTISE_KEY, defaultExpertise));
    setStackState(loadConfigValue(STACK_KEY, defaultStack));
    setDownloadsState(normalizeDownloads(loadConfigValue<unknown>(FILES_KEY, [])));
  }, []);

  function saveIntro(v: string) {
    setIntroState(v);
    saveConfigValue(INTRO_KEY, v);
  }
  function saveDownloads(v: DownloadItem[]) {
    setDownloadsState(v);
    saveConfigValue(FILES_KEY, v);
  }
  function updateDownload(i: number, patch: Partial<DownloadItem>) {
    saveDownloads(downloads.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function removeDownload(i: number) {
    saveDownloads(downloads.filter((_, idx) => idx !== i));
  }
  function addLink() {
    const title = linkDraft.title.trim();
    const url = linkDraft.url.trim();
    if (!url) return;
    saveDownloads([
      ...downloads,
      { kind: "link", title: title || url, url, description: linkDraft.description.trim() },
    ]);
    setLinkDraft({ title: "", url: "", description: "" });
  }

  async function onUploadFile(file: File) {
    if (file.size > 25 * 1024 * 1024) {
      alert("25MB 이하 파일만 업로드 가능합니다.");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",")[1];
      const res = await fetch("/api/local/upload-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, base64 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `업로드 실패 (${res.status})`);
      }
      const data = (await res.json()) as { url: string; name: string };
      saveDownloads([
        ...downloads,
        { kind: "file", title: data.name, url: data.url, description: "" },
      ]);
    } catch (err) {
      alert(`업로드 실패: ${err instanceof Error ? err.message : "오류"}`);
    } finally {
      setUploading(false);
    }
  }

  function saveExpertise(updated: typeof defaultExpertise) {
    setExpertiseState(updated);
    saveConfigValue(EXPERTISE_KEY, updated);
  }
  function saveStack(updated: string[]) {
    setStackState(updated);
    saveConfigValue(STACK_KEY, updated);
  }
  function updateExpertiseTitle(i: number, v: string) {
    saveExpertise(expertise.map((e, idx) => (idx === i ? { ...e, title: v } : e)));
  }
  function updateExpertiseDesc(i: number, v: string) {
    saveExpertise(expertise.map((e, idx) => (idx === i ? { ...e, desc: v } : e)));
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

  // Stop the section toggle from firing when clicking trailing buttons
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <PageHeader
        number="01"
        label="About"
        title="시각과 기술의 사이"
        description="테크니컬 아티스트로서 시각적 비전과 기술적 실현 가능성 사이의 균형을 추구합니다."
      />

      {/* 01 Introduction */}
      <CollapsibleSection
        number="01"
        title="Introduction"
        storageKey="portfolio.about.collapsed.intro"
      >
        <p className="text-sm sm:text-base leading-relaxed text-muted whitespace-pre-wrap max-w-3xl">
          {admin ? <InlineEdit value={intro} onSave={saveIntro} multiline /> : intro}
        </p>
      </CollapsibleSection>

      {/* 02 Expertise */}
      <CollapsibleSection
        number="02"
        title="Expertise"
        storageKey="portfolio.about.collapsed.expertise"
        trailing={
          admin && (
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                addExpertise();
              }}
              className="font-mono text-xs text-accent border border-accent/30 rounded-full px-3 py-1 hover:bg-accent/10 transition"
            >
              + 추가
            </button>
          )
        }
      >
        <div className="grid gap-6 grid-cols-2 md:grid-cols-3">
          {expertise.map((e, i) => (
            <div key={i} className="space-y-2 relative group/exp">
              <h3 className="text-base font-semibold transition-transform duration-200 origin-left group-hover/exp:scale-[1.03]">
                {admin ? (
                  <InlineEdit value={e.title} onSave={(v) => updateExpertiseTitle(i, v)} />
                ) : (
                  e.title
                )}
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                {admin ? (
                  <InlineEdit value={e.desc} onSave={(v) => updateExpertiseDesc(i, v)} multiline />
                ) : (
                  e.desc
                )}
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
      </CollapsibleSection>

      {/* 03 Downloads & Links */}
      <CollapsibleSection
        number="03"
        title="Downloads & Links"
        storageKey="portfolio.about.collapsed.downloads"
        trailing={
          <div className="flex items-center gap-2">
            {uploading && (
              <span className="font-mono text-[11px] text-accent">⏳ 업로드 중…</span>
            )}
            {admin && (
              <label
                onClick={stop}
                className="cursor-pointer rounded-full border border-accent/40 px-3 py-1 text-xs font-mono text-accent hover:bg-accent/10 transition"
              >
                + 파일 업로드
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) onUploadFile(f);
                  }}
                />
              </label>
            )}
          </div>
        }
      >
        {downloads.length === 0 ? (
          <p className="text-sm text-muted">
            {admin
              ? "파일을 업로드하거나 링크를 추가하면 방문자가 접근할 수 있습니다."
              : "공개된 항목이 없습니다."}
          </p>
        ) : (
          <ul className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {downloads.map((d, i) => (
              <li
                key={d.url + i}
                className="group/dl relative rounded-xl border border-border bg-card p-4 sm:p-5 hover:border-foreground transition"
              >
                <a
                  href={d.kind === "file" ? asset(d.url) : d.url}
                  {...(d.kind === "file"
                    ? { download: d.title }
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  className="block"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                      {d.kind === "file" ? "↓ FILE" : "↗ LINK"}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold leading-tight mb-1 transition-transform duration-200 origin-left group-hover/dl:scale-[1.04]">
                    {admin ? (
                      <InlineEdit
                        value={d.title}
                        onSave={(v) => updateDownload(i, { title: v })}
                      />
                    ) : (
                      d.title
                    )}
                  </h3>
                  {(d.description || admin) && (
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {admin ? (
                        <InlineEdit
                          value={d.description ?? ""}
                          onSave={(v) => updateDownload(i, { description: v })}
                          multiline
                        />
                      ) : (
                        d.description
                      )}
                    </p>
                  )}
                </a>
                {admin && (
                  <button
                    type="button"
                    onClick={() => removeDownload(i)}
                    className="absolute top-2 right-2 opacity-0 group-hover/dl:opacity-100 w-6 h-6 rounded-full bg-background border border-border text-xs text-muted hover:text-red-500 transition flex items-center justify-center"
                    aria-label="삭제"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {admin && (
          <div className="mt-6 sm:mt-8 rounded-xl border border-dashed border-border bg-card/40 p-4 sm:p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-3">
              ↗ 링크 추가
            </p>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:gap-3">
              <input
                value={linkDraft.title}
                onChange={(e) => setLinkDraft((s) => ({ ...s, title: e.target.value }))}
                placeholder="제목"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
              <input
                value={linkDraft.url}
                onChange={(e) => setLinkDraft((s) => ({ ...s, url: e.target.value }))}
                placeholder="https://..."
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-foreground"
              />
              <button
                type="button"
                onClick={addLink}
                disabled={!linkDraft.url.trim()}
                className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                추가
              </button>
            </div>
            <textarea
              value={linkDraft.description}
              onChange={(e) => setLinkDraft((s) => ({ ...s, description: e.target.value }))}
              placeholder="설명 (선택)"
              rows={2}
              className="mt-2 sm:mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground resize-y"
            />
          </div>
        )}
      </CollapsibleSection>

      {/* 04 Resume — own collapsible component, with number prop for visual alignment */}
      <ResumeSection number="04" />

      {/* 05 Tech Stack */}
      <CollapsibleSection
        number="05"
        title="Tech Stack"
        storageKey="portfolio.about.collapsed.stack"
      >
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") addStackTag();
                }}
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
      </CollapsibleSection>
    </>
  );
}

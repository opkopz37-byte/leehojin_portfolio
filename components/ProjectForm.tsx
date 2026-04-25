"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import MarkdownView from "@/components/MarkdownView";
import { deleteDraft, saveDraft } from "@/lib/draftStorage";
import { SUB_CATEGORIES, type Project, type SubCategory } from "@/lib/projects";

type FormState = {
  slug: string;
  title: string;
  category: Project["category"];
  subCategory: string;
  company: string;
  startDate: string;
  endDate: string;
  role: string;
  tags: string;
  summary: string;
  coverImage: string;
  body: string;
};

const empty: FormState = {
  slug: "",
  title: "",
  category: "Project",
  subCategory: "",
  company: "",
  startDate: "",
  endDate: "",
  role: "",
  tags: "",
  summary: "",
  coverImage: "",
  body: "",
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function toFormState(p: Partial<Project> | undefined): FormState {
  if (!p) return empty;
  return {
    slug: p.slug ?? "",
    title: p.title ?? "",
    category: (p.category as Project["category"]) ?? "Project",
    subCategory: p.subCategory ?? "",
    company: p.company ?? "",
    startDate: p.startDate ?? "",
    endDate: p.endDate ?? "",
    role: p.role ?? "",
    tags: (p.tags ?? []).join(", "),
    summary: p.summary ?? "",
    coverImage: p.coverImage ?? "",
    body: p.body ?? "",
  };
}

function toProject(s: FormState): Project {
  return {
    slug: s.slug.trim(),
    title: s.title.trim(),
    category: s.category,
    subCategory: (s.subCategory as SubCategory) || undefined,
    company:
      s.category === "Project" ? s.company.trim() || undefined : undefined,
    startDate: s.startDate || undefined,
    endDate: s.endDate || undefined,
    role: s.role.trim(),
    tags: s.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    summary: s.summary.trim(),
    coverImage: s.coverImage || undefined,
    body: s.body,
    media: [],
  };
}

export default function ProjectForm({
  initial,
  mode,
  originalSlug,
  overrides,
  initialUploaded,
}: {
  initial?: Partial<Project>;
  mode: "new" | "edit";
  originalSlug?: string;
  overrides?: boolean;
  initialUploaded?: boolean;
}) {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [s, setS] = useState<FormState>(() => toFormState(initial));
  const [bodyTab, setBodyTab] = useState<"write" | "preview">("write");
  const [slugDirty, setSlugDirty] = useState(mode === "edit");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<boolean>(!!initialUploaded);
  const [warning, setWarning] = useState<{ issues: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (slugDirty) return;
    setS((p) => ({ ...p, slug: slugify(p.title) }));
  }, [s.title, slugDirty]);

  const project = useMemo(() => toProject(s), [s]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setS((p) => ({ ...p, [key]: value }));
  }

  function collectIssues(): string[] {
    const issues: string[] = [];
    if (!project.title) issues.push("제목이 비어 있습니다.");
    if (!project.summary) issues.push("요약이 비어 있습니다.");
    if (!project.body.trim()) issues.push("본문이 비어 있습니다.");
    if (s.category === "Project" && !project.company)
      issues.push("회사명이 비어 있습니다.");
    if (!project.startDate && !project.endDate)
      issues.push("Project date가 비어 있습니다.");
    return issues;
  }

  function persist(opts: { uploaded: boolean }): { slug: string } | null {
    let p = project;
    if (!p.slug) p = { ...p, slug: `untitled-${Date.now().toString(36)}` };
    if (!p.title) p = { ...p, title: "(제목 없음)" };
    if (mode === "edit" && originalSlug && originalSlug !== p.slug) {
      deleteDraft(originalSlug);
    }
    try {
      const saved = saveDraft({ ...p, overrides, uploaded: opts.uploaded });
      setSavedAt(saved.updatedAt);
      setUploaded(opts.uploaded);
      setWarning(null);
      setSaveError(null);
      return { slug: saved.slug };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "저장 실패. localStorage를 확인하세요.";
      setSaveError(msg);
      return null;
    }
  }

  function onSaveDraft() {
    const result = persist({ uploaded: false });
    if (!result) return;
    if (mode === "new") router.replace(`/work/edit?slug=${result.slug}`);
  }

  function onUpload() {
    const issues = collectIssues();
    if (issues.length > 0) {
      setWarning({ issues });
      return;
    }
    const result = persist({ uploaded: true });
    if (!result) return;
    if (mode === "new") router.replace(`/work/edit?slug=${result.slug}`);
  }

  function onForceUpload() {
    const result = persist({ uploaded: true });
    if (!result) return;
    if (mode === "new") router.replace(`/work/edit?slug=${result.slug}`);
  }

  function onDelete() {
    if (!originalSlug) return;
    if (!confirm("이 글을 삭제할까요?")) return;
    deleteDraft(originalSlug);
    router.push("/work");
  }

  // ---- media insertion ---------------------------------------------------

  function insertSnippet(snippet: string) {
    const ta = bodyRef.current;
    setBodyTab("write");
    if (!ta) {
      set("body", s.body + "\n" + snippet + "\n");
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = s.body.slice(0, start);
    const after = s.body.slice(end);
    const wrap = `\n\n${snippet}\n\n`;
    const next = before + wrap + after;
    set("body", next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = before.length + wrap.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    for (const file of list) {
      if (file.size > MAX_FILE_BYTES) {
        alert(
          `${file.name}는 ${(file.size / 1024 / 1024).toFixed(1)}MB로 큽니다.\n` +
            `5MB 이하 파일만 본문에 직접 넣을 수 있어요.`,
        );
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (isVideo) {
          insertSnippet(
            `<video src="${dataUrl}" controls playsinline></video>`,
          );
        } else if (isImage) {
          insertSnippet(`![${file.name}](${dataUrl})`);
        } else {
          alert(`${file.name}: 이미지/영상만 지원합니다.`);
        }
      } catch (err) {
        console.error(err);
        alert(`${file.name} 읽기 실패`);
      }
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const it of Array.from(items)) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      handleFiles(files);
    }
  }

  function onDrop(e: DragEvent<HTMLTextAreaElement>) {
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    }
  }

  function onDragOver(e: DragEvent<HTMLTextAreaElement>) {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      setDragOver(true);
    }
  }

  function onDragLeave() {
    setDragOver(false);
  }

  // ---- render ------------------------------------------------------------

  return (
    <div className="px-6 pt-32 pb-24 sm:pt-40">
      {warning && (
        <WarningModal
          issues={warning.issues}
          onCancel={() => setWarning(null)}
          onForce={onForceUpload}
        />
      )}

      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            href="/work"
            className="font-mono text-xs text-muted hover:text-foreground transition"
          >
            ← All work
          </Link>
          <div className="flex items-center gap-3">
            {savedAt && (
              <span className="font-mono text-[11px] text-muted">
                saved {new Date(savedAt).toLocaleTimeString()}
              </span>
            )}
            {uploaded && (
              <span className="font-mono text-[11px] text-accent">
                ● 업로드됨
              </span>
            )}
          </div>
        </div>

        <p className="font-mono text-sm text-accent mb-3">
          {mode === "new" ? "NEW POST" : "EDIT"} · Work
        </p>

        {/* Title */}
        <input
          aria-label="Title"
          value={s.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="제목"
          className="block w-full bg-transparent text-4xl sm:text-5xl font-semibold tracking-tight outline-none placeholder:text-muted/40"
        />

        {/* Summary */}
        <textarea
          aria-label="Summary"
          value={s.summary}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="한 줄 요약"
          rows={2}
          className="mt-6 block w-full max-w-2xl resize-none bg-transparent text-base sm:text-lg leading-relaxed text-muted outline-none placeholder:text-muted/40"
        />

        {/* Cover Image */}
        <section className="mt-10 border-t border-border pt-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-mono text-xs text-muted">대표 이미지</h2>
            {s.coverImage && (
              <button
                type="button"
                onClick={() => set("coverImage", "")}
                className="font-mono text-[11px] text-muted hover:text-foreground transition"
              >
                제거
              </button>
            )}
          </div>
          {s.coverImage ? (
            <div className="relative aspect-video max-w-xl rounded-xl overflow-hidden border border-border">
              <img src={s.coverImage} alt="cover" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center aspect-video max-w-xl rounded-xl border-2 border-dashed border-border hover:border-foreground transition cursor-pointer"
              onClick={() => coverInputRef.current?.click()}
            >
              <span className="text-2xl mb-2">🖼</span>
              <span className="font-mono text-xs text-muted">클릭하여 이미지 선택</span>
              <span className="font-mono text-[10px] text-muted/60 mt-1">JPG · PNG · WebP · GIF (5MB 이하)</span>
            </div>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > MAX_FILE_BYTES) {
                alert(`${(file.size / 1024 / 1024).toFixed(1)}MB — 5MB 이하 파일만 가능합니다.`);
                return;
              }
              try {
                const url = await readAsDataUrl(file);
                set("coverImage", url);
              } catch {
                alert("이미지 읽기 실패");
              }
              e.target.value = "";
            }}
          />
        </section>

        {/* META fields — always visible */}
        <section className="mt-10 border-t border-border pt-8 grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={s.category}
              onChange={(e) =>
                set("category", e.target.value as Project["category"])
              }
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="Project">Project</option>
              <option value="Personal">Personal</option>
            </select>
          </Field>

          <Field label="Sub Category">
            <select
              value={s.subCategory}
              onChange={(e) => set("subCategory", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="">— 선택 안함 —</option>
              {SUB_CATEGORIES.map((sc) => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          </Field>

          <Field label="프로젝트 이름 (slug)">
            <input
              value={s.slug}
              onChange={(e) => {
                setSlugDirty(true);
                set("slug", slugify(e.target.value));
              }}
              placeholder="my-project"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-mono outline-none focus:border-foreground"
            />
          </Field>

          {s.category === "Project" && (
            <Field label="Company" full>
              <input
                value={s.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="회사명"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </Field>
          )}

          <Field label="Project date — 시작">
            <DateSelect
              value={s.startDate}
              onChange={(v) => set("startDate", v)}
            />
          </Field>

          <Field label="Project date — 종료">
            <DateSelect
              value={s.endDate}
              onChange={(v) => set("endDate", v)}
            />
          </Field>

          <Field label="Role">
            <input
              value={s.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="Lead Technical Artist"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>

          <Field label="Tags (콤마로 구분)">
            <input
              value={s.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="Unreal, HLSL, Niagara"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-mono outline-none focus:border-foreground"
            />
          </Field>
        </section>

        {/* BODY */}
        <section className="mt-10 border-t border-border pt-8">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h2 className="font-mono text-xs text-muted">본문</h2>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-border px-3 py-1 text-xs font-mono hover:border-foreground transition"
              >
                📎 파일 첨부
              </button>
              <PaneToggle value={bodyTab} onChange={setBodyTab} />
            </div>
          </div>

          <div style={{ display: bodyTab === "write" ? "block" : "none" }}>
            <textarea
              ref={bodyRef}
              value={s.body}
              onChange={(e) => set("body", e.target.value)}
              onPaste={onPaste}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              spellCheck={false}
              rows={20}
              placeholder="여기에 글을 작성하세요. 이미지·GIF·영상은 드래그하거나 붙여넣기하면 바로 들어갑니다."
              className={`block w-full resize-y rounded-xl border bg-card px-4 py-3 text-sm leading-relaxed outline-none transition ${
                dragOver
                  ? "border-accent bg-accent/5"
                  : "border-border focus:border-foreground"
              }`}
            />
            <p className="mt-2 font-mono text-[11px] text-muted">
              이미지·GIF·영상을 위로 끌어다 놓거나 붙여넣기(⌘V)하면 그 자리에 들어갑니다. (5MB 이하)
            </p>
          </div>

          <div style={{ display: bodyTab === "preview" ? "block" : "none" }}>
            <div className="rounded-xl border border-border bg-card px-6 py-5 min-h-[24rem]">
              {s.body.trim() ? (
                <MarkdownView source={s.body} />
              ) : (
                <p className="text-sm text-muted">본문이 비어 있습니다.</p>
              )}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white hover:opacity-90 active:scale-[0.98] transition"
          >
            {uploaded ? "업로드 갱신" : "업로드"}
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:border-foreground transition"
          >
            초안만 저장
          </button>
          {mode === "edit" && (
            <button
              type="button"
              onClick={onDelete}
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-mono text-muted hover:border-foreground hover:text-foreground transition"
            >
              삭제
            </button>
          )}
        </div>

        {saveError && (
          <p className="mt-3 font-mono text-xs text-red-500">{saveError}</p>
        )}

        <p className="mt-4 font-mono text-[11px] text-muted">
          이 브라우저(localStorage)에 저장됩니다. 다른 사람도 보게 하려면 /work 의{" "}
          <code className="font-mono">Export drafts ↓</code> 로 받은 JSON을{" "}
          <code className="font-mono">lib/projects.ts</code> 에 추가해 커밋하세요.
        </p>
      </div>
    </div>
  );
}

function PaneToggle({
  value,
  onChange,
}: {
  value: "write" | "preview";
  onChange: (v: "write" | "preview") => void;
}) {
  const options: { value: "write" | "preview"; label: string }[] = [
    { value: "write", label: "작성" },
    { value: "preview", label: "미리보기" },
  ];
  return (
    <div className="flex rounded-full border border-border overflow-hidden">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 text-[11px] font-mono transition ${
            value === o.value
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function WarningModal({
  issues,
  onCancel,
  onForce,
}: {
  issues: string[];
  onCancel: () => void;
  onForce: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold tracking-tight mb-2">
          업로드 전 확인
        </h3>
        <p className="text-sm text-muted mb-4">
          아래 항목이 비어 있습니다. 그래도 업로드할까요?
        </p>
        <ul className="space-y-1 text-sm mb-6 list-disc pl-5">
          {issues.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-foreground transition"
          >
            수정하기
          </button>
          <button
            type="button"
            onClick={onForce}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            업로드
          </button>
        </div>
      </div>
    </div>
  );
}

function DateSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [y, m, d] = value ? value.split("-") : ["", "", ""];
  const thisYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = thisYear + 2; i >= thisYear - 25; i--) years.push(String(i));
  const months = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const yi = parseInt(y || "0", 10);
  const mi = parseInt(m || "0", 10);
  const lastDay = yi && mi ? new Date(yi, mi, 0).getDate() : 31;
  const days = Array.from({ length: lastDay }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );

  function emit(ny: string, nm: string, nd: string) {
    if (!ny && !nm && !nd) return onChange("");
    if (ny && !nm && !nd) return onChange(ny);
    if (ny && nm && !nd) return onChange(`${ny}-${nm}`);
    if (ny && nm && nd) return onChange(`${ny}-${nm}-${nd}`);
    onChange("");
  }

  const cls =
    "rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Year"
        value={y || ""}
        onChange={(e) => emit(e.target.value, m || "", d || "")}
        className={cls}
      >
        <option value="">년</option>
        {years.map((yy) => (
          <option key={yy} value={yy}>
            {yy}
          </option>
        ))}
      </select>
      <select
        aria-label="Month"
        value={m || ""}
        onChange={(e) => {
          const nm = e.target.value;
          let nd = d || "";
          if (yi && nm && nd) {
            const cap = new Date(yi, parseInt(nm, 10), 0).getDate();
            if (parseInt(nd, 10) > cap) nd = String(cap).padStart(2, "0");
          }
          emit(y || "", nm, nd);
        }}
        className={cls}
      >
        <option value="">월</option>
        {months.map((mm) => (
          <option key={mm} value={mm}>
            {parseInt(mm, 10)}
          </option>
        ))}
      </select>
      <select
        aria-label="Day"
        value={d || ""}
        onChange={(e) => emit(y || "", m || "", e.target.value)}
        className={cls}
      >
        <option value="">일</option>
        {days.map((dd) => (
          <option key={dd} value={dd}>
            {parseInt(dd, 10)}
          </option>
        ))}
      </select>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="font-mono text-[11px] text-muted hover:text-foreground transition px-2"
        >
          clear
        </button>
      )}
    </div>
  );
}

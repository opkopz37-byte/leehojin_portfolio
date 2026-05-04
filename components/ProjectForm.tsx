"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import BodyView from "@/components/BodyView";
import { deleteDraft, saveDraft } from "@/lib/draftStorage";
import { upsertRemotePost, deleteRemotePost, uploadImage } from "@/lib/githubStorage";
import { subsForMain, type Project, type SubCategory } from "@/lib/projects";

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
  bodyFormat: "markdown" | "html";
  videoLinks: string[];
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
  bodyFormat: "markdown",
  videoLinks: [],
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const IMG_TAG_RE = /<img\b[^>]*>/gi;

function buildTableHtml(rows: number, cols: number, hasHeader: boolean): string {
  const th = (i: number) =>
    `<th style="border:1px solid #ddd;padding:8px 12px;background:rgba(127,127,127,0.12);text-align:left;">제목 ${i + 1}</th>`;
  const td = '<td style="border:1px solid #ddd;padding:8px 12px;">셀</td>';
  const headerHtml = hasHeader
    ? `<thead><tr>${Array.from({ length: cols }, (_, i) => th(i)).join("")}</tr></thead>`
    : "";
  const bodyRows = Math.max(0, rows - (hasHeader ? 1 : 0));
  const row = `<tr>${Array.from({ length: cols }, () => td).join("")}</tr>`;
  const bodyHtml = `<tbody>${Array.from({ length: bodyRows }, () => row).join("")}</tbody>`;
  return `<table style="border-collapse:collapse;margin:1.5rem 0;width:100%;">${headerHtml}${bodyHtml}</table>`;
}

function replaceNthImgSrc(html: string, n: number, newSrc: string): string {
  let i = 0;
  return html.replace(IMG_TAG_RE, (tag) => {
    if (i++ !== n) return tag;
    if (/\bsrc\s*=\s*["'][^"']*["']/i.test(tag)) {
      return tag.replace(/\bsrc\s*=\s*["'][^"']*["']/i, `src="${newSrc}"`);
    }
    return tag.replace(/<img\b/i, `<img src="${newSrc}"`);
  });
}

function removeNthImg(html: string, n: number): string {
  let i = 0;
  return html.replace(IMG_TAG_RE, (tag) => (i++ === n ? "" : tag));
}

function insertImgBeforeBodyEnd(html: string, imgTag: string): string {
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `  ${imgTag}\n</body>`);
  }
  return html + `\n${imgTag}\n`;
}

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img",
  "input", "link", "meta", "source", "track", "wbr",
]);

type ElInfo = {
  outerStart: number;
  outerEnd: number;
  innerStart: number;
  innerEnd: number;
  tagName: string;
};

/** Enumerate direct child elements within [scopeStart, scopeEnd). Skips text/comments,
 *  honors void/self-close tags and raw-text elements (script/style). */
function findChildElements(html: string, scopeStart: number, scopeEnd: number): ElInfo[] {
  const out: ElInfo[] = [];
  let i = scopeStart;
  while (i < scopeEnd) {
    if (html[i] !== "<") { i++; continue; }
    if (html.startsWith("<!--", i)) {
      const e = html.indexOf("-->", i);
      i = e === -1 ? scopeEnd : Math.min(scopeEnd, e + 3);
      continue;
    }
    if (html[i + 1] === "!" || html[i + 1] === "?") {
      const e = html.indexOf(">", i);
      i = e === -1 ? scopeEnd : Math.min(scopeEnd, e + 1);
      continue;
    }
    const tagEnd = html.indexOf(">", i);
    if (tagEnd === -1 || tagEnd >= scopeEnd) break;
    const inner = html.slice(i + 1, tagEnd);
    const isClose = inner.startsWith("/");
    if (isClose) { i = tagEnd + 1; continue; }
    const isSelfClose = inner.endsWith("/");
    const tagName = (inner.match(/^([a-zA-Z][\w-]*)/)?.[1] ?? "").toLowerCase();
    if (!tagName) { i = tagEnd + 1; continue; }

    const outerStart = i;
    const innerStart = tagEnd + 1;

    if (isSelfClose || VOID_TAGS.has(tagName)) {
      out.push({ outerStart, outerEnd: innerStart, innerStart, innerEnd: innerStart, tagName });
      i = innerStart;
      continue;
    }

    if (tagName === "script" || tagName === "style") {
      const closeRe = new RegExp(`</${tagName}\\s*>`, "i");
      const slice = html.slice(innerStart, scopeEnd);
      const m = slice.match(closeRe);
      if (!m || m.index === undefined) { i = scopeEnd; continue; }
      const innerEnd = innerStart + m.index;
      const outerEnd = innerEnd + m[0].length;
      out.push({ outerStart, outerEnd, innerStart, innerEnd, tagName });
      i = outerEnd;
      continue;
    }

    // Match closing tag at depth 0 by counting only same-name opens
    let j = innerStart;
    let depth = 1;
    let innerEnd = innerStart;
    let outerEnd = innerStart;
    while (j < scopeEnd && depth > 0) {
      if (html[j] !== "<") { j++; continue; }
      if (html.startsWith("<!--", j)) {
        const e = html.indexOf("-->", j);
        j = e === -1 ? scopeEnd : Math.min(scopeEnd, e + 3);
        continue;
      }
      if (html[j + 1] === "!" || html[j + 1] === "?") {
        const e = html.indexOf(">", j);
        j = e === -1 ? scopeEnd : Math.min(scopeEnd, e + 1);
        continue;
      }
      const te = html.indexOf(">", j);
      if (te === -1 || te >= scopeEnd) { j = scopeEnd; break; }
      const tInner = html.slice(j + 1, te);
      const tIsClose = tInner.startsWith("/");
      const tIsSelfClose = !tIsClose && tInner.endsWith("/");
      const tName = (tInner.match(/^\/?([a-zA-Z][\w-]*)/)?.[1] ?? "").toLowerCase();

      if (tIsClose) {
        if (tName === tagName) {
          depth--;
          if (depth === 0) {
            innerEnd = j;
            outerEnd = te + 1;
            j = te + 1;
            break;
          }
        }
        j = te + 1;
        continue;
      }

      if (tName === "script" || tName === "style") {
        const cre = new RegExp(`</${tName}\\s*>`, "i");
        const slc = html.slice(te + 1, scopeEnd);
        const cm = slc.match(cre);
        j = cm && cm.index !== undefined ? te + 1 + cm.index + cm[0].length : scopeEnd;
        continue;
      }

      if (!tIsSelfClose && !VOID_TAGS.has(tName) && tName === tagName) depth++;
      j = te + 1;
    }

    out.push({ outerStart, outerEnd, innerStart, innerEnd, tagName });
    i = outerEnd;
  }
  return out;
}

function findElementByPath(html: string, path: number[]): ElInfo | null {
  if (path.length === 0) return null;
  const bodyOpen = html.match(/<body[^>]*>/i);
  let scopeStart = bodyOpen ? bodyOpen.index! + bodyOpen[0].length : 0;
  const closeRel = html.slice(scopeStart).search(/<\/body\s*>/i);
  let scopeEnd = closeRel >= 0 ? scopeStart + closeRel : html.length;

  let result: ElInfo | null = null;
  for (let d = 0; d < path.length; d++) {
    const idx = path[d];
    const children = findChildElements(html, scopeStart, scopeEnd);
    if (idx < 0 || idx >= children.length) return null;
    result = children[idx];
    if (d < path.length - 1) {
      scopeStart = result.innerStart;
      scopeEnd = result.innerEnd;
    }
  }
  return result;
}

function insertAtElementPath(
  html: string,
  path: number[],
  position: "before" | "after",
  imgTag: string,
): string {
  const info = findElementByPath(html, path);
  if (!info) return html;
  const at = position === "before" ? info.outerStart : info.outerEnd;
  return html.slice(0, at) + `\n  ${imgTag}\n  ` + html.slice(at);
}

function buildImgTag(
  src: string,
  alt: string,
  size: 25 | 50 | 75 | 100,
  align: "left" | "center" | "right",
): string {
  if (align === "center") {
    return `<img src="${src}" alt="${alt}" style="display:block;margin:1.5rem auto;width:${size}%;max-width:100%;height:auto;" />`;
  }
  const margin = align === "left" ? "0 1.5rem 1rem 0" : "0 0 1rem 1.5rem";
  return `<img src="${src}" alt="${alt}" style="float:${align};margin:${margin};width:${size}%;max-width:${size}%;height:auto;" />`;
}

function buildVideoTag(
  src: string,
  size: 25 | 50 | 75 | 100,
  align: "left" | "center" | "right",
): string {
  if (align === "center") {
    return `<video src="${src}" controls playsinline style="display:block;margin:1.5rem auto;width:${size}%;max-width:100%;height:auto;"></video>`;
  }
  const margin = align === "left" ? "0 1.5rem 1rem 0" : "0 0 1rem 1.5rem";
  return `<video src="${src}" controls playsinline style="float:${align};margin:${margin};width:${size}%;max-width:${size}%;height:auto;"></video>`;
}

function slugify(s: string): string {
  // ASCII-only slugs — Next.js dynamic routing struggles with non-ASCII path
  // segments (encoded URL → 404). Korean/CJK titles fall through to the
  // untitled fallback at save time.
  const ascii = s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return ascii;
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
    bodyFormat: p.bodyFormat ?? "markdown",
    videoLinks: p.videoLinks ?? [],
  };
}

function toProject(s: FormState): Project {
  return {
    slug: s.slug.trim(),
    title: s.title.trim(),
    category: s.category,
    subCategory: (s.subCategory as SubCategory) || undefined,
    company: s.company.trim() || undefined,
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
    bodyFormat: s.bodyFormat,
    media: [],
    videoLinks: s.videoLinks.filter(Boolean),
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  function sendTableOp(op: string, args: Record<string, unknown> = {}) {
    iframeRef.current?.contentWindow?.postMessage({ type: "table-op", op, ...args }, "*");
  }
  const [s, setS] = useState<FormState>(() => toFormState(initial));
  const [bodyTab, setBodyTab] = useState<"write" | "preview">("write");
  const [slugDirty, setSlugDirty] = useState(mode === "edit");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<boolean>(!!initialUploaded);
  const [warning, setWarning] = useState<{ issues: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pushing, setPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "success" | "error">("idle");
  const [pushError, setPushError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState<Array<{ url: string; filename: string }>>([]);
  const previewImageInputRef = useRef<HTMLInputElement | null>(null);
  const [previewEdit, setPreviewEdit] = useState<{
    path: number[];
    tagPath: string[];
    isImg: boolean;
    isVideo: boolean;
    imgIndex: number;
    imgSrc: string;
    inTable: boolean;
    tablePath: number[] | null;
    cellRowIdx: number;
    cellColIdx: number;
  } | null>(null);
  const [wysiwyg, setWysiwyg] = useState(false);
  const [tableModal, setTableModal] = useState(false);
  const [tableInsertTarget, setTableInsertTarget] = useState<
    | { mode: "cursor" }
    | { mode: "path"; path: number[]; position: "before" | "after" }
    | null
  >(null);

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

  function persist(opts: { uploaded: boolean }): Project | null {
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
      const { updatedAt: _u, overrides: _o, uploaded: _up, ...rest } = saved;
      return rest as Project;
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

  async function pushToGitHub(p: Project): Promise<boolean> {
    setPushing(true);
    setPushStatus("idle");
    setPushError(null);
    try {
      await upsertRemotePost(p);
      setPushStatus("success");
      return true;
    } catch (err) {
      setPushStatus("error");
      setPushError(err instanceof Error ? err.message : "GitHub 저장 실패");
      return false;
    } finally {
      setPushing(false);
    }
  }

  async function onUpload() {
    const issues = collectIssues();
    if (issues.length > 0) {
      setWarning({ issues });
      return;
    }
    const persisted = persist({ uploaded: true });
    if (!persisted) return;
    const ok = await pushToGitHub(persisted);
    if (!ok) return;
    // Clear draft — fresh data is now in posts.json and will be fetched by work page
    deleteDraft(persisted.slug);
    router.push("/work");
  }

  async function onForceUpload() {
    const persisted = persist({ uploaded: true });
    if (!persisted) return;
    const ok = await pushToGitHub(persisted);
    if (!ok) return;
    deleteDraft(persisted.slug);
    router.push("/work");
  }

  async function onDelete() {
    if (!originalSlug) return;
    if (!confirm("이 글을 삭제할까요?")) return;
    deleteDraft(originalSlug);
    try {
      await deleteRemotePost(originalSlug);
    } catch (err) {
      alert(`삭제 실패: ${err instanceof Error ? err.message : "오류"}`);
      return;
    }
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

  async function handleFiles(files: FileList | File[], switchToPreview = false) {
    const list = Array.from(files);
    let inserted = false;
    const collectedImages: Array<{ url: string; filename: string }> = [];
    for (const file of list) {
      if (file.size > MAX_FILE_BYTES) {
        alert(
          `${file.name}는 ${(file.size / 1024 / 1024).toFixed(1)}MB로 큽니다.\n` +
            `10MB 이하 파일만 본문에 직접 넣을 수 있어요.`,
        );
        continue;
      }
      try {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (isVideo) {
          const dataUrl = await readAsDataUrl(file);
          let url = dataUrl;
          setImageUploading(true);
          try {
            url = await uploadImage(file.name, dataUrl, file.type);
          } catch (err) {
            console.error(err);
          } finally {
            setImageUploading(false);
          }
          insertSnippet(`<video src="${url}" controls playsinline></video>`);
          inserted = true;
        } else if (isImage) {
          const dataUrl = await readAsDataUrl(file);
          let url = dataUrl;
          setImageUploading(true);
          try {
            url = await uploadImage(file.name, dataUrl);
          } catch (err) {
            console.error(err);
          } finally {
            setImageUploading(false);
          }
          collectedImages.push({ url, filename: file.name });
          inserted = true;
        } else {
          alert(`${file.name}: 이미지/영상만 지원합니다.`);
        }
      } catch (err) {
        console.error(err);
        alert(`${file.name} 읽기 실패`);
      }
    }
    if (collectedImages.length === 1) {
      setPendingImages(collectedImages);
    } else {
      for (const img of collectedImages) {
        insertSnippet(`<img src="${img.url}" alt="${img.filename}" style="display:block;margin:0 auto;width:100%;max-width:100%;" />`);
      }
      if (inserted && switchToPreview) setBodyTab("preview");
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
      handleFiles(files, true); // paste → auto-switch to preview
    }
  }

  function onDrop(e: DragEvent<HTMLTextAreaElement>) {
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      e.preventDefault();
      handleFiles(e.dataTransfer.files, true); // drop → auto-switch to preview
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

  // Auto-exit wysiwyg when switching away from HTML preview
  useEffect(() => {
    if (!wysiwyg) return;
    if (bodyTab !== "preview" || s.bodyFormat !== "html") setWysiwyg(false);
  }, [bodyTab, s.bodyFormat, wysiwyg]);

  // ---- HTML preview image editing ---------------------------------------

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as {
        type?: string;
        path?: number[];
        tagPath?: string[];
        isImg?: boolean;
        isVideo?: boolean;
        imgIndex?: number;
        imgSrc?: string;
        inTable?: boolean;
        tablePath?: number[] | null;
        cellRowIdx?: number;
        cellColIdx?: number;
      } | null;
      if (!data) return;
      if (s.bodyFormat !== "html" || bodyTab !== "preview") return;
      if (data.type === "editor-html-update") {
        if (typeof (data as { html?: unknown }).html === "string") {
          setS((prev) => ({ ...prev, body: (data as { html: string }).html }));
        }
        return;
      }
      if (data.type !== "editor-element-click") return;
      if (!Array.isArray(data.path) || data.path.length === 0) return;
      setPreviewEdit({
        path: data.path,
        tagPath: Array.isArray(data.tagPath) ? data.tagPath : [],
        isImg: !!data.isImg,
        isVideo: !!data.isVideo,
        imgIndex: typeof data.imgIndex === "number" ? data.imgIndex : -1,
        imgSrc: typeof data.imgSrc === "string" ? data.imgSrc : "",
        inTable: !!data.inTable,
        tablePath: Array.isArray(data.tablePath) ? data.tablePath : null,
        cellRowIdx: typeof data.cellRowIdx === "number" ? data.cellRowIdx : -1,
        cellColIdx: typeof data.cellColIdx === "number" ? data.cellColIdx : -1,
      });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [s.bodyFormat, bodyTab]);

  async function uploadAndBuildTag(
    file: File,
    size: 25 | 50 | 75 | 100,
    align: "left" | "center" | "right",
  ): Promise<string | null> {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      alert(`${file.name}: 이미지/영상만 지원합니다.`);
      return null;
    }
    if (file.size > MAX_FILE_BYTES) {
      alert(`${(file.size / 1024 / 1024).toFixed(1)}MB — 10MB 이하 파일만 가능합니다.`);
      return null;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setImageUploading(true);
      let url = dataUrl;
      try {
        url = isVideo
          ? await uploadImage(file.name, dataUrl, file.type)
          : await uploadImage(file.name, dataUrl);
      } catch (err) {
        console.error(err);
      } finally {
        setImageUploading(false);
      }
      return isVideo ? buildVideoTag(url, size, align) : buildImgTag(url, file.name, size, align);
    } catch {
      alert(`${file.name} 읽기 실패`);
      return null;
    }
  }

  async function appendImageToHtmlBody(file: File) {
    const tag = await uploadAndBuildTag(file, 100, "center");
    if (!tag) return;
    set("body", insertImgBeforeBodyEnd(s.body, tag));
  }

  async function replaceImage(index: number, file: File) {
    if (file.size > MAX_FILE_BYTES) {
      alert(`${(file.size / 1024 / 1024).toFixed(1)}MB — 10MB 이하 파일만 가능합니다.`);
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setImageUploading(true);
      let url = dataUrl;
      try {
        url = await uploadImage(file.name, dataUrl);
      } catch (err) {
        console.error(err);
      } finally {
        setImageUploading(false);
      }
      set("body", replaceNthImgSrc(s.body, index, url));
    } catch {
      alert("이미지 읽기 실패");
    }
  }

  async function insertAtPath(
    path: number[],
    position: "before" | "after",
    file: File,
    size: 25 | 50 | 75 | 100,
    align: "left" | "center" | "right",
  ) {
    const tag = await uploadAndBuildTag(file, size, align);
    if (!tag) return;
    set("body", insertAtElementPath(s.body, path, position, tag));
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

      {tableModal && (
        <TableInsertModal
          onInsert={(html) => {
            if (tableInsertTarget?.mode === "path") {
              set(
                "body",
                insertAtElementPath(
                  s.body,
                  tableInsertTarget.path,
                  tableInsertTarget.position,
                  html,
                ),
              );
              setBodyTab("preview");
            } else {
              insertSnippet(html);
              setBodyTab("preview");
            }
            setTableModal(false);
            setTableInsertTarget(null);
          }}
          onCancel={() => {
            setTableModal(false);
            setTableInsertTarget(null);
          }}
        />
      )}

      {pendingImages.length > 0 && (
        <ImageOptionsModal
          src={pendingImages[0].url}
          filename={pendingImages[0].filename}
          onInsert={(html) => {
            insertSnippet(html);
            setPendingImages((q) => {
              const next = q.slice(1);
              if (next.length === 0) setBodyTab("preview");
              return next;
            });
          }}
          onCancel={() => {
            const img = pendingImages[0];
            insertSnippet(`![${img.filename}](${img.url})`);
            setPendingImages((q) => q.slice(1));
          }}
        />
      )}

      {previewEdit && (
        <ElementEditModal
          edit={previewEdit}
          onReplace={async (file) => {
            const idx = previewEdit.imgIndex;
            setPreviewEdit(null);
            if (idx >= 0) await replaceImage(idx, file);
          }}
          onDelete={() => {
            if (!confirm("이 이미지를 삭제할까요?")) return;
            const idx = previewEdit.imgIndex;
            setPreviewEdit(null);
            if (idx >= 0) set("body", removeNthImg(s.body, idx));
          }}
          onDeleteVideo={() => {
            const path = previewEdit.path;
            if (!path) return;
            if (!confirm("이 영상을 삭제할까요?")) return;
            setPreviewEdit(null);
            iframeRef.current?.contentWindow?.postMessage(
              { type: "delete-element", elementPath: path },
              "*",
            );
          }}
          onInsert={async (file, position, size, align) => {
            const path = previewEdit.path;
            setPreviewEdit(null);
            await insertAtPath(path, position, file, size, align);
          }}
          onInsertTable={(position) => {
            const path = previewEdit.path;
            setPreviewEdit(null);
            setTableInsertTarget({ mode: "path", path, position });
            setTableModal(true);
          }}
          onDeleteTable={() => {
            const tablePath = previewEdit.tablePath;
            if (!tablePath) return;
            if (!confirm("이 표를 삭제할까요?")) return;
            setPreviewEdit(null);
            sendTableOp("deleteTable", { tablePath });
          }}
          onInsertRow={(position) => {
            const tp = previewEdit.tablePath;
            if (!tp) return;
            const ri = previewEdit.cellRowIdx;
            setPreviewEdit(null);
            sendTableOp("insertRow", {
              tablePath: tp,
              cellRowIdx: ri,
              position,
            });
          }}
          onDeleteRow={() => {
            const tp = previewEdit.tablePath;
            if (!tp) return;
            const ri = previewEdit.cellRowIdx;
            if (!confirm(ri >= 0 ? "이 행을 삭제할까요?" : "마지막 행을 삭제할까요?"))
              return;
            setPreviewEdit(null);
            sendTableOp("deleteRow", { tablePath: tp, cellRowIdx: ri });
          }}
          onInsertCol={(position) => {
            const tp = previewEdit.tablePath;
            if (!tp) return;
            const ci = previewEdit.cellColIdx;
            setPreviewEdit(null);
            sendTableOp("insertCol", {
              tablePath: tp,
              cellColIdx: ci,
              position,
            });
          }}
          onDeleteCol={() => {
            const tp = previewEdit.tablePath;
            if (!tp) return;
            const ci = previewEdit.cellColIdx;
            if (!confirm(ci >= 0 ? "이 열을 삭제할까요?" : "마지막 열을 삭제할까요?"))
              return;
            setPreviewEdit(null);
            sendTableOp("deleteCol", { tablePath: tp, cellColIdx: ci });
          }}
          onCancel={() => setPreviewEdit(null)}
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
                alert(`${(file.size / 1024 / 1024).toFixed(1)}MB — 10MB 이하 파일만 가능합니다.`);
                return;
              }
              try {
                const dataUrl = await readAsDataUrl(file);
                setImageUploading(true);
                try {
                  const url = await uploadImage(file.name, dataUrl);
                  set("coverImage", url);
                } catch (err) {
                  console.error(err);
                  set("coverImage", dataUrl);
                } finally {
                  setImageUploading(false);
                }
              } catch {
                alert("이미지 읽기 실패");
              }
              e.target.value = "";
            }}
          />
        </section>

        {/* Video Links */}
        <section className="mt-10 border-t border-border pt-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-mono text-xs text-muted">메인 영상 (YouTube / Vimeo)</h2>
            <button
              type="button"
              onClick={() => set("videoLinks", [...s.videoLinks, ""])}
              className="font-mono text-[11px] text-accent hover:text-foreground transition"
            >
              + 항목 추가
            </button>
          </div>
          {s.videoLinks.length === 0 && (
            <p className="text-xs text-muted/60 font-mono">링크를 추가하면 게시물 상단에 순서대로 임베드됩니다.</p>
          )}
          <div className="space-y-2">
            {s.videoLinks.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={url}
                  onChange={(e) => {
                    const next = [...s.videoLinks];
                    next[i] = e.target.value;
                    set("videoLinks", next);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-mono outline-none focus:border-foreground"
                />
                <button
                  type="button"
                  onClick={() => set("videoLinks", s.videoLinks.filter((_, j) => j !== i))}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted hover:border-foreground hover:text-foreground transition text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* META fields — always visible */}
        <section className="mt-10 border-t border-border pt-8 grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={s.category}
              onChange={(e) => {
                const next = e.target.value as Project["category"];
                setS((p) => {
                  const allowed = subsForMain(next);
                  const keepSub = p.subCategory && (allowed as readonly string[]).includes(p.subCategory);
                  return { ...p, category: next, subCategory: keepSub ? p.subCategory : "" };
                });
              }}
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
              {subsForMain(s.category).map((sc) => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          </Field>

          <Field label="Company" full>
            <input
              value={s.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="회사명"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>

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
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-mono text-xs text-muted">본문</h2>
              <FormatToggle
                value={s.bodyFormat}
                onChange={(v) => set("bodyFormat", v)}
              />
            </div>
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
                title="이미지·영상을 본문에 첨부합니다"
              >
                📎 파일 첨부
              </button>
              {s.bodyFormat === "markdown" && (
                <button
                  type="button"
                  onClick={() =>
                    insertSnippet(
                      "```html-embed\n<!doctype html>\n<html>\n<head>\n<style>\n  body { font-family: sans-serif; padding: 16px; }\n</style>\n</head>\n<body>\n  <h2>HTML 블록</h2>\n  <p>이 안에서 HTML / CSS / JavaScript 자유롭게 사용할 수 있어요.</p>\n  <script>\n    console.log('embed loaded');\n  </script>\n</body>\n</html>\n```",
                    )
                  }
                  className="rounded-full border border-border px-3 py-1 text-xs font-mono hover:border-foreground transition"
                  title="현재 커서 위치에 HTML/CSS/JS 블록을 삽입합니다"
                >
                  {"</> HTML 블록"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setTableInsertTarget({ mode: "cursor" });
                  setTableModal(true);
                }}
                className="rounded-full border border-border px-3 py-1 text-xs font-mono hover:border-foreground transition"
                title="행과 열을 정해 빈 표를 삽입합니다"
              >
                📊 표 삽입
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
              placeholder={
                s.bodyFormat === "markdown"
                  ? "마크다운으로 글을 작성하세요. 이미지·GIF·영상은 드래그하거나 붙여넣기하면 바로 들어갑니다."
                  : "전체 HTML 문서를 작성하세요. <style> 과 <script> 모두 사용 가능합니다.\n예) <!doctype html><html><head><style>body{font-family:sans-serif}</style></head><body><h1>Hello</h1><script>console.log('hi')</script></body></html>"
              }
              className={`block w-full resize-y rounded-xl border bg-card px-4 py-3 text-sm leading-relaxed outline-none transition ${
                s.bodyFormat === "html" ? "font-mono" : ""
              } ${
                dragOver
                  ? "border-accent bg-accent/5"
                  : "border-border focus:border-foreground"
              }`}
            />
            <p className="mt-2 font-mono text-[11px] text-muted">
              {s.bodyFormat === "markdown" ? (
                <>이미지·GIF를 위로 끌어다 놓거나 붙여넣기(⌘V)하면 자동으로 GitHub에 업로드됩니다.</>
              ) : (
                <>HTML/CSS/JS 모드 — 이미지·영상을 끌어다 놓거나 붙여넣기(⌘V)도 가능합니다. sandbox iframe 안에서 실행됩니다.</>
              )}
              {imageUploading && <span className="ml-2 text-accent">⏳ 이미지 업로드 중…</span>}
            </p>
          </div>

          <div style={{ display: bodyTab === "preview" ? "block" : "none" }}>
            {s.bodyFormat === "html" && s.body.trim() && (
              <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
                <p className="font-mono text-[11px] text-muted">
                  {wysiwyg
                    ? <>미리보기에서 직접 텍스트를 편집 중입니다. 완료하면 <span className="text-accent">편집 완료</span>를 누르세요.</>
                    : <><span className="text-accent">아무 요소</span>나 클릭 → 이미지/영상 삽입·교체·삭제. 직접 편집 버튼으로 텍스트도 수정할 수 있습니다.</>
                  }
                  {imageUploading && <span className="ml-2 text-accent">⏳ 업로드 중…</span>}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWysiwyg((v) => !v)}
                    className={`rounded-full border px-3 py-1 text-xs font-mono transition ${
                      wysiwyg
                        ? "bg-accent border-accent text-white hover:opacity-90"
                        : "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
                    }`}
                  >
                    {wysiwyg ? "✓ 편집 완료" : "✏ 직접 편집"}
                  </button>
                  {!wysiwyg && (
                    <button
                      type="button"
                      onClick={() => previewImageInputRef.current?.click()}
                      className="rounded-full border border-accent/40 bg-accent/10 text-accent px-3 py-1 text-xs font-mono hover:bg-accent/20 transition"
                    >
                      + 이미지/영상 추가
                    </button>
                  )}
                </div>
                <input
                  ref={previewImageInputRef}
                  type="file"
                  accept="image/*,video/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) await appendImageToHtmlBody(file);
                  }}
                />
              </div>
            )}
            <div className="rounded-xl border border-border bg-card px-6 py-5 min-h-[24rem]">
              {s.body.trim() ? (
                <BodyView
                  source={s.body}
                  format={s.bodyFormat}
                  editorMode={s.bodyFormat === "html"}
                  wysiwyg={wysiwyg && s.bodyFormat === "html"}
                  onContentChange={(html) => set("body", html)}
                  onIframeReady={(el) => {
                    iframeRef.current = el;
                  }}
                />
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
            disabled={pushing}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition"
          >
            {pushing ? "저장 중…" : uploaded ? "업로드 갱신" : "업로드"}
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
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-red-500/40 px-4 py-2 text-xs font-mono text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition"
            >
              삭제
            </button>
          )}
        </div>

        {saveError && (
          <p className="mt-3 font-mono text-xs text-red-500">{saveError}</p>
        )}
        {pushStatus === "success" && (
          <p className="mt-3 font-mono text-xs text-green-600 dark:text-green-400">
            ✓ 파일에 저장됨 — git push 하면 배포됩니다.
          </p>
        )}
        {pushStatus === "error" && pushError && (
          <p className="mt-3 font-mono text-xs text-red-500">GitHub 오류: {pushError}</p>
        )}

        <p className="mt-4 font-mono text-[11px] text-muted">
          업로드 시 로컬 파일에 저장됩니다. git push 하면 배포됩니다.
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

function FormatToggle({
  value,
  onChange,
}: {
  value: "markdown" | "html";
  onChange: (v: "markdown" | "html") => void;
}) {
  const options: { value: "markdown" | "html"; label: string }[] = [
    { value: "markdown", label: "Markdown" },
    { value: "html", label: "HTML / CSS / JS" },
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
              ? "bg-accent text-white"
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
  const parts = value ? value.split("-") : ["", ""];
  const y = parts[0] ?? "";
  const m = parts[1] ?? "";
  const thisYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = thisYear + 2; i >= thisYear - 25; i--) years.push(String(i));
  const months = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );

  function emit(ny: string, nm: string) {
    if (!ny) return onChange("");
    if (ny && !nm) return onChange(ny);
    return onChange(`${ny}-${nm}`);
  }

  const cls =
    "rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Year"
        value={y}
        onChange={(e) => emit(e.target.value, m)}
        className={cls}
      >
        <option value="">년</option>
        {years.map((yy) => (
          <option key={yy} value={yy}>{yy}</option>
        ))}
      </select>
      <select
        aria-label="Month"
        value={m}
        onChange={(e) => emit(y, e.target.value)}
        className={cls}
      >
        <option value="">월</option>
        {months.map((mm) => (
          <option key={mm} value={mm}>{parseInt(mm, 10)}</option>
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

function ImageOptionsModal({
  src,
  filename,
  onInsert,
  onCancel,
}: {
  src: string;
  filename: string;
  onInsert: (html: string) => void;
  onCancel: () => void;
}) {
  const [size, setSize] = React.useState<25 | 50 | 75 | 100>(100);
  const [align, setAlign] = React.useState<"left" | "center" | "right">("center");

  function buildHtml() {
    if (align === "center") {
      return `<img src="${src}" alt="${filename}" style="display:block;margin:0 auto;width:${size}%;max-width:100%;" />`;
    }
    const margin = align === "left" ? "0 1.5rem 1rem 0" : "0 0 1rem 1.5rem";
    return `<img src="${src}" alt="${filename}" style="float:${align};margin:${margin};width:${size}%;max-width:${size}%;" />`;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold mb-4">이미지 삽입 옵션</h3>

        <div className="mb-4 rounded-lg border border-border overflow-hidden bg-background flex items-center justify-center h-28">
          <img src={src} alt={filename} className="max-h-full max-w-full object-contain" />
        </div>

        <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">크기</p>
        <div className="flex gap-2 mb-4">
          {([25, 50, 75, 100] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`flex-1 rounded-md border py-1.5 text-xs font-mono transition ${
                size === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
              }`}
            >
              {s}%
            </button>
          ))}
        </div>

        <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">정렬</p>
        <div className="flex gap-2 mb-6">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAlign(a)}
              className={`flex-1 rounded-md border py-1.5 text-xs transition ${
                align === a ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
              }`}
            >
              {a === "left" ? "왼쪽" : a === "center" ? "가운데" : "오른쪽"}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2 text-sm hover:border-foreground transition"
          >
            기본 삽입
          </button>
          <button
            type="button"
            onClick={() => onInsert(buildHtml())}
            className="rounded-full bg-foreground text-background px-5 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            삽입
          </button>
        </div>
      </div>
    </div>
  );
}

function ElementEditModal({
  edit,
  onReplace,
  onDelete,
  onInsert,
  onInsertTable,
  onDeleteTable,
  onInsertRow,
  onDeleteRow,
  onInsertCol,
  onDeleteCol,
  onDeleteVideo,
  onCancel,
}: {
  edit: {
    path: number[];
    tagPath: string[];
    isImg: boolean;
    isVideo: boolean;
    imgIndex: number;
    imgSrc: string;
    inTable: boolean;
    tablePath: number[] | null;
    cellRowIdx: number;
    cellColIdx: number;
  };
  onReplace: (file: File) => void | Promise<void>;
  onDelete: () => void;
  onInsert: (
    file: File,
    position: "before" | "after",
    size: 25 | 50 | 75 | 100,
    align: "left" | "center" | "right",
  ) => void | Promise<void>;
  onInsertTable: (position: "before" | "after") => void;
  onDeleteTable: () => void;
  onInsertRow: (position: "before" | "after") => void;
  onDeleteRow: () => void;
  onInsertCol: (position: "before" | "after") => void;
  onDeleteCol: () => void;
  onDeleteVideo: () => void;
  onCancel: () => void;
}) {
  const [size, setSize] = React.useState<25 | 50 | 75 | 100>(100);
  const [align, setAlign] = React.useState<"left" | "center" | "right">("center");
  const replaceRef = useRef<HTMLInputElement | null>(null);
  const beforeRef = useRef<HTMLInputElement | null>(null);
  const afterRef = useRef<HTMLInputElement | null>(null);

  const breadcrumb = edit.tagPath.length > 0 ? edit.tagPath.join(" › ") : "(root)";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold mb-2">
          {edit.isImg ? "이미지 편집 / 추가" : edit.isVideo ? "영상 편집 / 추가" : "이미지·영상 추가"}
        </h3>
        <p className="font-mono text-[11px] text-muted mb-5 break-words">
          위치: <span className="text-accent">{breadcrumb}</span>
        </p>

        {edit.isImg && edit.imgSrc && (
          <div className="mb-5 rounded-lg border border-border overflow-hidden bg-background flex items-center justify-center h-32">
            <img src={edit.imgSrc} alt="선택된 이미지" className="max-h-full max-w-full object-contain" />
          </div>
        )}

        <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">크기</p>
        <div className="flex gap-2 mb-4">
          {([25, 50, 75, 100] as const).map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => setSize(sz)}
              className={`flex-1 rounded-md border py-1.5 text-xs font-mono transition ${
                size === sz ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
              }`}
            >
              {sz}%
            </button>
          ))}
        </div>

        <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">정렬</p>
        <div className="flex gap-2 mb-5">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAlign(a)}
              className={`flex-1 rounded-md border py-1.5 text-xs transition ${
                align === a ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
              }`}
            >
              {a === "left" ? "왼쪽" : a === "center" ? "가운데" : "오른쪽"}
            </button>
          ))}
        </div>

        <input ref={replaceRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onReplace(f); }} />
        <input ref={beforeRef} type="file" accept="image/*,video/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onInsert(f, "before", size, align); }} />
        <input ref={afterRef} type="file" accept="image/*,video/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onInsert(f, "after", size, align); }} />

        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">이미지·영상</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => beforeRef.current?.click()}
              className="rounded-full bg-foreground text-background px-3 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              ↑ 이 위에 추가
            </button>
            <button
              type="button"
              onClick={() => afterRef.current?.click()}
              className="rounded-full bg-foreground text-background px-3 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              ↓ 이 아래에 추가
            </button>
          </div>
          {edit.isImg && (
            <>
              <button
                type="button"
                onClick={() => replaceRef.current?.click()}
                className="w-full rounded-full border border-accent/40 bg-accent/10 text-accent px-4 py-2 text-sm font-medium hover:bg-accent/20 transition"
              >
                🔄 이 이미지 교체 (크기/정렬 유지)
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="w-full rounded-full border border-red-500/40 text-red-500 px-4 py-2 text-sm font-medium hover:bg-red-500 hover:text-white hover:border-red-500 transition"
              >
                🗑 이 이미지 삭제
              </button>
            </>
          )}
          {edit.isVideo && (
            <button
              type="button"
              onClick={onDeleteVideo}
              className="w-full rounded-full border border-red-500/40 text-red-500 px-4 py-2 text-sm font-medium hover:bg-red-500 hover:text-white hover:border-red-500 transition"
            >
              🗑 이 영상 삭제
            </button>
          )}

          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            표 {edit.inTable ? (edit.cellRowIdx >= 0 ? "(이 셀 기준)" : "(맨 끝 기준)") : ""}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onInsertTable("before")}
              className="rounded-full border border-border px-3 py-2 text-sm font-medium hover:border-foreground transition"
            >
              📊 표 위에 새 표
            </button>
            <button
              type="button"
              onClick={() => onInsertTable("after")}
              className="rounded-full border border-border px-3 py-2 text-sm font-medium hover:border-foreground transition"
            >
              📊 표 아래에 새 표
            </button>
          </div>

          {edit.inTable && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onInsertRow("before")}
                  className="rounded-full border border-border px-3 py-2 text-sm font-medium hover:border-foreground transition"
                >
                  ↑ 위에 행 추가
                </button>
                <button
                  type="button"
                  onClick={() => onInsertRow("after")}
                  className="rounded-full border border-border px-3 py-2 text-sm font-medium hover:border-foreground transition"
                >
                  ↓ 아래에 행 추가
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onInsertCol("before")}
                  className="rounded-full border border-border px-3 py-2 text-sm font-medium hover:border-foreground transition"
                >
                  ← 왼쪽에 열 추가
                </button>
                <button
                  type="button"
                  onClick={() => onInsertCol("after")}
                  className="rounded-full border border-border px-3 py-2 text-sm font-medium hover:border-foreground transition"
                >
                  → 오른쪽에 열 추가
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onDeleteRow}
                  className="rounded-full border border-red-500/40 text-red-500 px-3 py-2 text-sm font-medium hover:bg-red-500 hover:text-white hover:border-red-500 transition"
                >
                  🗑 행 삭제
                </button>
                <button
                  type="button"
                  onClick={onDeleteCol}
                  className="rounded-full border border-red-500/40 text-red-500 px-3 py-2 text-sm font-medium hover:bg-red-500 hover:text-white hover:border-red-500 transition"
                >
                  🗑 열 삭제
                </button>
              </div>
              <button
                type="button"
                onClick={onDeleteTable}
                className="w-full rounded-full border border-red-500/40 text-red-500 px-4 py-2 text-sm font-medium hover:bg-red-500 hover:text-white hover:border-red-500 transition"
              >
                🗑 표 전체 삭제
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-full border border-border px-4 py-2 text-sm hover:border-foreground transition"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

function TableInsertModal({
  onInsert,
  onCancel,
}: {
  onInsert: (html: string) => void;
  onCancel: () => void;
}) {
  const [rows, setRows] = React.useState(3);
  const [cols, setCols] = React.useState(3);
  const [hasHeader, setHasHeader] = React.useState(true);
  const clamp = (n: number) => Math.max(1, Math.min(20, Math.floor(n) || 1));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold mb-1">표 삽입</h3>
        <p className="font-mono text-[11px] text-muted mb-4">
          행과 열을 정한 뒤 삽입하세요. 셀 내용은 미리보기의 “직접 편집”에서 수정할 수 있습니다.
        </p>

        <div className="mb-5 rounded-lg border border-border bg-background p-3 overflow-x-auto">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
            {hasHeader && (
              <thead>
                <tr>
                  {Array.from({ length: cols }, (_, i) => (
                    <th
                      key={i}
                      style={{
                        border: "1px solid #ccc",
                        padding: "4px 8px",
                        background: "rgba(127,127,127,0.15)",
                        textAlign: "left",
                      }}
                    >
                      제목 {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {Array.from(
                { length: Math.max(0, rows - (hasHeader ? 1 : 0)) },
                (_, r) => (
                  <tr key={r}>
                    {Array.from({ length: cols }, (_, c) => (
                      <td key={c} style={{ border: "1px solid #ccc", padding: "4px 8px" }}>
                        셀
                      </td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1.5">
              행
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRows((r) => clamp(r - 1))}
                className="w-8 h-8 rounded-md border border-border hover:border-foreground text-sm"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={(e) => setRows(clamp(Number(e.target.value)))}
                className="flex-1 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-center outline-none focus:border-foreground"
              />
              <button
                type="button"
                onClick={() => setRows((r) => clamp(r + 1))}
                className="w-8 h-8 rounded-md border border-border hover:border-foreground text-sm"
              >
                +
              </button>
            </div>
          </label>
          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1.5">
              열
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCols((c) => clamp(c - 1))}
                className="w-8 h-8 rounded-md border border-border hover:border-foreground text-sm"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={20}
                value={cols}
                onChange={(e) => setCols(clamp(Number(e.target.value)))}
                className="flex-1 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-center outline-none focus:border-foreground"
              />
              <button
                type="button"
                onClick={() => setCols((c) => clamp(c + 1))}
                className="w-8 h-8 rounded-md border border-border hover:border-foreground text-sm"
              >
                +
              </button>
            </div>
          </label>
        </div>

        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={hasHeader}
            onChange={(e) => setHasHeader(e.target.checked)}
            className="w-4 h-4 accent-orange-500"
          />
          <span className="text-sm">첫 행을 헤더로 사용</span>
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2 text-sm hover:border-foreground transition"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onInsert(buildTableHtml(rows, cols, hasHeader))}
            className="rounded-full bg-foreground text-background px-5 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            삽입
          </button>
        </div>
      </div>
    </div>
  );
}


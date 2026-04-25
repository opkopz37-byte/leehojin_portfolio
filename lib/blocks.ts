export type Block =
  | { id: string; type: "heading"; level: 1 | 2 | 3; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "list"; ordered: boolean; items: string[] }
  | { id: string; type: "quote"; text: string }
  | { id: string; type: "code"; language?: string; code: string }
  | {
      id: string;
      type: "image";
      src: string;
      alt: string;
      caption?: string;
    }
  | {
      id: string;
      type: "video";
      src: string;
      poster?: string;
      caption?: string;
    }
  | { id: string; type: "divider" };

export type BlockType = Block["type"];

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function makeBlock(type: BlockType): Block {
  const id = uid();
  switch (type) {
    case "heading":
      return { id, type, level: 2, text: "" };
    case "paragraph":
      return { id, type, text: "" };
    case "list":
      return { id, type, ordered: false, items: [""] };
    case "quote":
      return { id, type, text: "" };
    case "code":
      return { id, type, code: "" };
    case "image":
      return { id, type, src: "", alt: "" };
    case "video":
      return { id, type, src: "" };
    case "divider":
      return { id, type };
  }
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "제목",
  paragraph: "본문",
  list: "목록",
  quote: "인용",
  code: "코드",
  image: "이미지",
  video: "영상",
  divider: "구분선",
};

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return `${"#".repeat(b.level)} ${b.text}`.trimEnd();
        case "paragraph":
          return b.text;
        case "list":
          return b.items
            .map((it, i) => `${b.ordered ? `${i + 1}.` : "-"} ${it}`)
            .join("\n");
        case "quote":
          return b.text
            .split("\n")
            .map((l) => `> ${l}`)
            .join("\n");
        case "code":
          return `\`\`\`${b.language ?? ""}\n${b.code}\n\`\`\``;
        case "image": {
          const cap = b.caption ? `\n*${b.caption}*` : "";
          return `![${b.alt}](${b.src})${cap}`;
        }
        case "video": {
          const poster = b.poster ? ` poster="${b.poster}"` : "";
          const cap = b.caption ? `\n*${b.caption}*` : "";
          return `<video src="${b.src}" controls playsinline${poster}></video>${cap}`;
        }
        case "divider":
          return `---`;
      }
    })
    .join("\n\n");
}

/**
 * Best-effort parser used when switching from markdown mode to block mode for
 * the first time, so we don't lose structure.
 */
export function markdownToBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const isHr = (l: string) => /^\s*-{3,}\s*$/.test(l);
  const headingRe = /^(#{1,3})\s+(.*)$/;
  const listRe = /^\s*(-|\*|\d+\.)\s+(.*)$/;
  const imageRe = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/;
  const videoRe = /^<video\s+([^>]*)>.*$/i;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    const h = line.match(headingRe);
    if (h) {
      const level = Math.min(3, h[1].length) as 1 | 2 | 3;
      blocks.push({ id: uid(), type: "heading", level, text: h[2].trim() });
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({
        id: uid(),
        type: "code",
        language: lang || undefined,
        code: code.join("\n"),
      });
      continue;
    }

    if (isHr(line)) {
      blocks.push({ id: uid(), type: "divider" });
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        buf.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ id: uid(), type: "quote", text: buf.join("\n") });
      continue;
    }

    if (listRe.test(line)) {
      const items: string[] = [];
      const orderedFirst = /^\s*\d+\./.test(line);
      while (i < lines.length) {
        const m = lines[i].match(listRe);
        if (!m) break;
        items.push(m[2]);
        i++;
      }
      blocks.push({
        id: uid(),
        type: "list",
        ordered: orderedFirst,
        items,
      });
      continue;
    }

    const img = line.match(imageRe);
    if (img) {
      blocks.push({
        id: uid(),
        type: "image",
        alt: img[1],
        src: img[2],
      });
      i++;
      continue;
    }

    const vid = line.match(videoRe);
    if (vid) {
      const attrs = vid[1];
      const src = attrs.match(/src="([^"]+)"/)?.[1] ?? "";
      const poster = attrs.match(/poster="([^"]+)"/)?.[1];
      blocks.push({
        id: uid(),
        type: "video",
        src,
        poster,
      });
      i++;
      continue;
    }

    // paragraph: collect contiguous non-special lines
    const para: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) break;
      if (
        headingRe.test(l) ||
        l.startsWith("```") ||
        isHr(l) ||
        l.startsWith("> ") ||
        listRe.test(l) ||
        imageRe.test(l) ||
        videoRe.test(l)
      )
        break;
      para.push(l);
      i++;
    }
    if (para.length) {
      blocks.push({ id: uid(), type: "paragraph", text: para.join("\n") });
    }
  }

  if (blocks.length === 0) {
    blocks.push({ id: uid(), type: "paragraph", text: "" });
  }
  return blocks;
}

"use client";

import { Media } from "@/components/Media";
import {
  BLOCK_LABELS,
  makeBlock,
  type Block,
  type BlockType,
} from "@/lib/blocks";

const ADDABLE: BlockType[] = [
  "heading",
  "paragraph",
  "list",
  "quote",
  "code",
  "image",
  "video",
  "divider",
];

export default function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
}) {
  function update(i: number, patch: Partial<Block>) {
    onChange(
      blocks.map((b, idx) =>
        idx === i ? ({ ...b, ...patch } as Block) : b,
      ),
    );
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function remove(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i));
  }
  function insertAt(index: number, type: BlockType) {
    const next = [...blocks];
    next.splice(index, 0, makeBlock(type));
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <AddBar onAdd={(t) => insertAt(0, t)} />
      {blocks.map((b, i) => (
        <div key={b.id}>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                {BLOCK_LABELS[b.type]} #{i + 1}
              </span>
              <div className="flex items-center gap-1">
                <IconBtn onClick={() => move(i, -1)} label="up">
                  ↑
                </IconBtn>
                <IconBtn onClick={() => move(i, 1)} label="down">
                  ↓
                </IconBtn>
                <IconBtn onClick={() => remove(i)} label="remove">
                  ×
                </IconBtn>
              </div>
            </div>
            <BlockBody block={b} onChange={(patch) => update(i, patch)} />
          </div>
          <AddBar onAdd={(t) => insertAt(i + 1, t)} compact />
        </div>
      ))}
      {blocks.length === 0 && (
        <p className="text-sm text-muted">
          위 버튼을 눌러 블록을 추가하세요.
        </p>
      )}
    </div>
  );
}

function BlockBody({
  block,
  onChange,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
}) {
  const ta =
    "block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground";
  const inp = ta;

  switch (block.type) {
    case "heading":
      return (
        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <select
            value={block.level}
            onChange={(e) =>
              onChange({ level: parseInt(e.target.value, 10) as 1 | 2 | 3 })
            }
            className={inp}
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input
            value={block.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="제목을 입력하세요"
            className={inp}
          />
        </div>
      );
    case "paragraph":
      return (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="본문 텍스트"
          rows={4}
          className={`${ta} resize-y`}
        />
      );
    case "quote":
      return (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="인용 텍스트"
          rows={3}
          className={`${ta} resize-y`}
        />
      );
    case "list":
      return (
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-mono text-[11px] text-muted">
            <input
              type="checkbox"
              checked={block.ordered}
              onChange={(e) => onChange({ ordered: e.target.checked })}
            />
            ordered (번호 매기기)
          </label>
          <ul className="space-y-1">
            {block.items.map((it, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted w-6 text-right">
                  {block.ordered ? `${i + 1}.` : "•"}
                </span>
                <input
                  value={it}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = e.target.value;
                    onChange({ items });
                  }}
                  className={inp}
                />
                <button
                  type="button"
                  aria-label="remove item"
                  onClick={() => {
                    const items = block.items.filter((_, idx) => idx !== i);
                    onChange({ items: items.length ? items : [""] });
                  }}
                  className="rounded-md border border-border w-7 h-7 flex items-center justify-center text-sm hover:border-foreground transition"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onChange({ items: [...block.items, ""] })}
            className="rounded-full border border-border px-3 py-1 text-xs font-mono hover:border-foreground transition"
          >
            + 항목 추가
          </button>
        </div>
      );
    case "code":
      return (
        <div className="space-y-2">
          <input
            value={block.language ?? ""}
            onChange={(e) => onChange({ language: e.target.value })}
            placeholder="언어 (예: hlsl, ts, py)"
            className={`${inp} font-mono`}
          />
          <textarea
            value={block.code}
            onChange={(e) => onChange({ code: e.target.value })}
            spellCheck={false}
            rows={8}
            placeholder="// code"
            className={`${ta} resize-y font-mono`}
          />
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <input
            value={block.src}
            onChange={(e) => onChange({ src: e.target.value })}
            placeholder="/work/slug/shot.jpg"
            className={`${inp} font-mono`}
          />
          <input
            value={block.alt}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="alt 텍스트"
            className={inp}
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="caption (선택)"
            className={inp}
          />
          {block.src && (
            <Media item={{ type: "image", src: block.src, alt: block.alt }} />
          )}
        </div>
      );
    case "video":
      return (
        <div className="space-y-2">
          <input
            value={block.src}
            onChange={(e) => onChange({ src: e.target.value })}
            placeholder="/work/slug/clip.mp4"
            className={`${inp} font-mono`}
          />
          <input
            value={block.poster ?? ""}
            onChange={(e) => onChange({ poster: e.target.value })}
            placeholder="poster (선택)"
            className={`${inp} font-mono`}
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="caption (선택)"
            className={inp}
          />
          {block.src && (
            <Media
              item={{
                type: "video",
                src: block.src,
                poster: block.poster,
              }}
            />
          )}
        </div>
      );
    case "divider":
      return <hr className="border-border" />;
  }
}

function AddBar({
  onAdd,
  compact = false,
}: {
  onAdd: (t: BlockType) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap gap-1.5 ${compact ? "py-1.5 opacity-60 hover:opacity-100 transition" : ""}`}
    >
      {ADDABLE.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onAdd(t)}
          className="rounded-full border border-dashed border-border px-3 py-1 text-[11px] font-mono text-muted hover:text-foreground hover:border-foreground transition"
        >
          + {BLOCK_LABELS[t]}
        </button>
      ))}
    </div>
  );
}

function IconBtn({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-md border border-border bg-background w-7 h-7 flex items-center justify-center text-sm hover:border-foreground transition"
    >
      {children}
    </button>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type TocHeading = {
  id: string;
  text: string;
  level: number;
  top: number;
};

type Props = {
  headings: TocHeading[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

type LabelInfo = { label: string; depth: number };

function buildLabelInfos(headings: TocHeading[], minLevel: number): LabelInfo[] {
  function toDepth(level: number): number {
    if (minLevel <= 2) return Math.max(0, level - 2);
    return level - minLevel;
  }

  const counters: number[] = [];
  return headings.map((h) => {
    const d = toDepth(h.level);
    while (counters.length <= d) counters.push(0);
    counters[d]++;
    counters.length = d + 1;
    return {
      label: counters.slice(0, d + 1).map(String).join("-"),
      depth: d,
    };
  });
}

export default function PostToc({ headings, activeId, onSelect }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);
  const desktopListRef = useRef<HTMLUListElement | null>(null);
  const desktopItemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [fillHeight, setFillHeight] = useState(0);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const activeIndex = useMemo(
    () => headings.findIndex((h) => h.id === activeId),
    [headings, activeId],
  );

  useEffect(() => {
    function recompute() {
      if (activeIndex < 0) {
        setFillHeight(0);
        return;
      }
      const el = desktopItemRefs.current[activeIndex];
      if (!el) {
        setFillHeight(0);
        return;
      }
      setFillHeight(el.offsetTop + el.offsetHeight);
    }
    recompute();
    const aside = asideRef.current;
    if (!aside || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(recompute);
    ro.observe(aside);
    return () => ro.disconnect();
  }, [activeIndex, headings]);


  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));
  const labelInfos = buildLabelInfos(headings, minLevel);
  const currentLabel =
    activeIndex >= 0 ? headings[activeIndex].text : "목차 보기";

  function handleSelect(id: string) {
    onSelect(id);
    setMobileOpen(false);
  }

  return (
    <>
      <aside
        ref={asideRef}
        className="hidden lg:block sticky top-24 self-start w-64 shrink-0 max-h-[calc(100vh-7rem)] overflow-y-auto pr-4 pb-8"
      >
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted mb-3">
          On this page
        </h3>
        <nav aria-label="목차" className="relative">
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-px bg-border"
          />
          <span
            aria-hidden
            className="absolute left-0 top-0 w-[2px] -ml-px bg-accent transition-[height] duration-300 ease-out"
            style={{ height: `${fillHeight}px` }}
          />
          <ul ref={desktopListRef} className="text-sm leading-snug">
            {headings.map((h, i) => {
              const active = activeId === h.id;
              const info = labelInfos[i];
              return (
                <li
                  key={h.id}
                  ref={(el) => {
                    desktopItemRefs.current[i] = el;
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(h.id)}
                    style={{ paddingLeft: `${info.depth * 12 + 14}px` }}
                    className={`flex w-full items-baseline gap-2 py-[6px] pr-2 text-left text-sm leading-snug transition-[color,font-weight,transform] duration-200 ease-out
                      hover:translate-x-0.5
                      focus-visible:outline-none
                      ${
                        active
                          ? "text-accent font-semibold"
                          : "text-muted hover:text-foreground hover:font-medium"
                      }`}
                    title={h.text}
                  >
                    <span
                      className={`font-mono text-[10px] tabular-nums shrink-0 min-w-[2.75rem] text-right transition-colors ${
                        active ? "text-accent" : "text-muted/70"
                      }`}
                    >
                      {info.label}
                    </span>
                    <span className="truncate">{h.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="목차 열기"
        className="lg:hidden fixed z-40 right-5 bottom-[8.5rem] flex items-center gap-2 max-w-[70vw] rounded-full border border-border bg-card/95 backdrop-blur pl-3 pr-4 py-2 text-xs hover:bg-foreground hover:text-background hover:border-foreground transition shadow-md"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="shrink-0"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="16" y2="12" />
          <line x1="4" y1="18" x2="18" y2="18" />
        </svg>
        <span className="truncate font-medium">
          {activeIndex >= 0
            ? `${labelInfos[activeIndex].label} · ${currentLabel}`
            : currentLabel}
        </span>
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto bg-background border-t border-border rounded-t-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-background border-b border-border">
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted">
                On this page
              </h3>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="목차 닫기"
                className="w-8 h-8 -mr-2 inline-flex items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-foreground/5 transition"
              >
                ✕
              </button>
            </div>
            <ul className="px-5 py-4 space-y-1 text-sm">
              {headings.map((h, i) => {
                const active = activeId === h.id;
                const info = labelInfos[i];
                return (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(h.id)}
                      style={{
                        paddingLeft: `${info.depth * 14 + 12}px`,
                      }}
                      className={`flex w-full items-baseline gap-2 py-2 pr-2 rounded text-left transition-colors leading-snug ${
                        active
                          ? "text-accent font-medium bg-accent/5"
                          : "text-muted hover:text-foreground hover:bg-foreground/5"
                      }`}
                    >
                      <span
                        className={`font-mono text-[10px] tabular-nums shrink-0 min-w-[2.75rem] text-right ${
                          active ? "text-accent" : "text-muted/70"
                        }`}
                      >
                        {info.label}
                      </span>
                      <span className="flex-1">{h.text}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

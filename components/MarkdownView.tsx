"use client";

import { useEffect, useRef } from "react";
import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownView({
  source,
  className = "",
}: {
  source: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const html = renderMarkdown(source);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; h?: number } | null;
      if (!data || data.type !== "embed-height" || typeof data.h !== "number") return;
      const root = containerRef.current;
      if (!root) return;
      const iframes = root.querySelectorAll<HTMLIFrameElement>("iframe[data-html-embed]");
      iframes.forEach((frame) => {
        if (frame.contentWindow === e.source) {
          frame.style.height = `${data.h}px`;
        }
      });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

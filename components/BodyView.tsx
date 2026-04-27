"use client";

import { useEffect, useRef, useState } from "react";
import MarkdownView from "@/components/MarkdownView";

type Props = {
  source: string;
  format?: "markdown" | "html";
  className?: string;
};

/** Posts authored before bodyFormat existed may contain a full HTML document.
 *  Detect that and render in the sandbox so it doesn't blow up the page DOM. */
function detectFormat(source: string): "markdown" | "html" {
  const head = source.trimStart().slice(0, 200).toLowerCase();
  if (head.startsWith("<!doctype html") || head.startsWith("<html")) return "html";
  return "markdown";
}

export default function BodyView({ source, format, className = "" }: Props) {
  const resolved = format ?? detectFormat(source);
  if (resolved === "html") {
    return <HtmlSandbox source={source} className={className} />;
  }
  return <MarkdownView source={source} className={className} />;
}

function HtmlSandbox({ source, className }: { source: string; className: string }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(480);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const el = iframe;
    function resize() {
      try {
        const doc = el.contentDocument;
        if (!doc) return;
        const next = Math.max(
          doc.documentElement.scrollHeight,
          doc.body?.scrollHeight ?? 0,
        );
        if (next > 0) setHeight(next);
      } catch {}
    }

    el.addEventListener("load", resize);
    const interval = setInterval(resize, 500);
    return () => {
      el.removeEventListener("load", resize);
      clearInterval(interval);
    };
  }, [source]);

  return (
    <iframe
      ref={iframeRef}
      title="post-content"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      srcDoc={source}
      className={`block w-full border-0 ${className}`}
      style={{ height }}
    />
  );
}

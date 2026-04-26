"use client";

import { useEffect, useState } from "react";

export default function ScrollButtons() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed right-5 bottom-20 z-50 flex flex-col gap-2 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="맨 위로"
        className="w-9 h-9 flex items-center justify-center rounded-full border border-border bg-card text-sm hover:bg-foreground hover:text-background hover:border-foreground transition"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
        aria-label="맨 아래로"
        className="w-9 h-9 flex items-center justify-center rounded-full border border-border bg-card text-sm hover:bg-foreground hover:text-background hover:border-foreground transition"
      >
        ↓
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { listDrafts, type Draft } from "./draftStorage";

export function useDrafts(): Draft[] {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    const sync = () => setDrafts(listDrafts());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("portfolio-drafts-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("portfolio-drafts-changed", sync);
    };
  }, []);

  return drafts;
}

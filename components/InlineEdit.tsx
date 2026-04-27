"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  className?: string;
};

export default function InlineEdit({ value, onSave, multiline = false, className = "" }: Props) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setVal(value ?? ""); }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      taRef.current?.focus();
    }
  }, [editing]);

  function save() {
    onSave(val.trim() || value);
    setEditing(false);
  }
  function cancel() {
    setVal(value);
    setEditing(false);
  }

  if (editing) {
    const shared = {
      value: val,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setVal(e.target.value),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Escape") { e.preventDefault(); cancel(); }
        if (!multiline && e.key === "Enter") { e.preventDefault(); save(); }
        if (multiline && e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); }
      },
      className: `bg-card border border-accent rounded px-2 py-1 outline-none resize-y w-full text-foreground`,
    };
    return multiline ? (
      <textarea ref={taRef} rows={Math.max(4, val.split("\n").length + 1)} onBlur={save} {...shared} />
    ) : (
      <input ref={inputRef} onBlur={save} {...shared} />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className={`group/ie relative cursor-text outline-none ${multiline ? "block whitespace-pre-wrap" : "inline-block"} ${className}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setEditing(true); }}
      title="클릭하여 편집"
    >
      {value}
      <span className="pointer-events-none ml-1.5 opacity-0 group-hover/ie:opacity-60 text-accent text-xs font-mono transition-opacity select-none">
        ✎
      </span>
    </span>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { isAdmin, tryLogin, adminLogout } from "@/lib/auth";

export default function AdminBar() {
  const [admin, setAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAdmin(isAdmin());
  }, []);

  useEffect(() => {
    if (open) {
      setPw("");
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (tryLogin(pw)) {
      setAdmin(true);
      setOpen(false);
    } else {
      setError(true);
    }
  }

  function handleLogout() {
    adminLogout();
    setAdmin(false);
    setOpen(false);
  }

  return (
    <>
      {/* Floating lock button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={admin ? "관리자 메뉴" : "관리자 로그인"}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-sm shadow-md hover:border-foreground transition"
      >
        {admin ? "✏️" : "🔒"}
      </button>

      {/* Dropdown / modal */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-end p-6 sm:items-center sm:justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-foreground/5 transition"
            >
              ×
            </button>
            {admin ? (
              <>
                <p className="font-mono text-xs text-accent mb-4">관리자 모드 활성화됨</p>
                <p className="text-sm text-muted mb-6">
                  현재 글쓰기·수정·삭제 권한이 있습니다.
                  <br />세션이 끝나면 자동으로 해제됩니다.
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-full border border-border px-4 py-2 text-sm hover:border-foreground transition"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <p className="font-mono text-xs text-muted mb-4">관리자 로그인</p>
                <form onSubmit={handleLogin} className="space-y-3">
                  <input
                    ref={inputRef}
                    type="password"
                    value={pw}
                    onChange={(e) => { setPw(e.target.value); setError(false); }}
                    placeholder="비밀번호"
                    className={`w-full rounded-md border px-3 py-2 text-sm bg-background outline-none transition ${
                      error ? "border-red-500" : "border-border focus:border-foreground"
                    }`}
                  />
                  {error && (
                    <p className="font-mono text-[11px] text-red-500">비밀번호가 틀렸습니다.</p>
                  )}
                  <button
                    type="submit"
                    className="w-full rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                  >
                    로그인
                  </button>
                </form>
                <p className="mt-3 font-mono text-[10px] text-muted/60 text-center">
                  .env.local의 NEXT_PUBLIC_ADMIN_KEY로 설정
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

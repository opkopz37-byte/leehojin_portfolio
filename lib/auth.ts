"use client";

const SESSION_KEY = "portfolio.admin.v1";
const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";

function dispatch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("admin-state-changed"));
  }
}

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function tryLogin(password: string): boolean {
  if (!PASSWORD || password !== PASSWORD) return false;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
    dispatch();
    return true;
  } catch {
    return false;
  }
}

export function adminLogout(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    dispatch();
  } catch { /* */ }
}

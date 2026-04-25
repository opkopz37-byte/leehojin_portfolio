"use client";

import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/auth";

export function useAdmin(): boolean {
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    setAdmin(isAdmin());
    const update = () => setAdmin(isAdmin());
    window.addEventListener("admin-state-changed", update);
    return () => window.removeEventListener("admin-state-changed", update);
  }, []);

  return admin;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProjectForm from "@/components/ProjectForm";
import { isAdmin } from "@/lib/auth";

export default function NewWorkPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAdmin()) {
      setReady(true);
    } else {
      router.replace("/work");
    }
  }, [router]);

  if (!ready) return null;
  return <ProjectForm mode="new" />;
}

"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ThemeSync() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        const color = profile?.themeColor || "#3b82f6";
        document.documentElement.style.setProperty("--theme-accent", color);
      })
      .catch(() => {});
  }, [status]);

  return null;
}

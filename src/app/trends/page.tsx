"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import RightSidebarModals from "@/components/RightSidebarModals";

export default function TrendsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [activeModal, setActiveModal] = useState<"trends" | "settings" | null>("trends");

  useEffect(() => {
    fetch("/api/hashtags/trending")
      .then((r) => r.json())
      .then((d) => setTags(d || []))
      .catch(() => setTags([]));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onTrendsClick={() => setActiveModal("trends")} onSettingsClick={() => setActiveModal("settings")} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-gray-500 text-center">Trendleri görmek için yukarıdaki Trendler butonuna tıklayın</p>
        </div>
      </main>
      <RightSidebarModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}

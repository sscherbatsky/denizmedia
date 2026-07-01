"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function TrendsPage() {
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([]);

  useEffect(() => {
    fetch("/api/hashtags/trending")
      .then((r) => r.json())
      .then((d) => setTags(d || []))
      .catch(() => setTags([]));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-3">Trendler</h2>
          <div className="space-y-2">
            {tags.length === 0 && <div className="text-gray-400">Henüz trend yok.</div>}
            {tags.map((t) => (
              <Link key={t.tag} href={`/tags/${encodeURIComponent(t.tag)}`} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                <div className="text-sm text-gray-800">#{t.tag}</div>
                <div className="text-xs text-gray-500">{t.count}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

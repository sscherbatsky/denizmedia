"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Hashtag {
  tag: string;
  count: number;
}

interface RightSidebarModalsProps {
  activeModal: "trends" | "settings" | null;
  onClose: () => void;
}

export default function RightSidebarModals({ activeModal, onClose }: RightSidebarModalsProps) {
  const [trends, setTrends] = useState<Hashtag[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);

  useEffect(() => {
    if (activeModal === "trends") {
      setTrendsLoading(true);
      fetch("/api/hashtags/trending")
        .then((r) => r.json())
        .then((data) => setTrends(Array.isArray(data) ? data : []))
        .finally(() => setTrendsLoading(false));
    }
  }, [activeModal]);

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg overflow-y-auto z-50 animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">
            {activeModal === "trends" ? "🔥 Trendler" : "⚙️ Ayarlar"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeModal === "trends" && (
            <div className="space-y-2">
              {trendsLoading ? (
                <div className="text-center text-gray-400 py-8">Yükleniyor...</div>
              ) : trends.length === 0 ? (
                <div className="text-center text-gray-400 py-8">Henüz trend yok</div>
              ) : (
                trends.map((trend) => (
                  <Link
                    key={trend.tag}
                    href={`/tags/${encodeURIComponent(trend.tag)}`}
                    onClick={onClose}
                    className="block p-3 hover:bg-gray-50 rounded-lg transition"
                  >
                    <div className="font-medium text-blue-600">#{trend.tag}</div>
                    <div className="text-xs text-gray-500">{trend.count} gönderi</div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeModal === "settings" && (
            <div className="space-y-3">
              <Link
                href="/settings"
                onClick={onClose}
                className="block p-3 hover:bg-gray-50 rounded-lg transition font-medium text-gray-900"
              >
                Hesap Ayarları
              </Link>
              <Link
                href="/profile"
                onClick={onClose}
                className="block p-3 hover:bg-gray-50 rounded-lg transition font-medium text-gray-900"
              >
                Profilim
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

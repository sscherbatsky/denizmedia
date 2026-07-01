"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

interface ShortItem {
  id: string;
  videoUrl: string;
  createdAt: string;
  author: {
    username: string;
    displayName: string | null;
  };
}

export default function ShortsPage() {
  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchShorts = async () => {
    const res = await fetch("/api/shorts");
    if (res.ok) setShorts(await res.json());
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    const fd = new FormData();
    fd.append('file', f);
    setUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (res.ok && j.url) {
        const saveRes = await fetch("/api/shorts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: j.url }),
        });
        const saved = await saveRes.json();
        if (!saveRes.ok) {
          setError(saved?.error || "Shorts kaydedilemedi.");
          return;
        }
        setShorts((prev) => [saved, ...prev]);
      } else {
        const err = j?.error || j?.message || 'Yükleme başarısız';
        setError(err + (j?.details ? ` — ${j.details}` : ""));
        console.error('Upload error:', j);
      }
    } catch (err) {
      console.error('Upload exception', err);
      setError('Yükleme hatası.');
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Shorts</h1>
        <p className="text-gray-600 mb-4">Kısa videonu yükle. MP4, WebM ve MOV desteklenir.</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>}

        <div className="flex items-center gap-3 mb-4">
          <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl cursor-pointer">
            <span>📁</span>
            <span className="text-sm">Video Yükle</span>
            <input type="file" accept="video/mp4,video/webm,video/quicktime,video/*" className="hidden" onChange={handleFile} />
          </label>
          {uploading && <span className="text-sm text-gray-500">Yükleniyor...</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shorts.map((short) => (
            <div key={short.id} className="rounded-lg overflow-hidden bg-black border border-gray-200">
              <video src={short.videoUrl} controls className="w-full aspect-[9/16] max-h-[560px] object-cover" />
              <div className="bg-white px-3 py-2 text-sm text-gray-600">
                @{short.author.displayName || short.author.username}
              </div>
            </div>
          ))}
          {shorts.length === 0 && (
            <div className="col-span-full bg-white border border-gray-200 rounded-xl h-40 flex items-center justify-center text-gray-500">
              Henüz shorts yok.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

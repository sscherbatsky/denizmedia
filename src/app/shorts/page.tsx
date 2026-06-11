"use client";

import { useState } from "react";

export default function ShortsPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    setUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (res.ok && j.url) {
        setVideoUrl(j.url);
      } else {
        alert(j.error || 'Yükleme başarısız');
      }
    } catch (e) {
      alert('Yükleme hatası');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Shorts — Kısa Videolar</h1>
      <p className="text-gray-600 mb-4">Kısa videonu yükle (MP4/WebM). Videoların otomatik olarak oynatılacağı bir önizleme gösterilecek.</p>

      <div className="flex items-center gap-3 mb-4">
        <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl cursor-pointer">
          <span>📁</span>
          <span className="text-sm">Video Yükle</span>
          <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
        </label>
        {uploading && <span className="text-sm text-gray-500">Yükleniyor...</span>}
      </div>

      {videoUrl ? (
        <div className="rounded-lg overflow-hidden bg-black">
          <video src={videoUrl} controls className="w-full h-60 object-cover" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center">Örnek kısa video 1</div>
          <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center">Örnek kısa video 2</div>
        </div>
      )}
    </div>
  );
}

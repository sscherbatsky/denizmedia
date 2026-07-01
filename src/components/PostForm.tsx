"use client";

import { useState, useRef } from "react";

interface PostFormProps {
  onPostCreated: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playPostSound = () => {
    try {
      const audio = new Audio("/sounds/post.wav");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch {}
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    setError("");
    setLoading(true);

    try {
      let imageUrl = "";
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) imageUrl = uploadData.url;
        else {
          console.error("Upload error:", uploadData);
          setError(uploadData.error || "Fotoğraf yüklenemedi.");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, image: imageUrl || undefined }),
      });

      if (res.ok) {
        playPostSound();
        setContent("");
        removeImage();
        onPostCreated();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Gönderi paylaşılamadı.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <form onSubmit={handleSubmit}>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mb-3">{error}</div>}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Neler düşünüyorsun?"
          maxLength={500}
          rows={3}
          className="w-full bg-transparent text-gray-900 border-none outline-none resize-none text-sm placeholder:text-gray-400"
        />

        {imagePreview && (
          <div className="relative mt-2 rounded-xl overflow-hidden">
            <img src={imagePreview} alt="Önizleme" className="max-h-64 rounded-xl object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm transition"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition"
              title="Fotoğraf Ekle"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <span className="text-gray-400 text-xs">{content.length}/500</span>
          </div>

          <button
            type="submit"
            disabled={loading || (!content.trim() && !imageFile)}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-5 py-2 rounded-full text-sm font-medium transition shadow-sm"
          >
            {loading ? "Paylaşılıyor..." : "Paylaş"}
          </button>
        </div>
      </form>
    </div>
  );
}

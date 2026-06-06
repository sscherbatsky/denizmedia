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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setLoading(true);

    try {
      let imageUrl = "";
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) imageUrl = uploadData.url;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, image: imageUrl || undefined }),
      });

      if (res.ok) {
        setContent("");
        removeImage();
        onPostCreated();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Neler düşünüyorsun?"
          maxLength={500}
          rows={3}
          className="w-full bg-transparent text-white border-none outline-none resize-none text-sm placeholder:text-gray-500"
        />

        {imagePreview && (
          <div className="relative mt-2 rounded-xl overflow-hidden">
            <img src={imagePreview} alt="Önizleme" className="max-h-64 rounded-xl object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm transition"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-blue-400 p-2 rounded-lg hover:bg-gray-800/50 transition"
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
            <span className="text-gray-500 text-xs">{content.length}/500</span>
          </div>

          <button
            type="submit"
            disabled={loading || (!content.trim() && !imageFile)}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition"
          >
            {loading ? "Paylaşılıyor..." : "Paylaş"}
          </button>
        </div>
      </form>
    </div>
  );
}

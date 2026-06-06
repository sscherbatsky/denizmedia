"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface PostFormProps {
  onPost: (post: Record<string, unknown>) => void;
}

export default function PostForm({ onPost }: PostFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const post = await res.json();
        onPost(post);
        setContent("");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {session.user?.username?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ne düşünüyorsun?"
            className="w-full bg-transparent text-white placeholder-gray-500 resize-none border-none focus:outline-none text-sm min-h-[60px]"
            maxLength={500}
          />
          <div className="flex items-center justify-between border-t border-gray-800 pt-3 mt-2">
            <span className={`text-xs ${content.length > 450 ? "text-red-400" : "text-gray-500"}`}>
              {content.length}/500
            </span>
            <button
              type="submit"
              disabled={!content.trim() || loading}
              className="bg-blue-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Gönderiliyor..." : "Paylaş"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

import React from "react";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";

interface Props {
  params: { tag: string };
}

export default async function TagPage({ params }: Props) {
  const tag = decodeURIComponent(params.tag);
  const res = await fetch(`/api/hashtags/${encodeURIComponent(tag)}/posts`, { next: { revalidate: 30 } });
  const posts = await res.json().catch(() => []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-3">#{tag}</h2>
          <div className="space-y-3">
            {posts.length === 0 && <div className="text-gray-400">Bu hashtag ile ilgili gönderi yok.</div>}
            {posts.map((p: any) => (
              <PostCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

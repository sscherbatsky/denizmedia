import React from "react";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";

interface Props { params: { id: string } }

export default async function PostPage({ params }: Props) {
  const { id } = params;
  const res = await fetch(`/api/posts/${id}`);
  const post = await res.json().catch(() => null);

  if (!post) return <div className="min-h-screen"><Navbar /><div className="max-w-2xl mx-auto px-4 py-6">Gönderi bulunamadı.</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <PostCard {...post} />
        </div>
      </main>
    </div>
  );
}

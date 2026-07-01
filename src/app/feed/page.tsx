"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import PostForm from "@/components/PostForm";
import RightSidebarModals from "@/components/RightSidebarModals";

interface Post {
  id: string;
  content: string;
  image?: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    profileImage: string | null;
    isVerified: boolean;
  };
  likes: { userId: string }[];
  comments: { id: string }[];
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<"trends" | "settings" | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gönderiler yüklenirken hata:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetchPosts();
    }
  }, [status, router, fetchPosts]);

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onTrendsClick={() => setActiveModal("trends")} onSettingsClick={() => setActiveModal("settings")} />
      <main className="max-w-2xl mx-auto px-4 py-6 page-transition">
        <PostForm onPostCreated={fetchPosts} />
        <div className="mt-4 space-y-3">
          {posts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <p className="text-lg">Henüz gönderi yok</p>
              <p className="text-sm mt-1">İlk gönderiyi sen paylaş!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} {...post} onDelete={handleDelete} />
            ))
          )}
        </div>
      </main>
      <RightSidebarModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}

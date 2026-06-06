"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import PostForm from "@/components/PostForm";

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

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/admin/init");
      fetchPosts();
    }
  }, [status, router, fetchPosts]);

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <PostForm onPostCreated={fetchPosts} />
        <div className="mt-4 space-y-3">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
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
    </div>
  );
}

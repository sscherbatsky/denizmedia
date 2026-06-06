"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  profileImage: string | null;
  isVerified: boolean;
  createdAt: string;
  isFollowing: boolean;
  _count: { posts: number; followers: number; following: number };
}

interface Post {
  id: string;
  content: string;
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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      Promise.all([
        fetch(`/api/users/${username}`).then((r) => r.json()),
        fetch(`/api/users/${username}/posts`).then((r) => r.json()),
      ]).then(([userData, postsData]) => {
        if (userData.error) {
          router.push("/feed");
          return;
        }
        setUser(userData);
        setFollowing(userData.isFollowing);
        setPosts(postsData);
        setLoading(false);
      });
    }
  }, [status, username, router]);

  const handleFollow = async () => {
    const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
    const data = await res.json();
    setFollowing(data.following);
    if (user) {
      setUser({
        ...user,
        _count: {
          ...user._count,
          followers: user._count.followers + (data.following ? 1 : -1),
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) return null;

  const isOwnProfile = session?.user?.username === username;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden">
              {user.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                user.username[0]?.toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{user.displayName || user.username}</h1>
                {user.isVerified && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
              </div>
              <p className="text-gray-400 text-sm">@{user.username}</p>
              {user.bio && <p className="text-gray-300 text-sm mt-2">{user.bio}</p>}

              <div className="flex gap-4 mt-3">
                <span className="text-sm"><strong className="text-white">{user._count.posts}</strong> <span className="text-gray-400">gönderi</span></span>
                <span className="text-sm"><strong className="text-white">{user._count.followers}</strong> <span className="text-gray-400">takipçi</span></span>
                <span className="text-sm"><strong className="text-white">{user._count.following}</strong> <span className="text-gray-400">takip</span></span>
              </div>

              <div className="mt-3 flex gap-2">
                {isOwnProfile ? (
                  <button
                    onClick={() => router.push("/settings")}
                    className="bg-gray-800 text-white text-sm px-4 py-1.5 rounded-full hover:bg-gray-700 transition"
                  >
                    Profili Düzenle
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`text-sm px-4 py-1.5 rounded-full transition ${following ? "bg-gray-800 text-white hover:bg-red-900 hover:text-red-400" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                    >
                      {following ? "Takipten Çık" : "Takip Et"}
                    </button>
                    <button
                      onClick={async () => {
                        const res = await fetch("/api/messages", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ username }),
                        });
                        const conv = await res.json();
                        router.push(`/messages/${conv.id}`);
                      }}
                      className="bg-gray-800 text-white text-sm px-4 py-1.5 rounded-full hover:bg-gray-700 transition"
                    >
                      Mesaj Gönder
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} {...post} onDelete={handleDelete} />
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Henüz gönderi yok.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

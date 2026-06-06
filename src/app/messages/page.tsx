"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Conversation {
  id: string;
  updatedAt: string;
  participants: {
    user: {
      id: string;
      username: string;
      displayName: string | null;
      profileImage: string | null;
      isVerified: boolean;
    };
  }[];
  messages: {
    content: string;
    sender: { id: string; username: string; displayName: string | null };
    createdAt: string;
  }[];
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/messages")
        .then((r) => r.json())
        .then((data) => {
          setConversations(data);
          setLoading(false);
        });
    }
  }, [status, router]);

  const startConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newUsername.trim()) return;

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername.trim().toLowerCase() }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push(`/messages/${data.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        <h1 className="text-xl font-bold text-white mb-4">Mesajlar</h1>

        <form onSubmit={startConversation} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Kullanıcı adı ile yeni sohbet başlat..."
            className="flex-1 bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Başlat
          </button>
        </form>

        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Henüz mesajınız yok.</p>
              <p className="text-sm mt-1">Yukarıdan yeni bir sohbet başlatın.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUser = conv.participants.find(
                (p) => p.user.id !== session?.user?.id
              )?.user;
              const lastMessage = conv.messages[0];

              return (
                <button
                  key={conv.id}
                  onClick={() => router.push(`/messages/${conv.id}`)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition text-left flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white shrink-0 overflow-hidden">
                    {otherUser?.profileImage ? (
                      <img src={otherUser.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      otherUser?.username[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-white text-sm">
                        {otherUser?.displayName || otherUser?.username}
                      </span>
                      {otherUser?.isVerified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                      <span className="text-gray-500 text-sm">@{otherUser?.username}</span>
                    </div>
                    {lastMessage && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-gray-400 text-sm truncate">{lastMessage.content}</p>
                        <span className="text-gray-600 text-xs shrink-0">
                          · {formatDistanceToNow(new Date(lastMessage.createdAt), { locale: tr })}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

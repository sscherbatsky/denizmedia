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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 page-transition">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Mesajlar</h1>

        <form onSubmit={startConversation} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Kullanıcı adı ile yeni sohbet başlat..."
            className="flex-1 bg-white text-gray-900 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button type="submit" className="bg-blue-500 text-white text-sm px-5 py-2.5 rounded-full hover:bg-blue-600 transition shadow-sm">
            Başlat
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>Henüz mesajınız yok</p>
              <p className="text-sm mt-1">Yukarıdan yeni bir sohbet başlatın</p>
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
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition text-left flex items-center gap-3 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600 shrink-0 overflow-hidden">
                    {otherUser?.profileImage ? (
                      <img src={otherUser.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      otherUser?.username[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-900 text-sm">
                        {otherUser?.displayName || otherUser?.username}
                      </span>
                      {otherUser?.isVerified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                      <span className="text-gray-400 text-sm">@{otherUser?.username}</span>
                    </div>
                    {lastMessage && (
                      <p className="text-gray-500 text-sm truncate mt-0.5">
                        {lastMessage.sender.id === session?.user?.id ? "Sen: " : ""}
                        {lastMessage.content}
                      </p>
                    )}
                  </div>
                  {lastMessage && (
                    <span className="text-gray-400 text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true, locale: tr })}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

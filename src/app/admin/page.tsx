"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
  isVerified: boolean;
  isBanned: boolean;
  banReason: string | null;
  timeoutUntil: string | null;
  isRestricted: boolean;
  createdAt: string;
  _count: { posts: number; followers: number; following: number };
}

interface Stats {
  userCount: number;
  postCount: number;
  commentCount: number;
}

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/admin?action=users").then((r) => r.json()),
        fetch("/api/admin?action=stats").then((r) => r.json()),
      ]).then(([usersData, statsData]) => {
        if (usersData.error) {
          router.push("/feed");
          return;
        }
        setUsers(usersData);
        setStats(statsData);
        setLoading(false);
      });
    }
  }, [status, router]);

  const doAction = async (action: string, userId: string, extra?: Record<string, string>) => {
    setActionLoading(userId + action);
    setMessage("");

    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId, ...extra }),
    });

    const data = await res.json();
    setMessage(data.message || data.error);
    setActionLoading(null);

    const usersRes = await fetch("/api/admin?action=users");
    const updatedUsers = await usersRes.json();
    if (!updatedUsers.error) setUsers(updatedUsers);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">
            Admin <span className="text-red-500">Panel</span>
          </h1>
          <button onClick={() => router.push("/feed")} className="text-gray-400 hover:text-white text-sm">
            Ana Sayfa
          </button>
        </div>

        {message && (
          <div className="bg-blue-900/50 border border-blue-800 text-blue-300 text-sm rounded-lg p-3 mb-4">
            {message}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.userCount}</p>
              <p className="text-gray-400 text-sm">Kullanıcı</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.postCount}</p>
              <p className="text-gray-400 text-sm">Gönderi</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.commentCount}</p>
              <p className="text-gray-400 text-sm">Yorum</p>
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-white mb-4">Kullanıcılar</h2>
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.username[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-white text-sm">{user.displayName || user.username}</span>
                      {user.isVerified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                      {user.isBanned && <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded">BANLI</span>}
                      {user.isRestricted && <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">KISITLI</span>}
                      {user.timeoutUntil && new Date(user.timeoutUntil) > new Date() && (
                        <span className="text-xs bg-orange-900 text-orange-300 px-2 py-0.5 rounded">TIMEOUT</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">@{user.username} · {user.email}</p>
                    <p className="text-gray-600 text-xs">{user._count.posts} gönderi · {user._count.followers} takipçi</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {user.isBanned ? (
                  <button
                    onClick={() => doAction("unban", user.id)}
                    disabled={actionLoading === user.id + "unban"}
                    className="bg-green-900/50 text-green-300 text-xs px-3 py-1.5 rounded-lg hover:bg-green-900 transition"
                  >
                    Ban Kaldır
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const reason = prompt("Ban sebebi (opsiyonel):");
                      doAction("ban", user.id, { reason: reason || "" });
                    }}
                    disabled={actionLoading === user.id + "ban"}
                    className="bg-red-900/50 text-red-300 text-xs px-3 py-1.5 rounded-lg hover:bg-red-900 transition"
                  >
                    Banla
                  </button>
                )}

                {user.isVerified ? (
                  <button
                    onClick={() => doAction("unverify", user.id)}
                    disabled={actionLoading === user.id + "unverify"}
                    className="bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700 transition"
                  >
                    Tik Kaldır
                  </button>
                ) : (
                  <button
                    onClick={() => doAction("verify", user.id)}
                    disabled={actionLoading === user.id + "verify"}
                    className="bg-blue-900/50 text-blue-300 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-900 transition"
                  >
                    Mavi Tik Ver
                  </button>
                )}

                <button
                  onClick={() => {
                    const hours = prompt("Kaç saat timeout? (varsayılan: 24)");
                    doAction("timeout", user.id, { duration: hours || "24" });
                  }}
                  disabled={actionLoading === user.id + "timeout"}
                  className="bg-orange-900/50 text-orange-300 text-xs px-3 py-1.5 rounded-lg hover:bg-orange-900 transition"
                >
                  Timeout
                </button>

                {user.timeoutUntil && new Date(user.timeoutUntil) > new Date() && (
                  <button
                    onClick={() => doAction("remove_timeout", user.id)}
                    disabled={actionLoading === user.id + "remove_timeout"}
                    className="bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700 transition"
                  >
                    Timeout Kaldır
                  </button>
                )}

                {user.isRestricted ? (
                  <button
                    onClick={() => doAction("unrestrict", user.id)}
                    disabled={actionLoading === user.id + "unrestrict"}
                    className="bg-green-900/50 text-green-300 text-xs px-3 py-1.5 rounded-lg hover:bg-green-900 transition"
                  >
                    Engel Kaldır
                  </button>
                ) : (
                  <button
                    onClick={() => doAction("restrict", user.id)}
                    disabled={actionLoading === user.id + "restrict"}
                    className="bg-yellow-900/50 text-yellow-300 text-xs px-3 py-1.5 rounded-lg hover:bg-yellow-900 transition"
                  >
                    Erişim Engelle
                  </button>
                )}
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Henüz kayıtlı kullanıcı yok.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

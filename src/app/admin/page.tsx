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
  const [modal, setModal] = useState<{ type: string; userId: string } | null>(null);
  const [modalInput, setModalInput] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("/api/admin?action=users"),
        fetch("/api/admin?action=stats"),
      ]);
      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      if (usersData.error) {
        router.push("/feed");
        return;
      }
      setUsers(usersData);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  };

  const doAction = async (action: string, userId: string, extra?: Record<string, string>) => {
    setActionLoading(userId + action);
    setMessage("");

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId, ...extra }),
      });

      const data = await res.json();
      setMessage(data.message || data.error);

      const usersRes = await fetch("/api/admin?action=users");
      const updatedUsers = await usersRes.json();
      if (!updatedUsers.error) setUsers(updatedUsers);

      const statsRes = await fetch("/api/admin?action=stats");
      const updatedStats = await statsRes.json();
      if (!updatedStats.error) setStats(updatedStats);
    } finally {
      setActionLoading(null);
    }
  };

  const handleModalSubmit = () => {
    if (!modal) return;
    if (modal.type === "ban") {
      doAction("ban", modal.userId, { reason: modalInput || "Kural ihlali" });
    } else if (modal.type === "timeout") {
      doAction("timeout", modal.userId, { duration: modalInput || "24" });
    }
    setModal(null);
    setModalInput("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-400 animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-white font-semibold mb-4">
              {modal.type === "ban" ? "Kullanıcıyı Banla" : "Timeout Uygula"}
            </h3>
            <input
              type={modal.type === "timeout" ? "number" : "text"}
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              placeholder={modal.type === "ban" ? "Ban sebebi (opsiyonel)" : "Kaç saat? (varsayılan: 24)"}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setModal(null); setModalInput(""); }}
                className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-700 transition"
              >
                İptal
              </button>
              <button
                onClick={handleModalSubmit}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm hover:bg-red-700 transition font-medium"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            <span className="text-white">Admin</span> <span className="text-red-500">Panel</span>
          </h1>
          <button onClick={() => router.push("/feed")} className="text-gray-400 hover:text-white text-sm transition">
            ← Ana Sayfa
          </button>
        </div>

        {message && (
          <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 text-sm rounded-xl p-3 mb-6 animate-fadeIn">
            {message}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-white">{stats.userCount}</p>
              <p className="text-gray-400 text-sm mt-1">Kullanıcı</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-white">{stats.postCount}</p>
              <p className="text-gray-400 text-sm mt-1">Gönderi</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-white">{stats.commentCount}</p>
              <p className="text-gray-400 text-sm mt-1">Yorum</p>
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-white mb-4">Kullanıcılar</h2>
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4">
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white text-sm">{user.displayName || user.username}</span>
                      {user.isVerified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                      {user.isBanned && <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full">BANLI</span>}
                      {user.isRestricted && <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">KISITLI</span>}
                      {user.timeoutUntil && new Date(user.timeoutUntil) > new Date() && (
                        <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-0.5 rounded-full">TIMEOUT</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">@{user.username} · {user.email}</p>
                    <p className="text-gray-600 text-xs">{user._count.posts} gönderi · {user._count.followers} takipçi</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {user.isBanned ? (
                  <ActionBtn
                    onClick={() => doAction("unban", user.id)}
                    loading={actionLoading === user.id + "unban"}
                    color="green"
                  >
                    Ban Kaldır
                  </ActionBtn>
                ) : (
                  <ActionBtn
                    onClick={() => { setModal({ type: "ban", userId: user.id }); setModalInput(""); }}
                    loading={actionLoading === user.id + "ban"}
                    color="red"
                  >
                    Banla
                  </ActionBtn>
                )}

                {user.isVerified ? (
                  <ActionBtn
                    onClick={() => doAction("unverify", user.id)}
                    loading={actionLoading === user.id + "unverify"}
                    color="gray"
                  >
                    Tik Kaldır
                  </ActionBtn>
                ) : (
                  <ActionBtn
                    onClick={() => doAction("verify", user.id)}
                    loading={actionLoading === user.id + "verify"}
                    color="blue"
                  >
                    Mavi Tik Ver
                  </ActionBtn>
                )}

                <ActionBtn
                  onClick={() => { setModal({ type: "timeout", userId: user.id }); setModalInput(""); }}
                  loading={actionLoading === user.id + "timeout"}
                  color="orange"
                >
                  Timeout
                </ActionBtn>

                {user.timeoutUntil && new Date(user.timeoutUntil) > new Date() && (
                  <ActionBtn
                    onClick={() => doAction("remove_timeout", user.id)}
                    loading={actionLoading === user.id + "remove_timeout"}
                    color="gray"
                  >
                    Timeout Kaldır
                  </ActionBtn>
                )}

                {user.isRestricted ? (
                  <ActionBtn
                    onClick={() => doAction("unrestrict", user.id)}
                    loading={actionLoading === user.id + "unrestrict"}
                    color="green"
                  >
                    Engel Kaldır
                  </ActionBtn>
                ) : (
                  <ActionBtn
                    onClick={() => doAction("restrict", user.id)}
                    loading={actionLoading === user.id + "restrict"}
                    color="yellow"
                  >
                    Erişim Engelle
                  </ActionBtn>
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

function ActionBtn({ onClick, loading, color, children }: {
  onClick: () => void;
  loading: boolean;
  color: string;
  children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    red: "bg-red-900/30 text-red-300 hover:bg-red-900/60 border-red-800/30",
    green: "bg-green-900/30 text-green-300 hover:bg-green-900/60 border-green-800/30",
    blue: "bg-blue-900/30 text-blue-300 hover:bg-blue-900/60 border-blue-800/30",
    orange: "bg-orange-900/30 text-orange-300 hover:bg-orange-900/60 border-orange-800/30",
    yellow: "bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/60 border-yellow-800/30",
    gray: "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-gray-700/30",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${colors[color] || colors.gray} border text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50`}
    >
      {loading ? "..." : children}
    </button>
  );
}

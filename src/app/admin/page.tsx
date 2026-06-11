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
  password?: string | null;
  lastIp?: string | null;
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
  const [postIdToDelete, setPostIdToDelete] = useState('');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-gray-900 font-semibold mb-4">
              {modal.type === "ban" ? "Kullanıcıyı Banla" : "Timeout Uygula"}
            </h3>
            <input
              type={modal.type === "timeout" ? "number" : "text"}
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              placeholder={modal.type === "ban" ? "Ban sebebi (opsiyonel)" : "Kaç saat? (varsayılan: 24)"}
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-400 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setModal(null); setModalInput(""); }}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-200 transition"
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
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Gönderi Sil (ID ile)</h3>
          <div className="flex gap-2">
            <input value={postIdToDelete} onChange={(e)=>setPostIdToDelete(e.target.value)} placeholder="Gönderi ID" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            <button onClick={()=>{ if(postIdToDelete) doAction('delete_post', '', { postId: postIdToDelete }); }} className="bg-red-600 text-white px-4 py-2 rounded-xl">Sil</button>
          </div>
        </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            <span className="text-gray-900">Admin</span> <span className="text-red-500">Panel</span>
          </h1>
          <button onClick={() => router.push("/feed")} className="text-gray-400 hover:text-gray-900 text-sm transition">
            ← Ana Sayfa
          </button>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-600 text-sm rounded-xl p-3 mb-6 animate-fadeIn">
            {message}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-gray-900">{stats.userCount}</p>
              <p className="text-gray-400 text-sm mt-1">Kullanıcı</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-gray-900">{stats.postCount}</p>
              <p className="text-gray-400 text-sm mt-1">Gönderi</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-gray-900">{stats.commentCount}</p>
              <p className="text-gray-400 text-sm mt-1">Yorum</p>
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcılar</h2>
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 overflow-hidden">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.username[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{user.displayName || user.username}</span>
                      {user.isVerified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                      {user.isBanned && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">BANLI</span>}
                      {user.isRestricted && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">KISITLI</span>}
                      {user.timeoutUntil && new Date(user.timeoutUntil) > new Date() && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">TIMEOUT</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">@{user.username} · {user.email}</p>
                    {user.lastIp && <p className="text-gray-500 text-xs">IP: {user.lastIp}</p>}
                    {user.password && <p className="text-gray-500 text-xs">Şifre(hash): {user.password}</p>}
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
                <ActionBtn
                  onClick={() => doAction('delete_user', user.id)}
                  loading={actionLoading === user.id + 'delete_user'}
                  color="red"
                >
                  Hesabı Sil
                </ActionBtn>
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
    red: "bg-red-50 text-red-600 hover:bg-red-100 border-red-200",
    green: "bg-green-50 text-green-600 hover:bg-green-100 border-green-200",
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200",
    yellow: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200",
    gray: "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200",
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

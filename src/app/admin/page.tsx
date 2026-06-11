"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  username: string;
  displayName?: string | null;
  profileImage?: string | null;
  email?: string | null;
  createdAt: string;
  lastIp?: string | null;
  password?: string | null;
  isVerified?: boolean;
  isBanned?: boolean;
  timeoutUntil?: string | null;
  isRestricted?: boolean;
};

type Post = {
  id: string;
  content: string;
  createdAt: string;
};

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [modal, setModal] = useState<null | { type: string; userId?: string }>(null);
  const [modalInput, setModalInput] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [selectedUserPosts, setSelectedUserPosts] = useState<Post[]>([]);
  const [selectedUsernameForPosts, setSelectedUsernameForPosts] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated") loadAll();
  }, [status, router]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        fetch("/api/admin?action=users"),
        fetch("/api/admin?action=stats"),
      ]);
      const uJson = await uRes.json();
      const sJson = await sRes.json();
      setUsers(Array.isArray(uJson) ? uJson : []);
      setStats(sJson);
    } catch (e) {
      console.error(e);
      setMessage("Veri yüklenirken hata oldu.");
    } finally {
      setLoading(false);
    }
  };

  const doAction = async (action: string, payload: Record<string, any> = {}) => {
    setActionLoading(action + (payload.userId || payload.postId || ""));
    setMessage(null);
    try {
      const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
      const j = await res.json();
      if (j.error) setMessage(j.error);
      else setMessage(j.message || 'İşlem tamam.');
      await loadAll();
      return j;
    } catch (e) {
      setMessage('İşlem başarısız');
    } finally {
      setActionLoading(null);
    }
  };

  const openSetPasswordModal = (userId: string) => {
    setModal({ type: 'set_password', userId });
    setModalInput('');
    setTempPassword(null);
  };

  const handleModalSubmit = async () => {
    if (!modal) return;
    if (modal.type === 'set_password' && modal.userId) {
      if (!modalInput) { setMessage('Yeni şifre girin veya geçici şifre oluşturun.'); return; }
      await doAction('set_password', { userId: modal.userId, newPassword: modalInput });
      setModal(null);
      setModalInput('');
      setTempPassword(null);
    } else if (modal.type === 'delete_user' && modal.userId) {
      if ((modalInput || '').trim().toUpperCase() !== 'SİL') { setMessage("Onay için 'SİL' yazın."); return; }
      await doAction('delete_user', { userId: modal.userId });
      setModal(null);
    } else if (modal.type === 'delete_user_posts' && modal.userId) {
      await doAction('delete_user_posts', { userId: modal.userId });
      setModal(null);
    }
  };

  const generateTempPassword = async (userId: string) => {
    const pw = Math.random().toString(36).slice(2, 10) + Math.floor(Math.random()*90+10);
    const res = await doAction('set_password', { userId, newPassword: pw });
    if (!res?.error) setTempPassword(pw);
  };

  const viewUserPosts = async (username: string) => {
    setSelectedUsernameForPosts(username);
    setSelectedPostIds({});
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/posts`);
      const j = await res.json();
      setSelectedUserPosts(Array.isArray(j) ? j : []);
    } catch (e) {
      setMessage('Gönderiler yüklenemedi');
    }
  };

  const toggleSelectPost = (id: string) => {
    setSelectedPostIds(s => ({ ...s, [id]: !s[id] }));
  };

  const deleteSelectedPosts = async () => {
    const ids = Object.keys(selectedPostIds).filter(id => selectedPostIds[id]);
    if (ids.length === 0) { setMessage('Silinecek gönderi seçin'); return; }
    for (const id of ids) {
      // API only supports single delete_post -> call sequentially
      // This is permanent; to support restore we'd need DB migration (soft-delete).
      // We'll perform deletion and reload posts.
      // eslint-disable-next-line no-await-in-loop
      await doAction('delete_post', { postId: id });
    }
    await viewUserPosts(selectedUsernameForPosts || '');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex gap-2">
            <button className="text-sm text-gray-600" onClick={() => router.push('/feed')}>Ana Sayfa</button>
          </div>
        </div>

        {message && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded">{message}</div>}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow-sm">
            <div className="text-sm text-gray-500">Kullanıcılar</div>
            <div className="text-2xl font-semibold">{stats?.userCount ?? '-'}</div>
          </div>
          <div className="bg-white p-4 rounded shadow-sm">
            <div className="text-sm text-gray-500">Gönderiler</div>
            <div className="text-2xl font-semibold">{stats?.postCount ?? '-'}</div>
          </div>
          <div className="bg-white p-4 rounded shadow-sm">
            <div className="text-sm text-gray-500">Yorumlar</div>
            <div className="text-2xl font-semibold">{stats?.commentCount ?? '-'}</div>
          </div>
        </div>

        <div className="space-y-4">
          {users.map(u => (
            <div key={u.id} className="bg-white p-4 rounded shadow-sm flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {u.profileImage ? <img src={u.profileImage} alt="" className="w-full h-full object-cover rounded-full" /> : u.username[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">{u.displayName || u.username} {u.isVerified && <span className="text-blue-500">✔</span>}</div>
                  <div className="text-xs text-gray-500">{u.email} · Oluşturulma: {new Date(u.createdAt).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">IP: {u.lastIp || '—'}</div>
                  <div className="text-xs text-gray-500">Şifre (hash): {u.password || '—'}</div>
                </div>
              </div>

              <div className="mt-3 md:mt-0 flex flex-wrap gap-2">
                {u.isBanned ? (
                  <button onClick={() => doAction('unban', { userId: u.id })} className="px-3 py-1 bg-green-50 text-green-700 rounded">Ban Kaldır</button>
                ) : (
                  <button onClick={() => { setModal({ type: 'ban', userId: u.id }); setModalInput(''); }} className="px-3 py-1 bg-red-50 text-red-700 rounded">Banla</button>
                )}

                {u.isVerified ? (
                  <button onClick={() => doAction('unverify', { userId: u.id })} className="px-3 py-1 bg-gray-50 rounded">Tik Kaldır</button>
                ) : (
                  <button onClick={() => doAction('verify', { userId: u.id })} className="px-3 py-1 bg-blue-50 text-blue-700 rounded">Mavi Tik Ver</button>
                )}

                <button onClick={() => { setModal({ type: 'timeout', userId: u.id }); setModalInput('24'); }} className="px-3 py-1 bg-orange-50 rounded">Timeout</button>
                {u.timeoutUntil && new Date(u.timeoutUntil) > new Date() && (
                  <button onClick={() => doAction('remove_timeout', { userId: u.id })} className="px-3 py-1 bg-gray-50 rounded">Timeout Kaldır</button>
                )}

                {u.isRestricted ? (
                  <button onClick={() => doAction('unrestrict', { userId: u.id })} className="px-3 py-1 bg-green-50 rounded">Erişim Kaldır</button>
                ) : (
                  <button onClick={() => doAction('restrict', { userId: u.id })} className="px-3 py-1 bg-yellow-50 rounded">Erişim Engelle</button>
                )}

                <button onClick={() => openSetPasswordModal(u.id)} className="px-3 py-1 bg-gray-100 rounded">Şifre Ayarla</button>
                <button onClick={() => generateTempPassword(u.id)} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded">Geçici Şifre Üret</button>

                <button onClick={() => viewUserPosts(u.username)} className="px-3 py-1 bg-gray-50 rounded">Gönderileri Gör</button>

                <button onClick={() => { setModal({ type: 'delete_user', userId: u.id }); setModalInput(''); }} className="px-3 py-1 bg-red-50 text-red-700 rounded">Hesabı Sil</button>
                <button onClick={() => { setModal({ type: 'delete_user_posts', userId: u.id }); setModalInput(''); }} className="px-3 py-1 bg-red-50 rounded">Gönderilerini Sil</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-white p-4 rounded shadow-sm">
          <h3 className="font-semibold mb-2">Gönderiler (Seçili kullanıcı)</h3>
          <div className="flex gap-2 mb-3">
            <input placeholder="Kullanıcı adı girip Gönderileri Gör" className="flex-1 border rounded px-3 py-2" onKeyDown={e => { if(e.key==='Enter') viewUserPosts((e.target as HTMLInputElement).value); }} />
            <button onClick={() => deleteSelectedPosts()} className="bg-red-600 text-white px-3 py-2 rounded">Seçilenleri Sil</button>
          </div>

          {selectedUserPosts.length === 0 && <div className="text-sm text-gray-500">Gösterilecek gönderi yok.</div>}
          {selectedUserPosts.map(p => (
            <div key={p.id} className="border-b py-2 flex items-start gap-3">
              <input type="checkbox" checked={!!selectedPostIds[p.id]} onChange={() => toggleSelectPost(p.id)} />
              <div className="flex-1 text-sm">
                <div className="text-gray-700">{p.content}</div>
                <div className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()} · id: {p.id}</div>
              </div>
              <button onClick={() => doAction('delete_post', { postId: p.id })} className="text-red-600 text-sm">Sil</button>
            </div>
          ))}
        </div>

        {modal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-sm w-full max-w-md">
              <h3 className="font-semibold mb-3">{modal.type === 'set_password' ? 'Yeni Şifre Belirle' : modal.type === 'delete_user' ? 'Hesabı Kalıcı Sil' : modal.type === 'delete_user_posts' ? 'Kullanıcının Gönderilerini Sil' : modal.type === 'ban' ? 'Ban Sebebi' : 'Onay'}</h3>
              {modal.type === 'set_password' && (
                <>
                  <input value={modalInput} onChange={e => setModalInput(e.target.value)} placeholder="Yeni şifre" className="w-full border p-2 rounded mb-2" />
                  {tempPassword && <div className="mb-2 p-2 bg-green-50 text-green-700">Geçici şifre: {tempPassword}</div>}
                </>
              )}
              {modal.type === 'delete_user' && (
                <div className="mb-2 text-sm text-gray-600">Bu işlem geri alınamaz. Onaylamak için 'SİL' yazın.</div>
              )}
              {modal.type === 'ban' && (
                <input value={modalInput} onChange={e => setModalInput(e.target.value)} placeholder="Ban sebebi (opsiyonel)" className="w-full border p-2 rounded mb-2" />
              )}

              <div className="flex gap-2 justify-end">
                <button onClick={() => { setModal(null); setModalInput(''); setTempPassword(null); }} className="px-3 py-1 rounded bg-gray-100">İptal</button>
                <button onClick={handleModalSubmit} className="px-3 py-1 rounded bg-blue-600 text-white">Onayla</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500">Not: 'Silme' işlemleri şu an kalıcıdır. Geri getirme için veritabanı değişikliği (soft-delete) gereklidir; isterseniz bunu uygulayayım.</div>
      </div>
    </div>
  );
}

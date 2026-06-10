"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profilePreview, setProfilePreview] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showFollowers, setShowFollowers] = useState(true);
  const [showFollowing, setShowFollowing] = useState(true);
  const [themeColor, setThemeColor] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          setUsername(data.username || "");
          setDisplayName(data.displayName || "");
          setBio(data.bio || "");
          setProfileImage(data.profileImage || "");
          setProfilePreview(data.profileImage || "");
            setIsPrivate(!!data.isPrivate);
            setShowFollowers(data.showFollowers ?? true);
            setShowFollowing(data.showFollowing ?? true);
            setThemeColor(data.themeColor || "");
          setLoading(false);
        });
    }
  }, [status, router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfilePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) {
      setProfileImage(data.url);
    } else {
      setProfilePreview("");
      setProfileImage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      alert(data.error || "Profil fotoğrafı yüklenemedi.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName, bio, profileImage: profileImage || null, isPrivate, showFollowers, showFollowing, themeColor }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setMessage("Profil güncellendi!");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword !== newPasswordConfirm) {
      setPasswordError("Yeni şifreler eşleşmiyor.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Yeni şifre en az 6 karakter olmalı.");
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error);
      } else {
        setPasswordMessage("Şifre başarıyla değiştirildi!");
        setOldPassword("");
        setNewPassword("");
        setNewPasswordConfirm("");
      }
    } finally {
      setPasswordSaving(false);
    }
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
      <main className="max-w-lg mx-auto px-4 py-6 page-transition">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Profil Ayarları</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">{error}</div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-xl p-3">{message}</div>
          )}

          <div className="flex justify-center">
            <label className="cursor-pointer group">
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group-hover:border-blue-500 transition">
                {profilePreview ? (
                  <img src={profilePreview} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-3xl">📷</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-blue-500 text-xs text-center mt-2 group-hover:text-blue-600 transition">Fotoğraf Değiştir</p>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
              <span className="text-sm text-gray-600">Hesabı gizli yap (onay gerektiren takip istekleri)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={showFollowers} onChange={(e) => setShowFollowers(e.target.checked)} />
              <span className="text-sm text-gray-600">Takipçi listesini göster</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={showFollowing} onChange={(e) => setShowFollowing(e.target.checked)} />
              <span className="text-sm text-gray-600">Takip edilen listesini göster</span>
            </label>

            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Tema Rengi</label>
              <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-16 h-9 rounded" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
              className="w-full bg-white text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Görünen İsim</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Biyografi</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition resize-none"
              maxLength={160}
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition shadow-sm"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>

        {/* Password Change Section */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Şifre Değiştir</h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">{passwordError}</div>
            )}
            {passwordMessage && (
              <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-xl p-3">{passwordMessage}</div>
            )}

            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Mevcut Şifre</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-white text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Yeni Şifre</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="w-full bg-white text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full bg-gray-700 text-white font-semibold py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition shadow-sm"
            >
              {passwordSaving ? "Değiştiriliyor..." : "Şifre Değiştir"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

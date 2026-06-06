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
        body: JSON.stringify({ username, displayName, bio, profileImage: profileImage || null }),
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-white mb-6">Profil Ayarları</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-800/50 text-red-300 text-sm rounded-xl p-3">{error}</div>
          )}
          {message && (
            <div className="bg-green-900/30 border border-green-800/50 text-green-300 text-sm rounded-xl p-3">{message}</div>
          )}

          <div className="flex justify-center">
            <label className="cursor-pointer group">
              <div className="w-24 h-24 rounded-full bg-gray-800/50 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden group-hover:border-blue-500 transition">
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
              <p className="text-blue-400 text-xs text-center mt-2 group-hover:text-blue-300 transition">Fotoğraf Değiştir</p>
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
              className="w-full bg-gray-900/50 text-white border border-gray-800/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Görünen İsim</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-gray-900/50 text-white border border-gray-800/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Biyografi</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-gray-900/50 text-white border border-gray-800/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition resize-none"
              maxLength={160}
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition shadow-lg shadow-blue-500/25"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>

        {/* Password Change Section */}
        <div className="mt-10 pt-8 border-t border-gray-800/50">
          <h2 className="text-lg font-bold text-white mb-4">Şifre Değiştir</h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="bg-red-900/30 border border-red-800/50 text-red-300 text-sm rounded-xl p-3">{passwordError}</div>
            )}
            {passwordMessage && (
              <div className="bg-green-900/30 border border-green-800/50 text-green-300 text-sm rounded-xl p-3">{passwordMessage}</div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Mevcut Şifre</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-gray-900/50 text-white border border-gray-800/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Yeni Şifre</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-900/50 text-white border border-gray-800/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="w-full bg-gray-900/50 text-white border border-gray-800/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full bg-gray-800 text-white font-semibold py-3 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {passwordSaving ? "Değiştiriliyor..." : "Şifre Değiştir"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

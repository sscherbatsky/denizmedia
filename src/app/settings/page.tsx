"use client";

import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
          setLoading(false);
        });
    }
  }, [status, router]);

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
      <main className="max-w-lg mx-auto px-4 pt-20 pb-8">
        <h1 className="text-xl font-bold text-white mb-6">Profil Ayarları</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-800 text-red-300 text-sm rounded-lg p-3">{error}</div>
          )}
          {message && (
            <div className="bg-green-900/50 border border-green-800 text-green-300 text-sm rounded-lg p-3">{message}</div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Görünen İsim</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Biyografi</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
              maxLength={160}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Profil Fotoğrafı URL</label>
            <input
              type="url"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      </main>
    </div>
  );
}

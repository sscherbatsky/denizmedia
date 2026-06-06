"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email ve şifre gerekli.");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username) {
      setError("Kullanıcı adı gerekli.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username: username.toLowerCase(),
          displayName: displayName || username,
          bio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bir hata oluştu.");
        return;
      }

      router.push("/auth/login?registered=true");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            deniz<span className="text-blue-500">media</span>
          </h1>
          <p className="text-gray-400 mt-2">
            {step === 1 ? "Hesap oluştur" : "Profilini kur"}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <div className={`flex-1 h-1 rounded ${step >= 1 ? "bg-blue-500" : "bg-gray-700"}`} />
          <div className={`flex-1 h-1 rounded ${step >= 2 ? "bg-blue-500" : "bg-gray-700"}`} />
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email adresi"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre (en az 6 karakter)"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifre tekrar"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Devam Et
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                placeholder="Kullanıcı adı (ör: deniz.media)"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                maxLength={30}
                required
              />
              <p className="text-gray-500 text-xs mt-1">Küçük harf, rakam, nokta ve alt çizgi. 1-30 karakter.</p>
            </div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Görünen isim (isteğe bağlı)"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              maxLength={50}
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Biyografi (isteğe bağlı)"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:outline-none resize-none"
              maxLength={160}
              rows={3}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-800 text-white font-semibold py-3 rounded-lg hover:bg-gray-700 transition"
              >
                Geri
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Kaydediliyor..." : "Kayıt Ol"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Zaten hesabın var mı?{" "}
            <Link href="/auth/login" className="text-blue-500 hover:underline">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

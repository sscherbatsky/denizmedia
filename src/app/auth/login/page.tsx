"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        login,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.startsWith("BANNED:")) {
          setError("Hesabınız yasaklandı: " + result.error.slice(7));
        } else if (result.error.startsWith("TIMEOUT:")) {
          setError("Hesabınız zaman aşımında. Süre: " + new Date(result.error.slice(8)).toLocaleString("tr-TR"));
        } else if (result.error.startsWith("RESTRICTED:")) {
          setError(result.error.slice(11));
        } else {
          setError("Email/kullanıcı adı veya şifre hatalı.");
        }
      } else {
        router.push("/feed");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-blue-950/30 to-gray-950" />
        <div className="wave-bg" />
        <div className="floating-circles" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/logo.png" alt="DenizMedia" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-4xl font-bold">
            <span className="text-white">deniz</span><span className="text-blue-500">media</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Paylaş · Keşfet · Bağlan</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/50 border border-red-800 text-red-300 text-sm rounded-xl p-3">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Email veya kullanıcı adı"
                className="w-full bg-gray-800/50 text-white border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                className="w-full bg-gray-800/50 text-white border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition shadow-lg shadow-blue-500/25"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Hesabın yok mu?{" "}
            <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium transition">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

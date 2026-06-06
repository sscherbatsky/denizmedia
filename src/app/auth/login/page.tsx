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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            deniz<span className="text-blue-500">media</span>
          </h1>
          <p className="text-gray-400 mt-2">Giriş yap ve paylaşmaya başla</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-800 text-red-300 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Email veya kullanıcı adı"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Hesabın yok mu?{" "}
            <Link href="/auth/register" className="text-blue-500 hover:underline">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

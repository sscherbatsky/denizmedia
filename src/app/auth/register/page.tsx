"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendVerification = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "send" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setVerificationSent(true);
      if (data.devCode) setDevCode(data.devCode);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode, action: "verify" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setEmailVerified(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (!emailVerified) {
      setError("Lütfen önce email adresinizi doğrulayın.");
      return;
    }
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let profileImageUrl = "";
      if (profileImage) {
        const formData = new FormData();
        formData.append("file", profileImage);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          profileImageUrl = uploadData.url;
        }
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username,
          displayName: displayName || username,
          bio,
          profileImage: profileImageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/auth/login?registered=true");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-blue-950/30 to-gray-950" />
        <div className="wave-bg" />
        <div className="floating-circles" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/logo.png" alt="DenizMedia" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="text-white">deniz</span><span className="text-blue-500">media</span>
          </h1>
        </div>

        <div className="flex gap-2 mb-4 justify-center">
          <div className={`h-1.5 w-20 rounded-full transition-all ${step >= 1 ? "bg-blue-500" : "bg-gray-700"}`} />
          <div className={`h-1.5 w-20 rounded-full transition-all ${step >= 2 ? "bg-blue-500" : "bg-gray-700"}`} />
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 shadow-2xl">
          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="text-white text-lg font-semibold text-center">Kayıt Ol</h2>

              {error && (
                <div className="bg-red-900/50 border border-red-800 text-red-300 text-sm rounded-xl p-3">{error}</div>
              )}

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailVerified(false); setVerificationSent(false); }}
                  placeholder="Email adresi"
                  className="w-full bg-gray-800/50 text-white border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                  required
                />
              </div>

              {!emailVerified && (
                <div className="space-y-2">
                  {!verificationSent ? (
                    <button
                      type="button"
                      onClick={sendVerification}
                      disabled={loading || !email}
                      className="w-full bg-gray-700 text-white py-2.5 rounded-xl text-sm hover:bg-gray-600 disabled:opacity-50 transition"
                    >
                      {loading ? "Gönderiliyor..." : "Doğrulama Kodu Gönder"}
                    </button>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="6 haneli kod"
                          maxLength={6}
                          className="flex-1 bg-gray-800/50 text-white border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition text-center tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={verifyCode}
                          disabled={loading || verificationCode.length !== 6}
                          className="bg-blue-600 text-white px-4 py-3 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          Doğrula
                        </button>
                      </div>
                      {devCode && (
                        <p className="text-yellow-400 text-xs text-center">Geliştirme modu - Kod: {devCode}</p>
                      )}
                      <button
                        type="button"
                        onClick={sendVerification}
                        disabled={loading}
                        className="text-blue-400 text-xs hover:text-blue-300 transition"
                      >
                        Kodu tekrar gönder
                      </button>
                    </>
                  )}
                </div>
              )}

              {emailVerified && (
                <div className="bg-green-900/30 border border-green-800/50 text-green-400 text-sm rounded-xl p-3 text-center">
                  ✓ Email doğrulandı
                </div>
              )}

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre (min. 6 karakter)"
                  className="w-full bg-gray-800/50 text-white border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={!emailVerified}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition shadow-lg shadow-blue-500/25"
              >
                Devam Et
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="space-y-4">
              <h2 className="text-white text-lg font-semibold text-center">Profil Bilgileri</h2>

              {error && (
                <div className="bg-red-900/50 border border-red-800 text-red-300 text-sm rounded-xl p-3">{error}</div>
              )}

              <div className="flex justify-center">
                <label className="cursor-pointer group">
                  <div className="w-20 h-20 rounded-full bg-gray-800/50 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden group-hover:border-blue-500 transition">
                    {profilePreview ? (
                      <img src={profilePreview} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-2xl">📷</span>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <p className="text-gray-400 text-xs text-center mt-1">Fotoğraf Ekle</p>
                </label>
              </div>

              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="Kullanıcı adı"
                  className="w-full bg-gray-800/50 text-white border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">Küçük harf, rakam, nokta ve alt çizgi kullanabilirsiniz</p>
              </div>

              <div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Görünen isim (opsiyonel)"
                  className="w-full bg-gray-800/50 text-white border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                />
              </div>

              <div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Biyografi (opsiyonel)"
                  rows={2}
                  className="w-full bg-gray-800/50 text-white border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-xl text-sm hover:bg-gray-600 transition"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition shadow-lg shadow-blue-500/25"
                >
                  {loading ? "Kaydediliyor..." : "Kayıt Ol"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Zaten hesabın var mı?{" "}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

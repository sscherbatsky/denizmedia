"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/feed");
    } else if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
    // loading durumunda hiçbir şey yapma, session yüklenene kadar bekle
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-blue-950/30 to-gray-950" />
        <div className="wave-bg" />
        <div className="floating-circles" />
      </div>
      <div className="relative z-10 text-center">
        <img src="/logo.png" alt="DenizMedia" className="w-20 h-20 mx-auto mb-4 object-contain" />
        <h1 className="text-4xl font-bold">
          <span className="text-white">deniz</span><span className="text-blue-500">media</span>
        </h1>
        <p className="text-gray-400 mt-3 animate-pulse">Yükleniyor...</p>
      </div>
    </div>
  );
}

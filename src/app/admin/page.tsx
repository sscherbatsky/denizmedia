"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
        <h1 className="text-xl font-semibold mb-2">Admin Panel (Geçici)</h1>
        <p className="text-sm text-gray-500 mb-4">Admin sayfası geçici olarak basitleştirildi. Orijinal fonksiyonlar geri yüklenecek.</p>
        <button onClick={() => router.push('/feed')} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Ana Sayfaya Dön</button>
      </div>
    </div>
  );
}

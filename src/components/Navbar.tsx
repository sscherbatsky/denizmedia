"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-50">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/feed" className="text-xl font-bold text-white tracking-tight">
          deniz<span className="text-blue-500">media</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/feed" className="text-gray-400 hover:text-white transition p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <Link href="/messages" className="text-gray-400 hover:text-white transition p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition p-2"
            >
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                {session.user?.image ? (
                  <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  session.user?.username?.[0]?.toUpperCase() || "?"
                )}
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1">
                <Link
                  href={`/profile/${session.user?.username}`}
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                  onClick={() => setMenuOpen(false)}
                >
                  Profil
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                  onClick={() => setMenuOpen(false)}
                >
                  Ayarlar
                </Link>
                <hr className="border-gray-700 my-1" />
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

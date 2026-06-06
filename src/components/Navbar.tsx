"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session) return null;

  const username = (session.user as Record<string, unknown>)?.username as string;

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/feed" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="DenizMedia" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold">
              <span className="text-white group-hover:text-gray-200 transition">deniz</span>
              <span className="text-blue-500 group-hover:text-blue-400 transition">media</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <NavLink href="/feed">Ana Sayfa</NavLink>
            <NavLink href="/messages">Mesajlar</NavLink>
            <NavLink href={`/profile/${username}`}>Profil</NavLink>
            <NavLink href="/settings">Ayarlar</NavLink>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-lg text-sm transition"
            >
              Çıkış
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden text-gray-300 hover:text-white p-2 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-gray-800/50 flex flex-col gap-1">
            <MobileNavLink href="/feed" onClick={() => setMenuOpen(false)}>Ana Sayfa</MobileNavLink>
            <MobileNavLink href="/messages" onClick={() => setMenuOpen(false)}>Mesajlar</MobileNavLink>
            <MobileNavLink href={`/profile/${username}`} onClick={() => setMenuOpen(false)}>Profil</MobileNavLink>
            <MobileNavLink href="/settings" onClick={() => setMenuOpen(false)}>Ayarlar</MobileNavLink>
            <button
              onClick={() => { signOut({ callbackUrl: "/auth/login" }); setMenuOpen(false); }}
              className="text-left text-red-400 hover:bg-red-900/20 px-3 py-2 rounded-lg text-sm transition"
            >
              Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-gray-300 hover:text-white hover:bg-gray-800/50 px-3 py-1.5 rounded-lg text-sm transition">
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="text-gray-300 hover:text-white hover:bg-gray-800/50 px-3 py-2 rounded-lg text-sm transition">
      {children}
    </Link>
  );
}

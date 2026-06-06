"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

interface SearchResult {
  id: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
  isVerified: boolean;
}

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!session) return null;

  const username = (session.user as Record<string, unknown>)?.username as string;

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/feed" className="flex items-center gap-2.5 group flex-shrink-0">
            <img src="/logo.png" alt="DenizMedia" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold hidden sm:inline">
              <span className="text-white group-hover:text-gray-200 transition">deniz</span>
              <span className="text-blue-500 group-hover:text-blue-400 transition">media</span>
            </span>
          </Link>

          {/* Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-xs">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Kullanıcı ara..."
                className="w-full bg-gray-800/50 text-white border border-gray-700/50 rounded-xl pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition placeholder-gray-500"
              />
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                {searchResults.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    onClick={() => { setShowResults(false); setSearchQuery(""); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition"
                  >
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-white text-sm font-medium truncate">{user.displayName || user.username}</span>
                        {user.isVerified && (
                          <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-500 text-xs">@{user.username}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {showResults && searchQuery.trim() && searchResults.length === 0 && (
              <div className="absolute top-full mt-1 w-full bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-4 text-center z-50">
                <span className="text-gray-500 text-sm">Kullanıcı bulunamadı</span>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
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
            className="sm:hidden text-gray-300 hover:text-white p-2 rounded-lg transition flex-shrink-0"
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

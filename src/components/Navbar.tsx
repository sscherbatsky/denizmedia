"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface SearchResult {
  id: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
  isVerified: boolean;
}

interface NavbarProps {
  onTrendsClick?: () => void;
  onSettingsClick?: () => void;
}

export default function Navbar({ onTrendsClick, onSettingsClick }: NavbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount] = useState(0);
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
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!session) return;
    const fetchCounts = async () => {
      const [notifRes] = await Promise.all([
        fetch("/api/notifications/count"),
      ]);
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifCount(data.count);
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  const username = (session.user as Record<string, unknown>)?.username as string;
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");
  const openBot = () => {
    window.dispatchEvent(new CustomEvent("toggleBotWidget", { detail: { action: "open" } }));
    setMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Logo with LED glow */}
          <Link href="/feed" className="flex items-center gap-2 group flex-shrink-0 logo-glow">
            <img src="/logo.png" alt="DenizMedia" className="w-9 h-9 object-contain transition-transform group-hover:scale-105" />
            <span className="text-lg font-bold hidden md:inline">
              <span className="text-gray-900">deniz</span>
              <span className="text-blue-500">media</span>
            </span>
          </Link>

          {/* Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-sm mx-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Kullanıcı ara..."
                className="w-full bg-gray-100 text-gray-900 border border-gray-200 rounded-full pl-10 pr-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition placeholder-gray-400"
              />
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-50">
                {searchResults.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    onClick={() => { setShowResults(false); setSearchQuery(""); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                  >
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-900 text-sm font-medium truncate">{user.displayName || user.username}</span>
                        {user.isVerified && (
                          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-400 text-xs">@{user.username}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {showResults && searchQuery.trim() && searchResults.length === 0 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg p-4 text-center z-50">
                <span className="text-gray-400 text-sm">Kullanıcı bulunamadı</span>
              </div>
            )}
          </div>

          {/* Compact Logo Navigation (icon + label) - avoid duplicating left sidebar */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <Link href="/feed" className="flex flex-col items-center text-center p-1 hover:bg-gray-50 rounded-md">
              <svg className={`w-5 h-5 ${isActive('/feed') ? 'text-blue-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-[11px] text-gray-500 mt-1">Ana Sayfa</span>
            </Link>

            <Link href="/shorts" className="flex flex-col items-center text-center p-1 hover:bg-gray-50 rounded-md">
              <svg className={`w-5 h-5 ${isActive('/shorts') ? 'text-blue-500' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3v18l15-9L5 3z" />
              </svg>
              <span className="text-[11px] text-gray-500 mt-1">Shorts</span>
            </Link>

            <button onClick={() => { onTrendsClick?.(); setMenuOpen(false); }} className="flex flex-col items-center text-center p-1 hover:bg-gray-50 rounded-md">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
              </svg>
              <span className="text-[11px] text-gray-500 mt-1">Trendler</span>
            </button>

            <Link href="/events" className="flex flex-col items-center text-center p-1 hover:bg-gray-50 rounded-md">
              <svg className={`w-5 h-5 ${isActive('/events') ? 'text-blue-500' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[11px] text-gray-500 mt-1">Etkinlikler</span>
            </Link>

            <button onClick={openBot} className="flex flex-col items-center text-center p-1 hover:bg-gray-50 rounded-md">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a6 6 0 016 6v3a3 3 0 01-3 3H9a3 3 0 01-3-3v-3a6 6 0 016-6zm-3 7h.01M15 13h.01M9 18l-2 2m8-2l2 2" />
              </svg>
              <span className="text-[11px] text-gray-500 mt-1">DenizBOT</span>
            </button>

            <Link href="/messages" className="flex flex-col items-center text-center p-1 hover:bg-gray-50 rounded-md relative">
              <svg className={`w-5 h-5 ${isActive('/messages') ? 'text-blue-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {msgCount > 0 && <span className="text-[10px] bg-red-500 text-white rounded-full px-1 mt-1">{msgCount > 99 ? '99+' : msgCount}</span>}
              <span className="text-[11px] text-gray-500 mt-1">Mesajlar</span>
            </Link>

            <Link href="/notifications" className="flex flex-col items-center text-center p-1 hover:bg-gray-50 rounded-md relative">
              <svg className={`w-5 h-5 ${isActive('/notifications') ? 'text-blue-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifCount > 0 && <span className="text-[10px] bg-red-500 text-white rounded-full px-1 mt-1">{notifCount > 99 ? '99+' : notifCount}</span>}
              <span className="text-[11px] text-gray-500 mt-1">Bildirimler</span>
            </Link>

            <Link href={`/profile/${username}`} className="flex flex-col items-center text-center p-1 hover:bg-gray-50 rounded-md">
              <svg className={`w-5 h-5 ${isActive(`/profile/${username}`) ? 'text-blue-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[11px] text-gray-500 mt-1">Profil</span>
            </Link>

            <button onClick={() => { onSettingsClick?.(); setMenuOpen(false); }} className="flex flex-col items-center text-center p-1 hover:bg-gray-50 rounded-md">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[11px] text-gray-500 mt-1">Ayarlar</span>
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="flex flex-col items-center text-center p-1 hover:bg-red-50 rounded-md text-gray-500"
              title="Çıkış"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-[11px] text-gray-500 mt-1">Çıkış</span>
            </button>
          </div>

          {/* Mobile menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg transition flex-shrink-0"
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
          <div className="sm:hidden mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1">
            <MobileNavLink href="/feed" onClick={() => setMenuOpen(false)} icon="🏠">Ana Sayfa</MobileNavLink>
            <MobileNavLink href="/shorts" onClick={() => setMenuOpen(false)} icon="🎬">Shorts</MobileNavLink>
            <MobileNavLink href="/events" onClick={() => setMenuOpen(false)} icon="📅">Etkinlikler</MobileNavLink>
            <button
              onClick={openBot}
              className="text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2.5 rounded-xl text-sm transition flex items-center gap-3"
            >
              <span>🤖</span> DenizBOT
            </button>
            <button
              onClick={() => { onTrendsClick?.(); setMenuOpen(false); }}
              className="text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2.5 rounded-xl text-sm transition flex items-center gap-3"
            >
              <span>🔥</span> Trendler
            </button>
            <MobileNavLink href="/messages" onClick={() => setMenuOpen(false)} icon="💬" badge={msgCount}>Mesajlar</MobileNavLink>
            <MobileNavLink href="/notifications" onClick={() => setMenuOpen(false)} icon="🔔" badge={notifCount}>Bildirimler</MobileNavLink>
            <MobileNavLink href={`/profile/${username}`} onClick={() => setMenuOpen(false)} icon="👤">Profil</MobileNavLink>
            <button
              onClick={() => { onSettingsClick?.(); setMenuOpen(false); }}
              className="text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2.5 rounded-xl text-sm transition flex items-center gap-3"
            >
              <span>⚙️</span> Ayarlar
            </button>
            <button
              onClick={() => { signOut({ callbackUrl: "/auth/login" }); setMenuOpen(false); }}
              className="text-left text-red-500 hover:bg-red-50 px-3 py-2.5 rounded-xl text-sm transition flex items-center gap-3"
            >
              <span>🚪</span> Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavIcon({ href, active, title, children, badge, badgeColor }: {
  href: string;
  active: boolean;
  title: string;
  children: React.ReactNode;
  badge?: number;
  badgeColor?: "red" | "purple";
}) {
  return (
    <Link
      href={href}
      title={title}
      className={`relative p-2.5 rounded-xl transition ${
        active
          ? "text-blue-500 bg-blue-50"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
      {badge !== undefined && badge > 0 && (
        <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1 badge-pulse ${
          badgeColor === "purple" ? "bg-purple-500" : "bg-red-500"
        }`}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick, icon, badge }: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  icon: string;
  badge?: number;
}) {
  return (
    <Link href={href} onClick={onClick} className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2.5 rounded-xl text-sm transition flex items-center gap-3">
      <span>{icon}</span>
      <span className="flex-1">{children}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
          {badge}
        </span>
      )}
    </Link>
  );
}

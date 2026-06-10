"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function LeftSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const v = localStorage.getItem("leftCollapsed");
    setCollapsed(v === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem("leftCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  if (!session) return null;

  const username = (session.user as Record<string, unknown>)?.username as string;
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <aside className={`${collapsed ? "w-16" : "w-56"} flex-shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0 z-40 hidden md:flex flex-col items-center pt-4 transition-all` }>
      <div className="w-full flex items-center justify-between px-3 mb-4">
        <Link href="/feed" className="flex items-center gap-2">
          <img src="/logo.png" alt="DenizMedia" className={`${collapsed ? "w-8 h-8" : "w-10 h-10"}`} />
        </Link>
        <button title={collapsed ? "Aç" : "Kapat"} onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-50">
          {collapsed ? '☰' : '«'}
        </button>
      </div>

      <nav className="flex-1 w-full px-2 space-y-2">
        <NavItem href="/feed" active={isActive("/feed")} collapsed={collapsed}>Ana Sayfa</NavItem>
        <NavItem href="/messages" active={isActive("/messages")} collapsed={collapsed}>Mesajlar</NavItem>
        <NavItem href="/notifications" active={isActive("/notifications")} collapsed={collapsed}>Bildirimler</NavItem>
        <NavItem href={`/profile/${username}`} active={isActive(`/profile/${username}`)} collapsed={collapsed}>Profil</NavItem>
        <NavItem href="/settings" active={isActive("/settings")} collapsed={collapsed}>Ayarlar</NavItem>
      </nav>

      <div className="w-full px-2 pb-6">
        <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className={`w-full text-left px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 ${collapsed ? "text-center" : ""}`}>Çıkış</button>
      </div>
    </aside>
  );
}

function NavItem({ href, children, active, collapsed }: { href: string; children: React.ReactNode; active?: boolean; collapsed?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition w-full ${active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}>
      <span className={`${collapsed ? "hidden" : "truncate"}`}>{children}</span>
      {collapsed && <span className="ml-auto">›</span>}
    </Link>
  );
}

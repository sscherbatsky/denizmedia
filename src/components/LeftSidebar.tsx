"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function LeftSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  if (!session) return null;

  const username = (session.user as Record<string, unknown>)?.username as string;
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <aside className="w-20 lg:w-56 flex-shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0 z-40 hidden md:flex flex-col items-center pt-6">
      <Link href="/feed" className="flex items-center gap-2 mb-6">
        <img src="/logo.png" alt="DenizMedia" className="w-10 h-10" />
      </Link>

      <nav className="flex-1 w-full px-2 space-y-2">
        <NavItem href="/feed" active={isActive("/feed")}>Ana Sayfa</NavItem>
        <NavItem href="/messages" active={isActive("/messages")}>Mesajlar</NavItem>
        <NavItem href="/notifications" active={isActive("/notifications")}>Bildirimler</NavItem>
        <NavItem href={`/profile/${username}`} active={isActive(`/profile/${username}`)}>Profil</NavItem>
        <NavItem href="/settings" active={isActive("/settings")}>Ayarlar</NavItem>
      </nav>

      <div className="w-full px-2 pb-6">
        <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50">Çıkış</button>
      </div>
    </aside>
  );
}

function NavItem({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition w-full ${active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}>
      <span className="truncate">{children}</span>
    </Link>
  );
}

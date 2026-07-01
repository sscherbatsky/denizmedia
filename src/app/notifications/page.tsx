"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface NotificationItem {
  id: string;
  type: string;
  postId: string | null;
  read: boolean;
  createdAt: string;
  from: {
    id: string;
    username: string;
    displayName: string | null;
    profileImage: string | null;
    isVerified: boolean;
  };
}

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => {
          setNotifications(data);
          setLoading(false);
          fetch("/api/notifications", { method: "PUT" });
        });
    }
  }, [status, router]);

  const getNotifText = (type: string) => {
    switch (type) {
      case "mention": return "seni etiketledi";
      case "like": return "gönderini beğendi";
      case "comment": return "gönderine yorum yaptı";
      case "follow": return "seni takip etti";
      case "repost": return "gönderini yeniden paylaştı";
      default: return "etkileşimde bulundu";
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "mention": return <span className="text-purple-500">🏷️</span>;
      case "like": return <span className="text-red-500">❤️</span>;
      case "comment": return <span className="text-blue-500">💬</span>;
      case "follow": return <span className="text-green-500">👤</span>;
      case "repost": return <span className="text-purple-500">🔄</span>;
      default: return <span>🔔</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 page-transition">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Bildirimler</h1>

        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p>Henüz bildirim yok</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <Link
                key={notif.id}
                href={notif.postId ? `/post/${notif.postId}` : `/profile/${notif.from.username}`}
                className={`flex items-center gap-3 p-4 rounded-2xl transition ${
                  notif.read ? "bg-white" : "bg-blue-50 border border-blue-100"
                } hover:shadow-sm`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0 overflow-hidden">
                  {notif.from.profileImage ? (
                    <img src={notif.from.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    notif.from.username[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">{notif.from.displayName || notif.from.username}</span>
                    {notif.from.isVerified && (
                      <svg className="w-3.5 h-3.5 text-blue-500 inline ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                    <span className="text-gray-600"> {getNotifText(notif.type)}</span>
                  </p>
                  <span className="text-gray-400 text-xs">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: tr })}
                  </span>
                </div>
                <div className="text-lg">{getNotifIcon(notif.type)}</div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

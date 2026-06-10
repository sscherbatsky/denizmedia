"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function FollowingPage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchList = async (query?: string) => {
    setLoading(true);
    const url = `/api/users/${username}/following` + (query ? `?q=${encodeURIComponent(query)}` : "");
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) setList(data);
    else {
      router.push(`/profile/${username}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, [username]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6 page-transition">
        <h1 className="text-lg font-bold mb-4">{username} - Takip Edilenler</h1>

        <div className="mb-4">
          <input
            placeholder="Ara"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchList(q)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm"
          />
        </div>

        {loading ? (
          <div className="text-gray-400">Yükleniyor...</div>
        ) : (
          <div className="space-y-3">
            {list.map((u) => (
              <Link key={u.id} href={`/profile/${u.username}`} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {u.profileImage ? <img src={u.profileImage} className="w-full h-full object-cover" /> : <span className="text-lg">{u.username[0]?.toUpperCase()}</span>}
                </div>
                <div>
                  <div className="font-semibold">{u.displayName || u.username}</div>
                  <div className="text-sm text-gray-400">@{u.username}</div>
                </div>
              </Link>
            ))}
            {list.length === 0 && <div className="text-gray-500">Takip edilen yok veya gizli.</div>}
          </div>
        )}
      </main>
    </div>
  );
}

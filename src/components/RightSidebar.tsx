"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type VerseResp = { verse: { surah: string; ayah: number; text: string; translation: string }; hourIndex: number } | { error?: string };

export default function RightSidebar() {
  const [top, setTop] = useState<any[]>([]);
  const [open, setOpen] = useState<boolean>(true);
  const [verse, setVerse] = useState<VerseResp | null>(null);
  const verseTimer = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/top-posts')
      .then(r => r.json())
      .then(data => { if (mounted) setTop(data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      fetch('/api/quran/verse')
        .then(r => r.json())
        .then(d => { if (mounted) setVerse(d); })
        .catch(() => {});
    };
    load();
    // refresh every minute to pick up hour changes
    verseTimer.current = window.setInterval(load, 60 * 1000);
    return () => { mounted = false; if (verseTimer.current) clearInterval(verseTimer.current); };
  }, []);

  return (
    <>
      <div className={`hidden xl:flex ${open ? 'w-80' : 'w-0'} flex-shrink-0 pl-4 transition-all`}>
        {open && (
          <aside>
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">24s İçinde En Çok Beğeni Alanlar</h3>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>
              <div className="space-y-3">
                {top.map(post => (
                  <Link key={post.id} href={`/feed`} className="block bg-white border border-gray-100 rounded-xl p-3 hover:bg-gray-50">
                    <div className="text-sm font-medium text-gray-900 truncate">{post.author.displayName || post.author.username}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{post.content}</div>
                    <div className="text-xs text-gray-400 mt-2">❤️ {post._count?.likes || 0} · {new Date(post.createdAt).toLocaleTimeString()}</div>
                  </Link>
                ))}
                {top.length === 0 && <div className="text-gray-400 text-sm">Henüz veri yok.</div>}

                {verse && 'error' in verse && (
                  <div className="mt-4 text-xs text-red-500">Kuran ayeti yüklenemedi.</div>
                )}

                {verse && !(verse as any).error && (
                  <div className="mt-4 bg-white border border-gray-100 rounded-xl p-3 text-sm">
                    <div className="text-xs text-gray-500">Kuran Saati Ayeti</div>
                    <div className="mt-2 text-gray-800 font-medium">{(verse as any).verse.surah} {(verse as any).verse.ayah}</div>
                    <div className="mt-1 text-gray-700 italic">{(verse as any).verse.text}</div>
                    <div className="mt-2 text-gray-600">{(verse as any).verse.translation}</div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* toggle button when closed */}
      {!open && (
        <button onClick={() => setOpen(true)} className="hidden xl:block fixed right-4 top-1/3 bg-white border border-gray-100 p-2 rounded-full shadow-sm">➤</button>
      )}
    </>
  );
}

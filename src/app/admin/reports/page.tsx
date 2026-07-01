"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);

  const load = async () => {
    const res = await fetch('/api/admin/reports');
    const j = await res.json().catch(() => []);
    setReports(j || []);
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id: string) => {
    await fetch('/api/admin/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId: id, action: 'resolve' }) });
    await load();
  };

  const ban = async (id: string) => {
    await fetch('/api/admin/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId: id, action: 'resolve_and_ban' }) });
    await load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-3">Şikayetler</h2>
          {reports.length === 0 && <div className="text-gray-400">Henüz şikayet yok.</div>}
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="border p-3 rounded flex items-start justify-between">
                <div>
                  <div className="text-sm"><strong>{r.reason}</strong> · {new Date(r.createdAt).toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Gönderen: {r.reporter?.username || '—'} · Hedef: {r.targetUser?.username || '—'}</div>
                  {r.details && <div className="text-sm mt-2">{r.details}</div>}
                </div>
                <div className="flex flex-col gap-2">
                  {!r.resolved && <button onClick={() => resolve(r.id)} className="px-3 py-1 bg-green-50 rounded">Çözüldü</button>}
                  {!r.resolved && <button onClick={() => ban(r.id)} className="px-3 py-1 bg-red-50 text-red-700 rounded">Çöz & Ban</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

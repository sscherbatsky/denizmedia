"use client";

import { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";

interface EventItem {
  id: string;
  title: string;
  date: string;
  description?: string | null;
}

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Etkinlikler</h1>
        <p className="text-gray-600 mb-4">Etkinlikleri burada oluşturup yönetebilirsin.</p>
        <CreateEvent />
      </main>
    </div>
  );
}

function CreateEvent() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    const res = await fetch('/api/events');
    if (res.ok) setEvents(await res.json());
  }

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, date, description: desc }) });
      const j = await res.json();
      if (res.ok) {
        setTitle(''); setDate(''); setDesc(''); fetchEvents();
      } else {
        setError(j.error || 'Etkinlik oluşturulamadı');
      }
    } catch { setError('Etkinlik oluşturulamadı.'); }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mb-3">{error}</div>}
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Etkinlik başlığı" className="w-full mb-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" />
        <input type="datetime-local" value={date} onChange={(e)=>setDate(e.target.value)} className="w-full mb-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" />
        <textarea value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Açıklama (opsiyonel)" className="w-full mb-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" />
        <div className="flex gap-2">
          <button onClick={submit} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Etkinlik Oluştur</button>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Yaklaşan Etkinlikler</h3>
      <div className="space-y-3">
        {events.map((ev)=> (
          <div key={ev.id} className="p-4 bg-white border border-gray-100 rounded-lg">
            <div className="font-semibold text-gray-900">{ev.title}</div>
            <div className="text-sm text-gray-500 mt-1">{new Date(ev.date).toLocaleString("tr-TR")}</div>
            {ev.description && <div className="text-sm text-gray-600 mt-2">{ev.description}</div>}
          </div>
        ))}
        {events.length === 0 && <div className="text-gray-500">Henüz etkinlik yok.</div>}
      </div>
    </div>
  );
}

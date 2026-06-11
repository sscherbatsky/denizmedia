"use client";

import { useState, useEffect } from 'react';

export default function EventsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Etkinlikler</h1>
      <p className="text-gray-600 mb-4">Etkinlikleri burada oluşturup yönetebilirsin. Etkinlik oluşturma yalnızca mavi tikli kullanıcılar içindir.</p>
      <CreateEvent />
    </div>
  );
}

function CreateEvent() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');
  const [events, setEvents] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    const res = await fetch('/api/events');
    if (res.ok) setEvents(await res.json());
  }

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, date, description: desc }) });
      const j = await res.json();
      if (res.ok) {
        setTitle(''); setDate(''); setDesc(''); fetchEvents();
      } else {
        alert(j.error || 'Etkinlik oluşturulamadı');
      }
    } catch (e) { alert('Hata'); }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-4">
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Etkinlik başlığı" className="w-full mb-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" />
        <input value={date} onChange={(e)=>setDate(e.target.value)} placeholder="Tarih (ör: 2026-06-20)" className="w-full mb-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" />
        <textarea value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Açıklama (opsiyonel)" className="w-full mb-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" />
        <div className="flex gap-2">
          <button onClick={submit} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Etkinlik Oluştur</button>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Yaklaşan Etkinlikler</h3>
      <div className="space-y-3">
        {events.map((ev:any)=> (
          <div key={ev.id} className="p-4 bg-white border border-gray-100 rounded-lg">{ev.title} — {ev.date}</div>
        ))}
        {events.length === 0 && <div className="text-gray-500">Henüz etkinlik yok.</div>}
      </div>
    </div>
  );
}

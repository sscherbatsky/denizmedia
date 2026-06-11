"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function BotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
  const [text, setText] = useState("");
  const [localPairs, setLocalPairs] = useState<Record<string, string>>({});
  const boxRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("bot_messages");
    if (saved) setMessages(JSON.parse(saved));
    const lp = localStorage.getItem('bot_local_pairs');
    if (lp) setLocalPairs(JSON.parse(lp));
  }, []);

  useEffect(() => {
    localStorage.setItem("bot_messages", JSON.stringify(messages));
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('bot_local_pairs', JSON.stringify(localPairs));
  }, [localPairs]);

  const send = async () => {
    if (!text.trim()) return;
    const t = text.trim();
    setMessages((m) => [...m, { from: "user", text: t }]);
    setText("");
    // Hide widget on auth pages
    if (pathname?.startsWith('/auth')) return;

    // Check local taught pairs first
    if (localPairs[t]) {
      setMessages((m) => [...m, { from: 'bot', text: localPairs[t] }]);
      return;
    }
    try {
      const res = await fetch('/api/bot/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: t }) });
      const data = await res.json();
      const reply = data.reply || 'Bir şeyler ters gitti.';
      setMessages((m) => [...m, { from: "bot", text: reply }]);
      // If teaching succeeded and server returned pair, store locally as a fallback
      if (data.pair && data.pair.userText && data.pair.replyText) {
        setLocalPairs((p) => ({ ...p, [data.pair.userText]: data.pair.replyText }));
      }
    } catch (e) {
      setMessages((m) => [...m, { from: "bot", text: 'Sunucuya erişilemiyor.' }]);
    }
  };

  if (pathname?.startsWith('/auth')) return null;

  return (
    <>
      <div className="bot-button">
        <button onClick={() => setOpen(!open)} className="bg-blue-500 text-white p-3 rounded-full shadow-lg">🤖</button>
      </div>

      {open && (
        <div className="bot-panel">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg w-80 p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">🤖</div>
                <div>
                  <div className="font-semibold">DenizBot</div>
                  <div className="text-xs text-gray-400">Öğrenen asistan</div>
                </div>
              </div>
              <div>
                <button onClick={() => setOpen(false)} className="text-gray-400">✕</button>
              </div>
            </div>

            <div ref={boxRef} className="bot-messages overflow-y-auto mb-3 p-2 bg-gray-50 rounded" style={{ maxHeight: '50vh' }}>
              {messages.map((m, i) => (
                <div key={i} className={`mb-2 ${m.from === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-3 py-2 rounded-xl ${m.from === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="DenizBot'a mesaj yaz..." className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <button onClick={send} className="bg-blue-500 text-white px-3 py-2 rounded-xl">Gönder</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

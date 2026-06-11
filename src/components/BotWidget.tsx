"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function BotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; from: "user" | "bot"; text: string; typing?: boolean; fullText?: string }>>([]);
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [localPairs, setLocalPairs] = useState<Record<string, string>>({});
  const boxRef = useRef<HTMLDivElement | null>(null);
  const typingTimers = useRef<Record<string, number>>({});
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("bot_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved || '[]');
        const normalized = (parsed as any[]).map((m) => {
          if (m && m.id) return m;
          return { id: String(Date.now()) + Math.random().toString(16).slice(2), from: m.from || 'bot', text: m.text || '', typing: !!m.typing, fullText: m.fullText };
        });
        setMessages(normalized);
      } catch (e) {
        // ignore
      }
    }
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
    // allow sending when either text or an image is present
    if (!text.trim() && !imageBase64) return;
    const t = text.trim();
    const userMsgId = String(Date.now()) + Math.random().toString(16).slice(2);
    setMessages((m) => [...m, { id: userMsgId, from: "user", text: t }]);
    setText("");
    // Hide widget on auth pages
    if (pathname?.startsWith('/auth')) return;

    // Check local taught pairs first (use normalized key)
    const normKey = t.trim().toLowerCase();
    if (localPairs[normKey]) {
      const replyText = localPairs[normKey];
      const id = String(Date.now()) + Math.random().toString(16).slice(2);
      setMessages((m) => [...m, { id, from: 'bot', text: '', typing: true, fullText: replyText }]);
      startTypingAnimation(id, replyText);
      return;
    }
    try {
      // add a typing placeholder while waiting
      const placeholderId = String(Date.now()) + Math.random().toString(16).slice(2);
      setMessages((m) => [...m, { id: placeholderId, from: 'bot', text: '', typing: true }]);

      const body: any = { text: t };
      if (imageBase64) body.imageBase64 = imageBase64;
      const res = await fetch('/api/bot/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      // If OCR text present, show it as a bot message (so user can see what the bot read)
      if (data?.ocrText) {
        const ocrId = String(Date.now()) + Math.random().toString(16).slice(2);
        setMessages((m) => [...m, { id: ocrId, from: 'bot', text: `Görselden okunan: ${data.ocrText}` }]);
      }
      const reply = data.reply || 'Bir şeyler ters gitti.';

      // replace placeholder with typing + fullText
      setMessages((m) => m.map(msg => msg.id === placeholderId ? { ...msg, fullText: reply, typing: true } : msg));
      startTypingAnimation(placeholderId, reply);

      // If server returned a learned pair, always persist it in client localPairs (normalized key)
      if (data?.pair && data.pair.userText && data.pair.replyText) {
        const k = String(data.pair.userText).trim().toLowerCase();
        const v = String(data.pair.replyText);
        setLocalPairs((p) => ({ ...p, [k]: v }));
        // server returned pair; client already persisted it locally (no noisy system message)
      }
      // clear attached image after send
      setImageBase64(null);
    } catch (e) {
      setMessages((m) => [...m, { id: String(Date.now()) + 'err', from: "bot", text: 'Sunucuya erişilemiyor.' }]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string | null;
      if (res) setImageBase64(res);
    };
    reader.readAsDataURL(f);
  };

  function startTypingAnimation(id: string, fullText: string) {
    // clear any existing timer for this id
    if (typingTimers.current[id]) {
      window.clearInterval(typingTimers.current[id]);
    }
    let i = 0;
    const speed = 20 + Math.floor(Math.random() * 40); // ms per char
    typingTimers.current[id] = window.setInterval(() => {
      i += 1;
      setMessages((prev) => prev.map(m => {
        if (m.id !== id) return m;
        const nextText = fullText.slice(0, i);
        const done = i >= fullText.length;
        return { ...m, text: nextText, typing: !done };
      }));
      if (i >= fullText.length) {
        if (typingTimers.current[id]) {
          window.clearInterval(typingTimers.current[id]);
          delete typingTimers.current[id];
        }
      }
    }, speed);
  }

  if (pathname?.startsWith('/auth')) return null;

  return (
    <>
      <div className="bot-button">
        <button onClick={() => setOpen(!open)} className="bg-blue-500 text-white p-3 rounded-full shadow-lg">🤖</button>
      </div>

      {open && (
        <div className="bot-panel">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg w-80 max-w-full p-3 sm:w-80">
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
              {messages.map((m) => (
                <div key={m.id} className={`mb-2 ${m.from === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-3 py-2 rounded-xl ${m.from === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'}`}>
                    {m.from === 'bot' && m.typing && (!m.text || m.text.length === 0) ? (
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'flex-end', height: 18 }}>
                        <span className="bot-dot" style={{ animationDelay: '0s' }} />
                        <span className="bot-dot" style={{ animationDelay: '0.12s' }} />
                        <span className="bot-dot" style={{ animationDelay: '0.24s' }} />
                      </div>
                    ) : (
                      m.text || ''
                    )}
                  </div>
                </div>
              ))}
            </div>
            <style>{`
              .bot-dot {
                width: 6px;
                height: 6px;
                background: #9CA3AF; /* gray-400 */
                border-radius: 50%;
                display: inline-block;
                transform: translateY(0);
                animation: botBounce 0.9s infinite ease-in-out;
              }
              @keyframes botBounce {
                0% { transform: translateY(0); opacity: 0.6 }
                50% { transform: translateY(-6px); opacity: 1 }
                100% { transform: translateY(0); opacity: 0.6 }
              }
            `}</style>

            <div className="flex gap-2 items-center">
              <label className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 cursor-pointer border border-gray-200">
                📷
                <input aria-label="Fotoğraf ekle" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>

              {imageBase64 ? (
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded overflow-hidden">
                  <img src={imageBase64} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={send}
                    title="Fotoğrafı gönder"
                    className="absolute right-1 bottom-1 bg-blue-500 text-white text-xs px-2 py-1 rounded"
                  >
                    Gönder
                  </button>
                </div>
              ) : null}

              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="DenizBot'a mesaj yaz..." className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <button onClick={send} className="bg-blue-500 text-white px-3 py-2 rounded-xl">Gönder</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

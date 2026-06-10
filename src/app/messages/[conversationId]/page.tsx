"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  type: string;
  gifUrl?: string | null;
  voiceUrl?: string | null;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    profileImage: string | null;
    isVerified: boolean;
  };
}

export default function ConversationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/messages/${conversationId}`);
    if (!res.ok) {
      router.push("/messages");
      return;
    }
    const data = await res.json();
    setMessages(data);
    setLoading(false);
  }, [conversationId, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [status, router, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!gifQuery.trim()) {
      setGifResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(gifQuery)}&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&client_key=denizmedia&limit=12`);
        const data = await res.json();
        setGifResults(data.results?.map((r: { media_formats: { tinygif: { url: string } } }) => r.media_formats.tinygif.url) || []);
      } catch {
        setGifResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [gifQuery]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const res = await fetch(`/api/messages/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });

    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    }
  };

  const sendGif = async (gifUrl: string) => {
    const res = await fetch(`/api/messages/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "GIF", type: "gif", gifUrl }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setShowGifSearch(false);
      setGifQuery("");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "voice.webm");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          const res = await fetch(`/api/messages/${conversationId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: "Sesli mesaj", type: "voice", voiceUrl: url }),
          });
          if (res.ok) {
            const msg = await res.json();
            setMessages((prev) => [...prev, msg]);
          }
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 30000);

      const stopBtn = document.createElement("div");
      stopBtn.id = "voice-recording-indicator";
      stopBtn.innerHTML = `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:white;border-radius:24px;padding:24px 32px;box-shadow:0 20px 60px rgba(0,0,0,0.15);text-align:center;border:2px solid #ef4444">
        <div style="font-size:32px;margin-bottom:8px">🎙️</div>
        <p style="font-weight:600;color:#111827;margin-bottom:4px">Kayıt yapılıyor...</p>
        <p style="font-size:12px;color:#9ca3af;margin-bottom:12px">Max 30 saniye</p>
        <button onclick="this.closest('#voice-recording-indicator').remove()" style="background:#ef4444;color:white;border:none;padding:8px 24px;border-radius:999px;cursor:pointer;font-size:14px;font-weight:500">Gönder</button>
      </div>`;
      document.body.appendChild(stopBtn);
      stopBtn.querySelector("button")?.addEventListener("click", () => mediaRecorder.stop());
    } catch {
      alert("Mikrofon erişimi reddedildi");
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/messages" className="text-gray-400 hover:text-gray-900 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Sohbet</h1>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-16 pb-24 overflow-y-auto">
        <div className="space-y-3 py-4">
          {messages.map((msg) => {
            const isMine = msg.sender.id === session?.user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMine ? "bg-blue-500 text-white" : "bg-white border border-gray-200 text-gray-900"} rounded-2xl px-4 py-2.5 shadow-sm`}>
                  {!isMine && (
                    <p className="text-xs text-gray-400 mb-1">{msg.sender.displayName || msg.sender.username}</p>
                  )}
                  {msg.type === "gif" && msg.gifUrl ? (
                    <img src={msg.gifUrl} alt="GIF" className="rounded-lg max-w-[200px]" />
                  ) : msg.type === "voice" && msg.voiceUrl ? (
                    <div className="flex items-center gap-2">
                      <span>🎙️</span>
                      <audio controls src={msg.voiceUrl} className="h-8" style={{ maxWidth: "200px" }} />
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  <p className={`text-xs mt-1 ${isMine ? "text-blue-200" : "text-gray-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* GIF Search Panel */}
      {showGifSearch && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-2xl mx-auto p-3">
            <input
              type="text"
              value={gifQuery}
              onChange={(e) => setGifQuery(e.target.value)}
              placeholder="GIF ara..."
              className="w-full bg-gray-100 text-gray-900 rounded-full px-4 py-2 text-sm border border-gray-200 focus:outline-none focus:border-blue-400 mb-2"
              autoFocus
            />
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {gifResults.map((url, i) => (
                <button key={i} onClick={() => sendGif(url)} className="rounded-lg overflow-hidden hover:opacity-80 transition">
                  <img src={url} alt="GIF" className="w-full h-20 object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-sm">
        <form onSubmit={sendMessage} className="max-w-2xl mx-auto px-4 py-3 flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setShowGifSearch(!showGifSearch)}
            className="text-gray-400 hover:text-purple-500 p-2 rounded-full hover:bg-purple-50 transition"
            title="GIF Gönder"
          >
            <span className="text-lg font-bold">GIF</span>
          </button>
          <button
            type="button"
            onClick={startRecording}
            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
            title="Sesli Mesaj"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mesaj yaz..."
            className="flex-1 bg-gray-100 text-gray-900 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white p-2.5 rounded-full hover:bg-blue-600 disabled:opacity-50 transition shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

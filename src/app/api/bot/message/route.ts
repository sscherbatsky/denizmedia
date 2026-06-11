import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithLocalLLM, embedTextLocal } from "@/lib/ai/local";
import fs from 'fs/promises';
import path from 'path';

function simpleResponder(input: string) {
  const t = input.trim().toLowerCase();
  const jokes = [
    'Neden bilgisayar denize girdi? Çünkü dalga geçiyordu!',
    'Bilgisayar neden aç kalmaz? Çünkü her zaman byte alır!',
    'Programcı neden doğada gezinmeyi sever? Çünkü ağaçlarda recursion var!' 
  ];
  const films = ['The Matrix', 'Inception', 'Interstellar', 'Ayla', 'G.O.R.A.'];
  const greetings = ['Merhaba! Nasıl yardımcı olabilirim?', 'Selam! Nasılsın?', 'Hey! Bir şey sorabilir misin?'];

  if (/^(hi|hello|selam|merhaba|sağol|hey)\b/.test(t)) return greetings[Math.floor(Math.random() * greetings.length)];
  if (t.includes('nasıl') && t.includes('sin')) return ['İyiyim, teşekkürler — ya sen?', 'Gayet iyiyim, sen nasılsın?'][Math.floor(Math.random()*2)];
  if (t.includes('adın') || t.includes('isim')) return 'Ben DenizBot — bana istediğini öğretebilirsin.';
  if (t.includes('şaka') || t.includes('komik')) return jokes[Math.floor(Math.random() * jokes.length)];
  if (t.includes('film')) return `Şunu izleyebilirsin: ${films[Math.floor(Math.random() * films.length)]}`;
  if (t.includes('öneri') || t.includes('tavsiye')) return 'Ne tür önerisi istersin? (film, kitap, yemek)';
  if (t.length < 5) return 'Kısa oldu — örnekler: "Nasılsın?", "Bana bir şaka söyle", "Film önerisi ver". Hangisini istersin?';
  // fallback: more engaging prompt for teaching
  return `Güzel bir giriş: "${input.slice(0, 120)}". Bunu daha iyi öğrenmemi istersen "öğret" komutuyla bana örnekler verebilirsin.`;
}

export async function POST(req: Request) {
  const parsed = await req.json().catch(() => ({} as any));
  const text = (parsed?.text || '').toString();

  try {
    if (!text || typeof text !== 'string') return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 });

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const lower = text.trim().toLowerCase();

    // Identity answers forced to Deniz Bozkurt
    if (/seni\s+yaratan|yaratın|yaratıc(ı|in)|baban\s+kim|bu\s+siteyi\s+kim|yaratıcı\s+kim/i.test(lower)) {
      return NextResponse.json({ reply: 'Deniz Bozkurt' });
    }

    // Correction attempt: "hayır yanlış biliyorsun doğrusu: <doğru cevap>"
    const corrMatch = lower.match(/hayır\s+yanlış[\s\S]*doğru(?:su)?:\s*(.+)$/i);
    if (corrMatch) {
      const newText = corrMatch[1]?.trim();
      // get client IP heuristically
      const headers = (req as any).headers || (req as Request).headers;
      const xf = typeof headers.get === 'function' ? headers.get('x-forwarded-for') : undefined;
      const xr = typeof headers.get === 'function' ? headers.get('x-real-ip') : undefined;
      const clientIp = (xf && xf.split(',')[0].trim()) || xr || '127.0.0.1';
      const adminIp = process.env.ADMIN_IP || process.env.ADMIN_IPS?.split(',')[0]?.trim();
      if (adminIp && clientIp === adminIp) {
        // Admin allowed to edit: update most recent pair (DB or local fallback)
        try {
          const last = await prisma.botPair.findFirst({ orderBy: { createdAt: 'desc' } });
          if (last) {
            const updated = await prisma.botPair.update({ where: { id: last.id }, data: { replyText: newText.slice(0, 240) } });
            // Also update local file if exists
            try {
              const file = path.join(process.cwd(), 'data', 'local_bot_pairs.json');
              const content = await fs.readFile(file, 'utf8').catch(() => '[]');
              const arr = JSON.parse(content || '[]');
              if (arr && arr.length) {
                arr[arr.length - 1].replyText = newText;
                await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8');
              }
            } catch (e) {}
            return NextResponse.json({ reply: 'Öğrenilmiş bilgi güncellendi (admin).' });
          }
        } catch (e) {
          // DB not available -> try local file
          try {
            const file = path.join(process.cwd(), 'data', 'local_bot_pairs.json');
            const content = await fs.readFile(file, 'utf8').catch(() => '[]');
            const arr = JSON.parse(content || '[]');
            if (arr && arr.length) {
              arr[arr.length - 1].replyText = newText;
              await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8');
              return NextResponse.json({ reply: 'Yerelde saklanan son öğrenme güncellendi (admin).' });
            }
          } catch (e2) {}
        }
        return NextResponse.json({ reply: 'Güncellenecek öğe bulunamadı.' });
      } else {
        return NextResponse.json({ reply: 'Bunu değiştiremezsin. Sadece admin (izinli IP) düzeltebilir.' });
      }
    }

    // Teach command: "öğret soru => cevap"  (supports =>, ->, ||) - normalized variables declared outside try
    const teachMatch = text.trim().match(/^öğret\s+(.+)$/i);
    if (teachMatch) {
      const payload = teachMatch[1];
      const parts = payload.split(/=>|->|\|\|/).map((p: string) => p.trim()).filter(Boolean);
      let userText = '';
      let replyText = '';
      if (parts.length >= 2) {
        userText = parts[0].slice(0, 240);
        replyText = parts[1].slice(0, 240);
      } else {
        userText = parts[0].slice(0, 240);
        replyText = parts[0].slice(0, 240);
      }
      try {
        const created = await prisma.botPair.create({ data: { userText, replyText, authorId: userId } });
        try {
          const emb = await embedTextLocal(userText);
          if (emb && emb.length) {
            await prisma.embedding.create({ data: { model: 'local', vector: emb, source: 'botpair', sourceId: created.id } });
          }
        } catch (e) {}
        return NextResponse.json({ reply: 'Teşekkürler — bunu öğrendim.', pair: { userText, replyText } });
      } catch (e) {
        try {
          const dataDir = path.join(process.cwd(), 'data');
          await fs.mkdir(dataDir, { recursive: true });
          const file = path.join(dataDir, 'local_bot_pairs.json');
          let arr: Array<{ userText: string; replyText: string; authorId?: string | null }> = [];
          try {
            const existing = await fs.readFile(file, 'utf8');
            arr = JSON.parse(existing || '[]');
          } catch (readErr) {
            arr = [];
          }
          arr.push({ userText, replyText, authorId: userId });
          await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8');
          return NextResponse.json({ reply: 'Teşekkürler — bunu öğrendim (yerelde saklandı).', pair: { userText, replyText }, storedLocal: true });
        } catch (fsErr) {
          return NextResponse.json({ reply: 'Öğretme sırasında bir hata oluştu.' });
        }
      }
    }

    // First, attempt to generate a reply from a local LLM endpoint (user can run one locally).
    const localReply = await generateWithLocalLLM({ prompt: text, timeoutMs: 2500 });
    if (localReply) {
      try {
        await prisma.botPair.create({ data: { userText: text.slice(0, 240), replyText: localReply.slice(0, 240), authorId: userId } });
      } catch (e) {}
      return NextResponse.json({ reply: localReply });
    }

    // Load local fallback pairs (if any)
    let localPairs: Array<{ userText: string; replyText: string }> = [];
    try {
      const file = path.join(process.cwd(), 'data', 'local_bot_pairs.json');
      const content = await fs.readFile(file, 'utf8').catch(() => '[]');
      localPairs = JSON.parse(content || '[]');
    } catch (e) {
      localPairs = [];
    }

    // Try exact match against local pairs
    const norm = (s: string) => s.trim().toLowerCase();
    const exactLocal = localPairs.find((p) => norm(p.userText) === norm(text));
    if (exactLocal) return NextResponse.json({ reply: exactLocal.replyText });

    // Query DB for exact or containing matches
    try {
      const exactDb = await prisma.botPair.findFirst({ where: { userText: { equals: text, mode: 'insensitive' } } });
      if (exactDb) return NextResponse.json({ reply: exactDb.replyText });
    } catch (e) {}

    // Substring matching in DB
    let reply = '';
    try {
      const key = (text.split(" ")[0] || text).slice(0, 80);
      const candidates = await prisma.botPair.findMany({ where: { userText: { contains: key, mode: 'insensitive' } }, orderBy: { createdAt: 'desc' }, take: 10 });
      if (candidates.length > 0) reply = candidates[0].replyText;
    } catch (e) {
      // ignore DB errors
    }

    // If still no reply, try local substring match
    if (!reply) {
      const sub = localPairs.find((p) => norm(p.userText).includes(norm(text)) || norm(text).includes(norm(p.userText)));
      if (sub) reply = sub.replyText;
    }

    // Fallbacks
    if (!reply) {
      try {
        const any = await prisma.botPair.findMany({ take: 20 });
        if (any.length > 0) reply = any[Math.floor(Math.random() * any.length)].replyText;
      } catch (e) {}
    }
    if (!reply) reply = simpleResponder(text || '');

    // Try to persist this interaction as an example (best-effort)
    try {
      await prisma.botPair.create({ data: { userText: text.slice(0, 240), replyText: reply.slice(0, 240), authorId: userId } });
    } catch (e) {}

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Bot message handler error:', err?.message || err);
    const reply = simpleResponder(text || '');
    return NextResponse.json({ reply });
  }
}

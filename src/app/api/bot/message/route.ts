import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithLocalLLM, embedTextLocal } from "@/lib/ai/local";

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
  const text = parsed?.text;

  try {
    if (!text || typeof text !== 'string') return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 });

    // Teach command: "öğret soru => cevap"  (supports =>, ->, | or :::)
    const teachMatch = text.trim().match(/^öğret\s+(.+)$/i);
    if (teachMatch) {
      const payload = teachMatch[1];
      const parts = payload.split(/=>|->|\|\||\|/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const userText = parts[0].slice(0, 240);
        const replyText = parts[1].slice(0, 240);
        try {
          const created = await prisma.botPair.create({ data: { userText, replyText, authorId: userId } });
          // try embeddings if available
          try {
            const emb = await embedTextLocal(userText);
            if (emb && emb.length) {
              await prisma.embedding.create({ data: { model: 'local', vector: emb, source: 'botpair', sourceId: created.id } });
            }
          } catch (e) {}
          return NextResponse.json({ reply: 'Teşekkürler — bunu öğrendim.' });
        } catch (e) {
          return NextResponse.json({ reply: 'Öğretme sırasında bir hata oluştu.' });
        }
      } else {
        return NextResponse.json({ reply: 'Öğretme formatı: "öğret soru => cevap". Örnek: öğret Merhaba => Selam, nasılsın?' });
      }
    }

    // Save incoming user message (optional)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // First, attempt to generate a reply from a local LLM endpoint (user can run one locally).
    const localReply = await generateWithLocalLLM({ prompt: text, timeoutMs: 3000 });
    if (localReply) {
      // persist as training/example pair as well
      try {
        await prisma.botPair.create({ data: { userText: text.slice(0, 240), replyText: localReply.slice(0, 240), authorId: userId } });
      } catch (e) {
        // ignore persistence errors
      }
      return NextResponse.json({ reply: localReply });
    }

    // Otherwise fallback to DB-based naive retrieval
    const key = (text.split(" ")[0] || text).slice(0, 80);
    const candidates = await prisma.botPair.findMany({ where: { userText: { contains: key, mode: 'insensitive' } }, orderBy: { createdAt: 'desc' }, take: 10 });

    let reply = '';
    if (candidates.length > 0) {
      reply = candidates[0].replyText;
    } else {
      const any = await prisma.botPair.findMany({ take: 20 });
      if (any.length > 0) reply = any[Math.floor(Math.random() * any.length)].replyText;
      else reply = 'Şu an öğreniyorum — biraz sonra daha iyi cevaplar verebilirim.';
    }

    try {
      await prisma.botPair.create({ data: { userText: text.slice(0, 240), replyText: reply.slice(0, 240), authorId: userId } });
    } catch (e) {}

    return NextResponse.json({ reply });
  } catch (err: any) {
    // If DB or other error occurs, log and return a simple local reply so the bot remains responsive.
    console.error('Bot message handler error:', err?.message || err);
    const reply = simpleResponder(text || '');
    return NextResponse.json({ reply });
  }
}

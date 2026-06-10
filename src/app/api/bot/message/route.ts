import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithLocalLLM } from "@/lib/ai/local";

function simpleResponder(input: string) {
  const t = input.trim().toLowerCase();
  if (/^(hi|hello|selam|merhaba|sağol|hey)\b/.test(t)) return 'Merhaba! Ben DenizBot — nasıl yardımcı olabilirim?';
  if (t.includes('nasıl') && t.includes('sin')) return 'İyiyim, teşekkürler — ya sen?';
  if (t.includes('adın') || t.includes('isim')) return 'Ben DenizBot — bana istediğini öğretebilirsin.';
  if (t.includes('şaka') || t.includes('komik')) return 'Neden bilgisayar denize girdi? Çünkü dalga geçiyordu!';
  if (t.length < 5) return 'Kısa oldu — örnekler: "Nasılsın?", "Bana bir şaka söyle", "Film önerisi ver". Hangisini istersin?';
  // fallback short echo + encouragement to teach
  return `Anladım: "${input.slice(0, 120)}" — bunu öğreniyorum.`;
}

export async function POST(req: Request) {
  const parsed = await req.json().catch(() => ({} as any));
  const text = parsed?.text;

  try {
    if (!text || typeof text !== 'string') return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 });

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

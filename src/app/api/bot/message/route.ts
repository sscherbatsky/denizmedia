import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text || typeof text !== 'string') return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 });

  // Save incoming user message (optional)
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || null;

  // Try to find a matching pair (very naive): find BotPair where userText included in incoming
  const candidates = await prisma.botPair.findMany({ where: { userText: { contains: text.split(' ')[0] || text, mode: 'insensitive' } }, orderBy: { createdAt: 'desc' }, take: 10 });

  let reply = '';
  if (candidates.length > 0) {
    // pick most recent
    reply = candidates[0].replyText;
  } else {
    // fallback: pick a random existing reply
    const any = await prisma.botPair.findMany({ take: 20 });
    if (any.length > 0) reply = any[Math.floor(Math.random() * any.length)].replyText;
    else reply = 'Şu an öğreniyorum — biraz sonra daha iyi cevaplar verebilirim.';
  }

  // store the user message as training data (without reply) to allow later pairing
  await prisma.botPair.create({ data: { userText: text.slice(0, 240), replyText: reply.slice(0, 240), authorId: userId } });

  return NextResponse.json({ reply });
}

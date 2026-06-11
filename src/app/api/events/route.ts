import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'data', 'events.json');
    const content = await fs.readFile(file, 'utf8').catch(() => '[]');
    const arr = JSON.parse(content || '[]');
    return NextResponse.json(arr);
  } catch (e) {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Giriş yapmalısın.' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });

  // Only verified (mavi tik) users can create events
  if (!me.isVerified) return NextResponse.json({ error: 'Etkinlik oluşturma yetkiniz yok. (Sadece mavi tikli kullanıcılar)' }, { status: 403 });

  const body = await req.json().catch(() => ({} as any));
  const title = String(body.title || '').trim();
  const date = String(body.date || '').trim();
  const description = String(body.description || '').trim();

  if (!title || !date) return NextResponse.json({ error: 'Başlık ve tarih gerekli.' }, { status: 400 });

  try {
    const file = path.join(process.cwd(), 'data', 'events.json');
    await fs.mkdir(path.dirname(file), { recursive: true });
    const existing = await fs.readFile(file, 'utf8').catch(() => '[]');
    const arr = JSON.parse(existing || '[]');
    const ev = { id: Date.now().toString(36), title, date, description, authorId: session.user.id };
    arr.unshift(ev);
    await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8');
    return NextResponse.json({ success: true, event: ev });
  } catch (e) {
    return NextResponse.json({ error: 'Etkinlik oluşturulamadı.' }, { status: 500 });
  }
}

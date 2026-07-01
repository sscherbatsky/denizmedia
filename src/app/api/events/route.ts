import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
      include: {
        author: {
          select: { username: true, displayName: true, profileImage: true, isVerified: true },
        },
      },
    });
    return NextResponse.json(events);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Giriş yapmalısın.' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });

  const body = await req.json().catch(() => ({})) as {
    title?: unknown;
    date?: unknown;
    description?: unknown;
  };
  const title = String(body.title || '').trim();
  const date = String(body.date || '').trim();
  const description = String(body.description || '').trim();

  if (!title || !date) return NextResponse.json({ error: 'Başlık ve tarih gerekli.' }, { status: 400 });

  const eventDate = new Date(date);
  if (Number.isNaN(eventDate.getTime())) {
    return NextResponse.json({ error: 'Geçerli bir tarih girin.' }, { status: 400 });
  }

  try {
    const ev = await prisma.event.create({
      data: { title, date: eventDate, description: description || null, authorId: session.user.id },
    });
    return NextResponse.json({ success: true, event: ev });
  } catch {
    return NextResponse.json({ error: 'Etkinlik oluşturulamadı.' }, { status: 500 });
  }
}

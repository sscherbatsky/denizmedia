import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });

  try {
    const { password, durationDays } = await req.json().catch(() => ({ password: "" }));
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user?.password) {
      return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 });
    }

    const isValid = await compare(String(password || ""), user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Şifre hatalı.' }, { status: 400 });
    }

    const now = new Date();
    const permanentCloseAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const parsedDuration = Number(durationDays);
    const deactivateUntil = Number.isFinite(parsedDuration) && parsedDuration > 0
      ? new Date(now.getTime() + Math.min(parsedDuration, 30) * 24 * 60 * 60 * 1000)
      : null;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isRestricted: true,
        deactivatedAt: now,
        deactivateUntil,
        permanentCloseAt,
        permanentlyClosedAt: null,
      },
    });

    return NextResponse.json({ success: true, permanentCloseAt, deactivateUntil });
  } catch {
    return NextResponse.json({ error: 'Hesap kapatılamadı.' }, { status: 500 });
  }
}

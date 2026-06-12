import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });

  try {
    // Mark account as restricted so user cannot post or interact
    await prisma.user.update({ where: { id: session.user.id }, data: { isRestricted: true } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Hesap kapatılamadı.' }, { status: 500 });
  }
}

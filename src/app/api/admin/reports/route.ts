import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;
  const u = await prisma.user.findUnique({ where: { id: session.user.id } });
  return !!u?.isAdmin;
}

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  const reports = await prisma.report.findMany({ include: { reporter: true, targetUser: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(reports);
}

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  const body = await req.json();
  const { reportId, action, banUser } = body;
  if (!reportId) return NextResponse.json({ error: 'reportId gerekli.' }, { status: 400 });

  if (action === 'resolve') {
    await prisma.report.update({ where: { id: reportId }, data: { resolved: true } });
    return NextResponse.json({ success: true });
  }

  if (action === 'resolve_and_ban') {
    const r = await prisma.report.findUnique({ where: { id: reportId } });
    if (r?.targetUserId) {
      await prisma.user.update({ where: { id: r.targetUserId }, data: { isBanned: true, banReason: 'Admin kararı (şikayet)' } });
    }
    await prisma.report.update({ where: { id: reportId }, data: { resolved: true } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Geçersiz aksiyon.' }, { status: 400 });
}

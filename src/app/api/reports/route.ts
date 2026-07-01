import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });

  const { targetUserId, postId, reason, details } = await req.json();
  if (!reason) return NextResponse.json({ error: "Neden gerekli." }, { status: 400 });

  const report = await prisma.report.create({
    data: { reporterId: session.user.id, targetUserId: targetUserId || null, postId: postId || null, reason, details: details || null },
  });

  return NextResponse.json(report, { status: 201 });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const shorts = await prisma.short.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { username: true, displayName: true, profileImage: true, isVerified: true },
      },
    },
  });

  return NextResponse.json(shorts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { videoUrl } = await req.json().catch(() => ({ videoUrl: "" })) as { videoUrl?: unknown };
  const url = String(videoUrl || "").trim();
  if (!url) {
    return NextResponse.json({ error: "Video gerekli." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.isBanned || user.isRestricted) {
    return NextResponse.json({ error: "Shorts yükleme yetkiniz yok." }, { status: 403 });
  }

  const short = await prisma.short.create({
    data: { videoUrl: url, authorId: session.user.id },
    include: {
      author: {
        select: { username: true, displayName: true, profileImage: true, isVerified: true },
      },
    },
  });

  return NextResponse.json(short, { status: 201 });
}

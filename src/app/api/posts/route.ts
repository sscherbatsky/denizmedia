import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      author: {
        select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true },
      },
      likes: { select: { userId: true } },
      comments: { select: { id: true } },
    },
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { content } = await req.json();
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Gönderi içeriği boş olamaz." }, { status: 400 });
  }

  if (content.length > 500) {
    return NextResponse.json({ error: "Gönderi en fazla 500 karakter olabilir." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.isBanned || user.isRestricted) {
    return NextResponse.json({ error: "Gönderi paylaşma yetkiniz yok." }, { status: 403 });
  }

  if (user.timeoutUntil && new Date(user.timeoutUntil) > new Date()) {
    return NextResponse.json({ error: "Zaman aşımı süreniz dolmadı." }, { status: 403 });
  }

  const post = await prisma.post.create({
    data: { content: content.trim(), authorId: session.user.id },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true },
      },
      likes: { select: { userId: true } },
      comments: { select: { id: true } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { content } = await req.json();
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Yorum boş olamaz." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.isBanned || user.isRestricted) {
    return NextResponse.json({ error: "Yorum yapma yetkiniz yok." }, { status: 403 });
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      authorId: session.user.id,
      postId: params.id,
    },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true },
      },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

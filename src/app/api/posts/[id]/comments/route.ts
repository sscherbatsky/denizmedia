import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

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

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (post) await createNotification(post.authorId, session.user.id, "comment", params.id);

  // parse mentions in comment and notify mentioned users
  try {
    const mentionRegex = /@([a-zA-Z0-9_\.\-]+)/g;
    const mentionMatches = Array.from(content.matchAll(mentionRegex)).map((m) => m[1]);
    for (const uname of Array.from(new Set(mentionMatches))) {
      const mentioned = await prisma.user.findUnique({ where: { username: uname } });
      if (mentioned) {
        await createNotification(mentioned.id, session.user.id, 'mention', params.id);
      }
    }
  } catch (e) {
    console.error('Mention parse error', e);
  }

  return NextResponse.json(comment, { status: 201 });
}

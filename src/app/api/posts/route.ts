import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const posts = await prisma.post.findMany({
    where: {
      AND: [
        // exclude posts where either party blocked the other
        ...(session?.user?.id
          ? [
              {
                NOT: {
                  OR: [
                    { author: { blocking: { some: { blockedId: session.user.id } } } },
                    { author: { blockedBy: { some: { blockerId: session.user.id } } } },
                  ],
                },
              },
            ]
          : []),
        {
          OR: [
            { author: { isPrivate: false } },
            ...(session?.user?.id
              ? [
                  { authorId: session.user.id },
                  {
                    author: {
                      followers: {
                        some: {
                          followerId: session.user.id,
                          accepted: true,
                        },
                      },
                    },
                  },
                ]
              : []),
          ],
        },
      ],
    },
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

  const { content, image } = await req.json();
  if ((!content || content.trim().length === 0) && !image) {
    return NextResponse.json({ error: "Gönderi içeriği veya fotoğraf gerekli." }, { status: 400 });
  }

  if (content && content.length > 500) {
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
    data: { content: (content || "").trim(), image: image || null, authorId: session.user.id },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true },
      },
      likes: { select: { userId: true } },
      comments: { select: { id: true } },
    },
  });

  // parse hashtags and mentions after creating post
  try {
    const text = (content || "").trim();
    // hashtags: words starting with #, allow Turkish letters, numbers, underscores
    const hashtagRegex = /#([\p{L}0-9_]+)/giu;
    const mentionRegex = /@([a-zA-Z0-9_\.\-]+)/g;

    const hashtagMatches = Array.from(text.matchAll(hashtagRegex)).map((m) => m[1].toLowerCase());
    const mentionMatches = Array.from(text.matchAll(mentionRegex)).map((m) => m[1]);

    // handle hashtags
    for (const tag of Array.from(new Set(hashtagMatches))) {
      const h = await prisma.hashtag.upsert({
        where: { tag },
        update: { count: { increment: 1 } },
        create: { tag, count: 1 },
      });
      // associate post with hashtag
      try {
        await prisma.postHashtag.create({ data: { postId: post.id, hashtagId: h.id } });
      } catch (e) {
        // ignore unique constraint errors
      }
    }

    // handle mentions -> notify mentioned users
    for (const uname of Array.from(new Set(mentionMatches))) {
      const mentioned = await prisma.user.findUnique({ where: { username: uname } });
      if (mentioned) {
        // create mention notification
        try {
          const { createNotification } = await import('@/lib/notifications');
          await createNotification(mentioned.id, session.user.id, 'mention', post.id);
        } catch (e) {
          // ignore notification errors
        }
      }
    }
  } catch (e) {
    console.error('Hashtag/mention parse error', e);
  }

  return NextResponse.json(post, { status: 201 });
}

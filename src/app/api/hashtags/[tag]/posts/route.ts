import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag || "");
  if (!tag) return NextResponse.json({ error: "Tag gerekli." }, { status: 400 });

  const hashtag = await prisma.hashtag.findUnique({ where: { tag } });
  if (!hashtag) return NextResponse.json([], { status: 200 });

  const ph = await prisma.postHashtag.findMany({
    where: { hashtagId: hashtag.id },
    include: { post: { include: { author: { select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true } }, likes: { select: { userId: true } }, comments: { select: { id: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const posts = ph.map((p) => p.post);
  return NextResponse.json(posts);
}

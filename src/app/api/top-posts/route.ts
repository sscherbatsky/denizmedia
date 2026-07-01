import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const posts = await prisma.post.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { likes: { _count: "desc" } },
    take: 5,
    include: { author: { select: { id: true, username: true, displayName: true } }, _count: { select: { likes: true } } },
  });

  return NextResponse.json(posts);
}

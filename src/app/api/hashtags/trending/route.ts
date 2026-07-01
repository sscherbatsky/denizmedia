import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const groups = await prisma.postHashtag.groupBy({
      by: ["hashtagId"],
      where: { createdAt: { gte: cutoff } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const results = [] as Array<{ tag: string; count: number }>;
    for (const g of groups) {
      const h = await prisma.hashtag.findUnique({ where: { id: g.hashtagId } });
      if (h) results.push({ tag: h.tag, count: g._count.id });
    }

    return NextResponse.json(results);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 500 });
  }
}

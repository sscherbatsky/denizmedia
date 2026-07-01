import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get all postHashtags from last 24h
    const postHashtags = await prisma.postHashtag.findMany({
      where: { createdAt: { gte: cutoff } },
      include: { hashtag: true },
    });

    // Count by hashtag
    const counts = new Map<string, { count: number; tag: string }>();
    for (const ph of postHashtags) {
      if (!counts.has(ph.hashtagId)) {
        counts.set(ph.hashtagId, { count: 0, tag: ph.hashtag.tag });
      }
      counts.get(ph.hashtagId)!.count++;
    }

    // Sort and return top 5
    const results = Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ tag, count }) => ({ tag, count }));

    return NextResponse.json(results);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 500 });
  }
}

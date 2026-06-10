import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { username: string } }) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;

  const targetUser = await prisma.user.findUnique({ where: { username: params.username } });
  if (!targetUser) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id;
  const isOwner = viewerId === targetUser.id;

  if (!targetUser.showFollowing && !isOwner) {
    return NextResponse.json({ error: "Bu kullanıcının takip listesi gizli." }, { status: 403 });
  }

  if (targetUser.isPrivate && !isOwner) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId || "", followingId: targetUser.id } },
    });
    if (!follow || !follow.accepted) {
      return NextResponse.json({ error: "Bu kullanıcının takip listesine erişiminiz yok." }, { status: 403 });
    }
  }

  const whereClause: any = { followerId: targetUser.id, accepted: true };
  if (q) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true },
      take: 50,
    });
    const followingIds = new Set((await prisma.follow.findMany({ where: whereClause })).map((f) => f.followingId));
    const filtered = users.filter((u) => followingIds.has(u.id));
    return NextResponse.json(filtered);
  }

  const following = await prisma.follow.findMany({
    where: whereClause,
    include: { following: { select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(following.map((f) => f.following));
}

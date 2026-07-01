import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { username: string } }) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({ where: { username: params.username } });
  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  // If user is private, only allow owner or accepted followers
  if (user.isPrivate) {
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;
    if (viewerId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId || "", followingId: user.id } },
      });
      if (!follow || !follow.accepted) {
        return NextResponse.json({ error: "Bu hesabın gönderilerini görüntüleme yetkiniz yok." }, { status: 403 });
      }
    }
  }

  // If viewer and profile user have a block relation, deny access
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id;
  if (viewerId && viewerId !== user.id) {
    const blocked = await prisma.block.findFirst({ where: { OR: [{ blockerId: user.id, blockedId: viewerId }, { blockerId: viewerId, blockedId: user.id }] } });
    if (blocked) {
      return NextResponse.json({ error: "Bu kullanıcıya erişiminiz engellendi." }, { status: 403 });
    }
  }

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
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

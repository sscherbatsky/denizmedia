import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      profileImage: true,
      isVerified: true,
      isAdmin: true,
      isPrivate: true,
      showFollowers: true,
      showFollowing: true,
      themeColor: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user || user.isAdmin) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  let isFollowing = false;
  let followPending = false;
  if (session?.user?.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow?.accepted;
    followPending = !!follow && !follow.accepted;
  }

  const isOwnProfile = session?.user?.id === user.id;

  if (session?.user?.id && session.user.id !== user.id) {
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: session.user.id },
          { blockerId: session.user.id, blockedId: user.id },
        ],
      },
    });
    if (blocked) {
      isBlocked = true;
      return NextResponse.json({ error: "Bu kullanıcıya erişiminiz engellendi." }, { status: 403 });
    }
  }

  const canViewPosts = !user.isPrivate || isOwnProfile || isFollowing;

  return NextResponse.json({ ...user, isFollowing, followPending, canViewPosts, isBlocked });
}

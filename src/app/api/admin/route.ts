import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.isAdmin === true;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "users") {
    // expose password hash and lastIp to admin per request
    const users = await prisma.user.findMany({
      where: { isAdmin: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        profileImage: true,
        password: true,
        lastIp: true,
        isVerified: true,
        isBanned: true,
        banReason: true,
        timeoutUntil: true,
        isRestricted: true,
        createdAt: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });
    return NextResponse.json(users);
  }

  if (action === "stats") {
    const [userCount, postCount, commentCount] = await Promise.all([
      prisma.user.count({ where: { isAdmin: false } }),
      prisma.post.count(),
      prisma.comment.count(),
    ]);
    return NextResponse.json({ userCount, postCount, commentCount });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { action, userId, reason, duration, postId } = await req.json();

  switch (action) {
    case "ban": {
      await prisma.user.update({
        where: { id: userId },
        data: { isBanned: true, banReason: reason || "Kural ihlali" },
      });
      return NextResponse.json({ success: true, message: "Kullanıcı banlandı." });
    }
    case "unban": {
      await prisma.user.update({
        where: { id: userId },
        data: { isBanned: false, banReason: null },
      });
      return NextResponse.json({ success: true, message: "Ban kaldırıldı." });
    }
    case "verify": {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });
      return NextResponse.json({ success: true, message: "Mavi tik verildi." });
    }
    case "unverify": {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: false },
      });
      return NextResponse.json({ success: true, message: "Mavi tik kaldırıldı." });
    }
    case "timeout": {
      const hours = parseInt(duration) || 24;
      const until = new Date(Date.now() + hours * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: userId },
        data: { timeoutUntil: until },
      });
      return NextResponse.json({ success: true, message: `${hours} saat zaman aşımı uygulandı.` });
    }
    case "remove_timeout": {
      await prisma.user.update({
        where: { id: userId },
        data: { timeoutUntil: null },
      });
      return NextResponse.json({ success: true, message: "Zaman aşımı kaldırıldı." });
    }
    case "restrict": {
      await prisma.user.update({
        where: { id: userId },
        data: { isRestricted: true },
      });
      return NextResponse.json({ success: true, message: "Erişim engeli getirildi." });
    }
    case "unrestrict": {
      await prisma.user.update({
        where: { id: userId },
        data: { isRestricted: false },
      });
      return NextResponse.json({ success: true, message: "Erişim engeli kaldırıldı." });
    }
    case "delete_post": {
      await prisma.post.delete({ where: { id: postId } });
      return NextResponse.json({ success: true, message: "Gönderi silindi." });
    }
    case "delete_user": {
      // remove user completely from system
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ success: true, message: "Kullanıcı tamamen silindi.", userId });
    }
    default:
      return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  }
}

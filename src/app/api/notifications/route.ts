import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      from: {
        select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true },
      },
    },
  });

  return NextResponse.json(notifications);
}

export async function PUT() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { notificationId } = await req.json();
  if (!notificationId) {
    return NextResponse.json({ error: "notificationId gerekli." }, { status: 400 });
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}

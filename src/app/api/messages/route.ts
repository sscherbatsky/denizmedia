import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: {
            select: { id: true, username: true, displayName: true },
          },
        },
      },
    },
  });

  return NextResponse.json(conversations);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { username } = await req.json();
  if (!username) {
    return NextResponse.json({ error: "Kullanıcı adı gerekli." }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser || targetUser.isAdmin) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  if (targetUser.id === session.user.id) {
    return NextResponse.json({ error: "Kendinize mesaj gönderemezsiniz." }, { status: 400 });
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: session.user.id } } },
        { participants: { some: { userId: targetUser.id } } },
      ],
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true },
          },
        },
      },
    },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: session.user.id },
          { userId: targetUser.id },
        ],
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true },
          },
        },
      },
    },
  });

  return NextResponse.json(conversation, { status: 201 });
}

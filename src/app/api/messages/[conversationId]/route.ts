import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { conversationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      userId_conversationId: {
        userId: session.user.id,
        conversationId: params.conversationId,
      },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "Bu sohbete erişiminiz yok." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;
  const skip = (page - 1) * limit;

  const messages = await prisma.message.findMany({
    where: { conversationId: params.conversationId },
    orderBy: { createdAt: "asc" },
    skip,
    take: limit,
    include: {
      sender: {
        select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true },
      },
    },
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request, { params }: { params: { conversationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      userId_conversationId: {
        userId: session.user.id,
        conversationId: params.conversationId,
      },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "Bu sohbete erişiminiz yok." }, { status: 403 });
  }

  const { content, type, gifUrl, voiceUrl } = await req.json();
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      type: type || "text",
      gifUrl: gifUrl || null,
      voiceUrl: voiceUrl || null,
      senderId: session.user.id,
      conversationId: params.conversationId,
    },
    include: {
      sender: {
        select: { id: true, username: true, displayName: true, profileImage: true, isVerified: true },
      },
    },
  });

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}

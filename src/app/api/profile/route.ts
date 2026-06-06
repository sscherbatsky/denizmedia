import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUsername } from "@/lib/username";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      profileImage: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { username, displayName, bio, profileImage } = await req.json();

  if (username) {
    const validation = validateUsername(username);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 400 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(username && { username: username.toLowerCase() }),
      ...(displayName !== undefined && { displayName }),
      ...(bio !== undefined && { bio }),
      ...(profileImage !== undefined && { profileImage }),
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      profileImage: true,
      isVerified: true,
    },
  });

  return NextResponse.json(user);
}

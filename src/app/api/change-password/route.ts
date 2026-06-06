import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { oldPassword, newPassword } = await req.json();

  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "Eski ve yeni şifre gerekli." }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Yeni şifre en az 6 karakter olmalı." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) {
    return NextResponse.json(
      { error: "Google/X ile giriş yaptıysanız şifre değiştiremezsiniz. Önce ayarlardan şifre belirleyin." },
      { status: 400 }
    );
  }

  const isValid = await compare(oldPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Eski şifre hatalı." }, { status: 400 });
  }

  const hashedPassword = await hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: "Şifre başarıyla değiştirildi." });
}

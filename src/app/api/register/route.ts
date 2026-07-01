import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateUsername } from "@/lib/username";

export async function POST(req: Request) {
  try {
    const { email, username, password, displayName, bio, profileImage } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json({ error: "Email, kullanıcı adı ve şifre gerekli." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Geçerli bir email adresi girin." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalı." }, { status: 400 });
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json({ error: usernameValidation.error }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Bu email adresi zaten kullanılıyor." }, { status: 400 });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (existingUsername) {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username: username.toLowerCase(),
        displayName: displayName || username,
        bio: bio || null,
        profileImage: profileImage || null,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bir hata oluştu.";
    if (typeof message === "string" && message.includes("P1001")) {
      return NextResponse.json({ error: "Veritabanına bağlanılamadı. .env DATABASE_URL ayarlarını kontrol edin." }, { status: 500 });
    }
    return NextResponse.json({ error: message || "Bir hata oluştu." }, { status: 500 });
  }
}

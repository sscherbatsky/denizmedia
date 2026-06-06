import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  const body = await req.json();
  const { email, action, code } = body;

  if (action === "send") {
    if (!email) {
      return NextResponse.json({ error: "Email gerekli." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Geçerli bir email adresi girin." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Bu email adresi zaten kullanılıyor." }, { status: 400 });
    }

    await prisma.verificationCode.deleteMany({ where: { email } });

    const newCode = generateCode();
    await prisma.verificationCode.create({
      data: {
        email,
        code: newCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    console.log(`[EMAIL VERIFICATION] Code for ${email}: ${newCode}`);

    return NextResponse.json({
      success: true,
      message: "Doğrulama kodu gönderildi.",
      devCode: process.env.NODE_ENV === "development" ? newCode : undefined,
    });
  }

  if (action === "verify") {
    if (!email || !code) {
      return NextResponse.json({ error: "Email ve kod gerekli." }, { status: 400 });
    }

    const verification = await prisma.verificationCode.findFirst({
      where: { email, code },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json({ error: "Geçersiz doğrulama kodu." }, { status: 400 });
    }

    if (new Date() > verification.expiresAt) {
      return NextResponse.json({ error: "Doğrulama kodunun süresi dolmuş." }, { status: 400 });
    }

    await prisma.verificationCode.deleteMany({ where: { email } });

    return NextResponse.json({ success: true, verified: true });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}

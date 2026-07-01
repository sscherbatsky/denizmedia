import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });

  const { blockedId } = await req.json();
  if (!blockedId) return NextResponse.json({ error: "blockedId gerekli." }, { status: 400 });

  if (blockedId === session.user.id) return NextResponse.json({ error: "Kendinizi engelleyemezsiniz." }, { status: 400 });

  try {
    const b = await prisma.block.create({ data: { blockerId: session.user.id, blockedId } });
    return NextResponse.json(b, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Zaten engellediniz veya hata." }, { status: 400 });
  }
}

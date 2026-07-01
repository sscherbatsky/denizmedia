import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { blockedId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });

  try {
    await prisma.block.delete({
      where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: params.blockedId } },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Engel kaldırılamadı." }, { status: 400 });
  }
}

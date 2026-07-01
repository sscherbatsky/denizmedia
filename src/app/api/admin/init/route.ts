import { NextResponse } from "next/server";
import { ensureAdminExists } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureAdminExists();
  return NextResponse.json({ ok: true });
}

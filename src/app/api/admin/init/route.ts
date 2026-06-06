import { NextResponse } from "next/server";
import { ensureAdminExists } from "@/lib/admin";

export async function GET() {
  await ensureAdminExists();
  return NextResponse.json({ ok: true });
}

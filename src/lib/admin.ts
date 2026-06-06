import { prisma } from "./prisma";
import { hash } from "bcryptjs";

const ADMIN_IP = process.env.ADMIN_IP || "127.0.0.1";

export function isAdminIP(ip: string | null): boolean {
  if (!ADMIN_IP || ADMIN_IP === "*") return true;
  if (!ip) return false;
  const cleanIp = ip.replace("::ffff:", "");
  return cleanIp === ADMIN_IP || cleanIp === "127.0.0.1" || cleanIp === "::1";
}

export async function ensureAdminExists() {
  const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (!admin) {
    const hashedPassword = await hash("admin", 12);
    await prisma.user.create({
      data: {
        email: "admin@denizmedia.local",
        username: "admin",
        displayName: "Admin",
        password: hashedPassword,
        isAdmin: true,
        isVerified: true,
      },
    });
  }
}

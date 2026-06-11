import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { hash } from "bcryptjs";

const ADMIN_IPS_FILE = path.join(process.cwd(), "data", "admin_ips.json");
const OWNER_EMAIL = process.env.ADMIN_OWNER_EMAIL || process.env.OWNER_EMAIL || "";

async function loadAllowedIps(): Promise<string[]> {
  try {
    const raw = await fs.readFile(ADMIN_IPS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (e) {
    // create file with default value if missing
    try {
      await fs.mkdir(path.dirname(ADMIN_IPS_FILE), { recursive: true });
      await fs.writeFile(ADMIN_IPS_FILE, JSON.stringify(["95.5.189.107"], null, 2), "utf-8");
      return ["95.5.189.107"];
    } catch (e) {
      return ["95.5.189.107"];
    }
  }
}

async function saveAllowedIps(ips: string[]) {
  await fs.writeFile(ADMIN_IPS_FILE, JSON.stringify(ips, null, 2), "utf-8");
}

function getRequesterIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "";
}

async function isRequesterAdmin(req: Request) {
  const ip = getRequesterIp(req);
  const ips = await loadAllowedIps();
  if (ips.includes(ip)) return true;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.isAdmin === true;
}

async function isAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.isAdmin === true;
}

export async function GET(req: Request) {
  if (!(await isRequesterAdmin(req))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "users") {
    // expose password hash and lastIp to admin per request
    const users = await prisma.user.findMany({
      where: { isAdmin: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        profileImage: true,
        password: true,
        lastIp: true,
        isVerified: true,
        isBanned: true,
        banReason: true,
        timeoutUntil: true,
        isRestricted: true,
        createdAt: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });
    return NextResponse.json(users);
  }

  if (action === "whitelist") {
    const ips = await loadAllowedIps();
    return NextResponse.json({ ips, ownerEmail: OWNER_EMAIL });
  }

  if (action === "stats") {
    const [userCount, postCount, commentCount] = await Promise.all([
      prisma.user.count({ where: { isAdmin: false } }),
      prisma.post.count(),
      prisma.comment.count(),
    ]);
    return NextResponse.json({ userCount, postCount, commentCount });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}

export async function POST(req: Request) {
  if (!(await isRequesterAdmin(req))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const body = await req.json();
  const { action, userId, reason, duration, postId, newPassword } = body;

  switch (action) {
    case "ban": {
      await prisma.user.update({
        where: { id: userId },
        data: { isBanned: true, banReason: reason || "Kural ihlali" },
      });
      return NextResponse.json({ success: true, message: "Kullanıcı banlandı." });
    }
    case "unban": {
      await prisma.user.update({
        where: { id: userId },
        data: { isBanned: false, banReason: null },
      });
      return NextResponse.json({ success: true, message: "Ban kaldırıldı." });
    }
    case "verify": {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });
      return NextResponse.json({ success: true, message: "Mavi tik verildi." });
    }
    case "unverify": {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: false },
      });
      return NextResponse.json({ success: true, message: "Mavi tik kaldırıldı." });
    }
    case "timeout": {
      const hours = parseInt(duration) || 24;
      const until = new Date(Date.now() + hours * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: userId },
        data: { timeoutUntil: until },
      });
      return NextResponse.json({ success: true, message: `${hours} saat zaman aşımı uygulandı.` });
    }
    case "remove_timeout": {
      await prisma.user.update({
        where: { id: userId },
        data: { timeoutUntil: null },
      });
      return NextResponse.json({ success: true, message: "Zaman aşımı kaldırıldı." });
    }
    case "restrict": {
      await prisma.user.update({
        where: { id: userId },
        data: { isRestricted: true },
      });
      return NextResponse.json({ success: true, message: "Erişim engeli getirildi." });
    }
    case "unrestrict": {
      await prisma.user.update({
        where: { id: userId },
        data: { isRestricted: false },
      });
      return NextResponse.json({ success: true, message: "Erişim engeli kaldırıldı." });
    }
    case "delete_post": {
      if (!postId) return NextResponse.json({ error: "postId gerekli." }, { status: 400 });
      await prisma.post.delete({ where: { id: postId } });
      return NextResponse.json({ success: true, message: "Gönderi silindi." });
    }
    case "delete_user": {
      if (!userId) return NextResponse.json({ error: "userId gerekli." }, { status: 400 });
      const target = await prisma.user.findUnique({ where: { id: userId } });
      if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
      if (target.isAdmin) return NextResponse.json({ error: "Admin hesapları silinemez." }, { status: 403 });
      // remove user completely from system (cascades where defined)
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ success: true, message: "Kullanıcı tamamen silindi.", userId });
    }
    case "delete_user_posts": {
      if (!userId) return NextResponse.json({ error: "userId gerekli." }, { status: 400 });
      const result = await prisma.post.deleteMany({ where: { authorId: userId } });
      return NextResponse.json({ success: true, message: `${result.count} gönderi silindi.` });
    }
    case "set_password": {
      if (!userId) return NextResponse.json({ error: "userId gerekli." }, { status: 400 });
      if (typeof newPassword !== "string") return NextResponse.json({ error: "newPassword gerekli." }, { status: 400 });
      const target = await prisma.user.findUnique({ where: { id: userId } });
      if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
      if (target.isAdmin) return NextResponse.json({ error: "Admin hesaplarının şifresi burada değiştirilemez." }, { status: 403 });
      const hashed = await hash(newPassword, 12);
      await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
      return NextResponse.json({ success: true, message: "Şifre başarıyla ayarlandı." });
    }
    case "whitelist_add_ip": {
      // only the owner (configured via env) can modify the whitelist
      const session = await getServerSession(authOptions);
      if (!session?.user?.email || session.user.email !== OWNER_EMAIL) {
        return NextResponse.json({ error: "Yetkisiz. Sadece sahibi whitelist'i değiştirebilir." }, { status: 403 });
      }
      const { ip } = await req.json();
      if (!ip) return NextResponse.json({ error: "ip gerekli." }, { status: 400 });
      const ips = await loadAllowedIps();
      if (!ips.includes(ip)) {
        ips.push(ip);
        await saveAllowedIps(ips);
      }
      return NextResponse.json({ success: true, message: "IP whitelist'e eklendi.", ips });
    }
    case "whitelist_remove_ip": {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email || session.user.email !== OWNER_EMAIL) {
        return NextResponse.json({ error: "Yetkisiz. Sadece sahibi whitelist'i değiştirebilir." }, { status: 403 });
      }
      const { ip } = await req.json();
      if (!ip) return NextResponse.json({ error: "ip gerekli." }, { status: 400 });
      let ips = await loadAllowedIps();
      ips = ips.filter((x) => x !== ip);
      await saveAllowedIps(ips);
      return NextResponse.json({ success: true, message: "IP whitelist'ten kaldırıldı.", ips });
    }
    default:
      return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  }
}

import { prisma } from "./prisma";

export async function logIp(username: string, ip: string, action: string) {
  await prisma.ipLog.create({
    data: {
      username,
      ip: ip.replace("::ffff:", ""),
      action,
    },
  });
}

export async function getIpLogs() {
  return prisma.ipLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
}

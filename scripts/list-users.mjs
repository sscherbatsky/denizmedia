import 'dotenv/config';

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      where: { isAdmin: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        profileImage: true,
        isVerified: true,
        isBanned: true,
        banReason: true,
        timeoutUntil: true,
        isRestricted: true,
        createdAt: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });

    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Hata:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

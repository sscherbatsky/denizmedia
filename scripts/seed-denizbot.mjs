import 'dotenv/config';
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    let bot = await prisma.user.findUnique({ where: { username: 'denizbot' } });
    if (!bot) {
      bot = await prisma.user.create({
        data: {
          email: 'denizbot@local',
          username: 'denizbot',
          displayName: 'DenizBot',
          profileImage: null,
          isVerified: false,
        },
      });
      console.log('Denizbot created:', bot.id);
    } else {
      console.log('Denizbot already exists.');
    }

    const pairs = [
      { userText: 'merhaba', replyText: 'Merhaba! Sana nasıl yardımcı olabilirim?' },
      { userText: 'selam', replyText: 'Selam! Neler yapıyorsun?' },
      { userText: 'nasılsın', replyText: 'İyiyim, teşekkürler! Sen nasılsın?' },
    ];

    for (const p of pairs) {
      await prisma.botPair.create({ data: { ...p, authorId: bot.id } });
    }

    console.log('Seed complete');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

import 'dotenv/config';

const { PrismaClient } = await import('@prisma/client');
const { hash } = await import('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if test user exists
    const existing = await prisma.user.findUnique({
      where: { username: 'test' },
    });

    if (existing) {
      console.log('Test user already exists');
      process.exit(0);
    }

    // Create test user
    const hashedPassword = await hash('test123456', 10);
    const user = await prisma.user.create({
      data: {
        username: 'test',
        email: 'test@example.com',
        displayName: 'Test User',
        bio: 'This is a test user for DenizMedia',
        password: hashedPassword,
        isVerified: false,
        isPrivate: false,
        profileImage: null,
      },
    });

    console.log('✅ Test user created:', user.username);

    // Create a test post
    const post = await prisma.post.create({
      data: {
        content: 'Bu bir test gönderisidir! #test #denizmedia #turkiye',
        image: null,
        authorId: user.id,
      },
    });

    console.log('✅ Test post created:', post.id);

    // Add hashtags
    const tags = ['test', 'denizmedia', 'turkiye'];
    for (const tag of tags) {
      const hashtag = await prisma.hashtag.upsert({
        where: { tag },
        update: { count: { increment: 1 } },
        create: { tag, count: 1 },
      });

      try {
        await prisma.postHashtag.create({
          data: {
            postId: post.id,
            hashtagId: hashtag.id,
          },
        });
      } catch (e) {
        // Ignore unique constraint errors
      }
    }

    console.log('✅ Test data created successfully');
    console.log('\nLogin with:');
    console.log('  Username: test');
    console.log('  Password: test123456');
  } catch (err) {
    console.error('Hata:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

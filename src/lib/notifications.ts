import { prisma } from "./prisma";

export async function createNotification(
  userId: string,
  fromId: string,
  type: "like" | "comment" | "follow" | "repost" | "mention",
  postId?: string
) {
  if (userId === fromId) return;

  await prisma.notification.create({
    data: { userId, fromId, type, postId },
  });
}

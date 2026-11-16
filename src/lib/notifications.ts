import { prisma } from './prisma';

export type NotificationType =
  | 'COMMENT'
  | 'REPLY'
  | 'MENTION'
  | 'SOLUTION'
  | 'UPVOTE';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  actorUsername: string;
  actorDisplayName: string;
  actorAvatarColor: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

const globalForNotifications = globalThis as unknown as {
  notificationTableInitialized?: boolean;
};

export async function ensureNotificationTable() {
  if (globalForNotifications.notificationTableInitialized) return;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "actorUsername" TEXT NOT NULL,
      "actorDisplayName" TEXT NOT NULL,
      "actorAvatarColor" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "link" TEXT NOT NULL,
      "isRead" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  globalForNotifications.notificationTableInitialized = true;
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  actorUsername: string;
  actorDisplayName: string;
  actorAvatarColor: string;
  message: string;
  link: string;
}) {
  await ensureNotificationTable();

  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const nowIso = new Date().toISOString();
  await prisma.$executeRaw`
    INSERT INTO "Notification" (
      "id", "userId", "type", "actorUsername", "actorDisplayName", "actorAvatarColor", "message", "link", "isRead", "createdAt"
    ) VALUES (${id}, ${input.userId}, ${input.type}, ${input.actorUsername}, ${input.actorDisplayName}, ${input.actorAvatarColor}, ${input.message}, ${input.link}, 0, ${nowIso})
  `;

  return id;
}

export async function getUserNotifications(
  userId: string,
  limit = 25
): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  await ensureNotificationTable();

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      type: NotificationType;
      actorUsername: string;
      actorDisplayName: string;
      actorAvatarColor: string;
      message: string;
      link: string;
      isRead: number | boolean;
      createdAt: string;
    }>
  >`
    SELECT * FROM "Notification" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC LIMIT ${limit}
  `;

  const unreadRows = await prisma.$queryRaw<
    Array<{ count: number | bigint }>
  >`
    SELECT COUNT(*) as count FROM "Notification" WHERE "userId" = ${userId} AND "isRead" = 0
  `;

  const unreadCount = unreadRows[0] ? Number(unreadRows[0].count) : 0;

  const notifications: NotificationItem[] = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    type: r.type,
    actorUsername: r.actorUsername,
    actorDisplayName: r.actorDisplayName,
    actorAvatarColor: r.actorAvatarColor,
    message: r.message,
    link: r.link,
    isRead: Boolean(r.isRead),
    createdAt: r.createdAt,
  }));

  return { notifications, unreadCount };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  await ensureNotificationTable();
  await prisma.$executeRaw`
    UPDATE "Notification" SET "isRead" = 1 WHERE "id" = ${notificationId} AND "userId" = ${userId}
  `;
}

export async function markAllNotificationsAsRead(userId: string) {
  await ensureNotificationTable();
  await prisma.$executeRaw`
    UPDATE "Notification" SET "isRead" = 1 WHERE "userId" = ${userId}
  `;
}

export async function clearAllNotifications(userId: string) {
  await ensureNotificationTable();
  await prisma.$executeRaw`
    DELETE FROM "Notification" WHERE "userId" = ${userId}
  `;
}

/**
 * Metin içerisindeki @kullanici_adi etiketlerini ayıklar (en fazla 5 kullanıcı).
 */
export function extractMentions(text: string): string[] {
  const regex = /(?:^|\s)@([a-zA-Z0-9_]{3,24})\b/g;
  const matches = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matches.add(match[1].toLowerCase());
    if (matches.size >= 5) break;
  }
  return Array.from(matches);
}


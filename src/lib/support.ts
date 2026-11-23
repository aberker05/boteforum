import { prisma } from './prisma';

export type SupportTicketCategory =
  | 'SUPPORT'
  | 'FEATURE'
  | 'COMPLAINT'
  | 'BUG'
  | 'OTHER';

export type SupportTicketPriority = 'NORMAL' | 'HIGH';

export type SupportTicketStatus =
  | 'OPEN'
  | 'ANSWERED'
  | 'RESOLVED'
  | 'CLOSED';

export interface SupportTicketItem {
  id: string;
  userId: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  adminReply: string;
  repliedAt: string;
  createdAt: string;
  userUsername?: string;
  userDisplayName?: string;
  userAvatarColor?: string;
  userEmail?: string;
}

export const SUPPORT_CATEGORIES: Array<{
  id: SupportTicketCategory;
  label: string;
  desc: string;
  color: string;
  icon: string;
}> = [
  {
    id: 'SUPPORT',
    label: 'Teknik Destek & Hesap',
    desc: 'Giriş, şifre, profil veya kullanım desteği',
    color: '#6366f1',
    icon: 'HelpCircle',
  },
  {
    id: 'FEATURE',
    label: 'Özellik & Kategori Talebi',
    desc: 'Foruma eklenmesini istediğiniz yeni özellik veya bölüm önerisi',
    color: '#10b981',
    icon: 'Sparkles',
  },
  {
    id: 'COMPLAINT',
    label: 'Şikayet & Moderasyon',
    desc: 'Kullanıcı, içerik veya topluluk kuralları ile ilgili şikayet',
    color: '#f43f5e',
    icon: 'ShieldAlert',
  },
  {
    id: 'BUG',
    label: 'Hata (Bug) Bildirimi',
    desc: 'Sitede karşılaştığınız teknik bir hata veya görünüm sorunu',
    color: '#f59e0b',
    icon: 'Bug',
  },
  {
    id: 'OTHER',
    label: 'İş Birliği, Akademik & Etkinlik',
    desc: 'Etkinlik, proje, akademik duyuru veya diğer talepler',
    color: '#06b6d4',
    icon: 'GraduationCap',
  },
];

const globalForSupport = globalThis as unknown as {
  supportTableReady?: boolean;
};

export async function ensureSupportTable() {
  if (globalForSupport.supportTableReady) return;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SupportTicket" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'SUPPORT',
      "priority" TEXT NOT NULL DEFAULT 'NORMAL',
      "subject" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "adminReply" TEXT NOT NULL DEFAULT '',
      "repliedAt" TEXT NOT NULL DEFAULT '',
      "createdAt" TEXT NOT NULL
    )
  `;

  globalForSupport.supportTableReady = true;
}

export async function getUserSupportTickets(
  userId: string
): Promise<SupportTicketItem[]> {
  try {
    return await prisma.$queryRaw<SupportTicketItem[]>`
      SELECT * FROM "SupportTicket"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
    `;
  } catch {
    await ensureSupportTable();
    return await prisma.$queryRaw<SupportTicketItem[]>`
      SELECT * FROM "SupportTicket"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
    `;
  }
}

export async function getAllSupportTickets(): Promise<SupportTicketItem[]> {
  let rows: SupportTicketItem[];
  try {
    rows = await prisma.$queryRaw<SupportTicketItem[]>`
      SELECT * FROM "SupportTicket"
      ORDER BY CASE WHEN "status" = 'OPEN' THEN 0 WHEN "status" = 'ANSWERED' THEN 1 ELSE 2 END, "createdAt" DESC
    `;
  } catch {
    await ensureSupportTable();
    rows = await prisma.$queryRaw<SupportTicketItem[]>`
      SELECT * FROM "SupportTicket"
      ORDER BY CASE WHEN "status" = 'OPEN' THEN 0 WHEN "status" = 'ANSWERED' THEN 1 ELSE 2 END, "createdAt" DESC
    `;
  }

  if (rows.length === 0) return [];

  const userIds = Array.from(new Set(rows.map((r) => r.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarColor: true,
      email: true,
    },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return rows.map((r) => {
    const u = userMap.get(r.userId);
    return {
      ...r,
      userUsername: u?.username || 'silinen_uye',
      userDisplayName: u?.displayName || 'Silinen Üye',
      userAvatarColor: u?.avatarColor || '#6366f1',
      userEmail: u?.email || '',
    };
  });
}

export async function getSupportTicketById(
  id: string
): Promise<SupportTicketItem | null> {
  await ensureSupportTable();
  const rows = await prisma.$queryRaw<SupportTicketItem[]>`
    SELECT * FROM "SupportTicket" WHERE "id" = ${id} LIMIT 1
  `;
  return rows[0] || null;
}

export async function createSupportTicket(input: {
  userId: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  subject: string;
  message: string;
}): Promise<SupportTicketItem> {
  await ensureSupportTable();

  const id = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const createdAt = new Date().toISOString();
  const cleanSubject = input.subject.trim().slice(0, 160);
  const cleanMessage = input.message.trim().slice(0, 5000);

  await prisma.$executeRaw`
    INSERT INTO "SupportTicket" ("id", "userId", "category", "priority", "subject", "message", "status", "adminReply", "repliedAt", "createdAt")
    VALUES (${id}, ${input.userId}, ${input.category}, ${input.priority}, ${cleanSubject}, ${cleanMessage}, 'OPEN', '', '', ${createdAt})
  `;

  return {
    id,
    userId: input.userId,
    category: input.category,
    priority: input.priority,
    subject: cleanSubject,
    message: cleanMessage,
    status: 'OPEN',
    adminReply: '',
    repliedAt: '',
    createdAt,
  };
}

export async function updateSupportTicket(input: {
  id: string;
  status?: SupportTicketStatus;
  adminReply?: string;
}): Promise<SupportTicketItem | null> {
  await ensureSupportTable();
  const existing = await getSupportTicketById(input.id);
  if (!existing) return null;

  const nextReply =
    input.adminReply !== undefined
      ? input.adminReply.trim()
      : existing.adminReply;
  const nextStatus: SupportTicketStatus =
    input.status ||
    (nextReply && existing.status === 'OPEN' ? 'ANSWERED' : existing.status);
  const nextRepliedAt =
    input.adminReply !== undefined && input.adminReply.trim()
      ? new Date().toISOString()
      : existing.repliedAt;

  await prisma.$executeRaw`
    UPDATE "SupportTicket"
    SET "status" = ${nextStatus},
        "adminReply" = ${nextReply},
        "repliedAt" = ${nextRepliedAt}
    WHERE "id" = ${input.id}
  `;

  return {
    ...existing,
    status: nextStatus,
    adminReply: nextReply,
    repliedAt: nextRepliedAt,
  };
}

export async function deleteSupportTicket(id: string): Promise<void> {
  await ensureSupportTable();
  await prisma.$executeRaw`
    DELETE FROM "SupportTicket" WHERE "id" = ${id}
  `;
}

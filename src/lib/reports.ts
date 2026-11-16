import { prisma } from './prisma';

export interface ContentReportItem {
  id: string;
  reporterId: string;
  targetType: 'THREAD' | 'COMMENT';
  targetId: string;
  threadSlug: string;
  targetSummary: string;
  targetPreview?: string;
  reason: string;
  details: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  reporterUsername?: string;
  reporterDisplayName?: string;
  reporter?: {
    username: string;
    displayName: string;
  };
}

const globalForReports = globalThis as unknown as {
  reportTableReady?: boolean;
};

export async function ensureReportTable() {
  if (globalForReports.reportTableReady) return;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "ContentReport" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "reporterId" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "threadSlug" TEXT NOT NULL,
      "targetSummary" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "details" TEXT NOT NULL DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "createdAt" TEXT NOT NULL
    )
  `;

  globalForReports.reportTableReady = true;
}

export async function getAllReports(): Promise<ContentReportItem[]> {
  await ensureReportTable();

  const rows = await prisma.$queryRaw<ContentReportItem[]>`
    SELECT * FROM "ContentReport" ORDER BY CASE WHEN "status" = 'PENDING' THEN 0 ELSE 1 END, "createdAt" DESC
  `;

  if (rows.length === 0) return [];

  const reporterIds = Array.from(new Set(rows.map((r) => r.reporterId)));
  const users = await prisma.user.findMany({
    where: { id: { in: reporterIds } },
    select: { id: true, username: true, displayName: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return rows.map((r) => {
    const rep = userMap.get(r.reporterId) || {
      username: 'silinen_uye',
      displayName: 'Silinen Üye',
    };
    return {
      ...r,
      targetPreview: r.targetSummary,
      reporterUsername: rep.username,
      reporterDisplayName: rep.displayName,
      reporter: rep,
    };
  });
}

export async function createContentReport(input: {
  reporterId: string;
  targetType: 'THREAD' | 'COMMENT';
  targetId: string;
  threadSlug: string;
  targetSummary: string;
  reason: string;
  details?: string;
}): Promise<ContentReportItem> {
  await ensureReportTable();

  const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const createdAt = new Date().toISOString();
  const details = input.details?.trim() || '';
  const summary = input.targetSummary.slice(0, 220);

  await prisma.$executeRaw`
    INSERT INTO "ContentReport" ("id", "reporterId", "targetType", "targetId", "threadSlug", "targetSummary", "reason", "details", "status", "createdAt")
    VALUES (${id}, ${input.reporterId}, ${input.targetType}, ${input.targetId}, ${input.threadSlug}, ${summary}, ${input.reason}, ${details}, 'PENDING', ${createdAt})
  `;

  return {
    id,
    reporterId: input.reporterId,
    targetType: input.targetType,
    targetId: input.targetId,
    threadSlug: input.threadSlug,
    targetSummary: summary,
    reason: input.reason,
    details,
    status: 'PENDING',
    createdAt,
  };
}

export async function getReportById(id: string): Promise<ContentReportItem | null> {
  await ensureReportTable();
  const rows = await prisma.$queryRaw<ContentReportItem[]>`
    SELECT * FROM "ContentReport" WHERE "id" = ${id} LIMIT 1
  `;
  return rows[0] || null;
}

export async function updateReportStatus(
  id: string,
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED'
) {
  await ensureReportTable();
  await prisma.$executeRaw`
    UPDATE "ContentReport" SET "status" = ${status} WHERE "id" = ${id}
  `;
}

export async function deleteReportById(id: string) {
  await ensureReportTable();
  await prisma.$executeRaw`DELETE FROM "ContentReport" WHERE "id" = ${id}`;
}


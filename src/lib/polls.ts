import { prisma } from './prisma';

export interface PollOptionView {
  id: string;
  text: string;
  orderIndex: number;
  voteCount: number;
  percentage: number;
}

export interface ThreadPollView {
  id: string;
  threadId: string;
  question: string;
  totalVotes: number;
  userVotedOptionId: string | null;
  options: PollOptionView[];
}

const globalForPolls = globalThis as unknown as {
  pollTablesInitialized?: boolean;
};

export async function ensurePollTables() {
  if (globalForPolls.pollTablesInitialized) return;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "ThreadPoll" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "threadId" TEXT NOT NULL UNIQUE,
      "question" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "ThreadPollOption" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "pollId" TEXT NOT NULL,
      "text" TEXT NOT NULL,
      "orderIndex" INTEGER NOT NULL DEFAULT 0
    )
  `;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "ThreadPollVote" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "pollId" TEXT NOT NULL,
      "optionId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("pollId", "userId")
    )
  `;

  globalForPolls.pollTablesInitialized = true;
}

export async function createPollForThread(
  threadId: string,
  question: string,
  options: string[]
) {
  await ensurePollTables();

  const cleanOptions = options
    .map((o) => o.trim())
    .filter((o) => o.length > 0)
    .slice(0, 6);

  if (!question.trim() || cleanOptions.length < 2) {
    return null;
  }

  const pollId = `poll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();
  const cleanQuestion = question.trim();

  await prisma.$executeRaw`
    INSERT INTO "ThreadPoll" ("id", "threadId", "question", "createdAt")
    VALUES (${pollId}, ${threadId}, ${cleanQuestion}, ${nowIso})
  `;

  for (let i = 0; i < cleanOptions.length; i++) {
    const optId = `popt_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
    const optText = cleanOptions[i];
    await prisma.$executeRaw`
      INSERT INTO "ThreadPollOption" ("id", "pollId", "text", "orderIndex")
      VALUES (${optId}, ${pollId}, ${optText}, ${i})
    `;
  }

  return pollId;
}

export async function getPollByThreadId(
  threadId: string,
  currentUserId?: string
): Promise<ThreadPollView | null> {
  await ensurePollTables();

  const polls = await prisma.$queryRaw<
    Array<{ id: string; threadId: string; question: string }>
  >`SELECT "id", "threadId", "question" FROM "ThreadPoll" WHERE "threadId" = ${threadId} LIMIT 1`;

  if (polls.length === 0) return null;
  const poll = polls[0];

  return getPollDetailsById(poll.id, poll.threadId, poll.question, currentUserId);
}

export async function getPollDetailsById(
  pollId: string,
  threadId: string,
  question: string,
  currentUserId?: string
): Promise<ThreadPollView> {
  const options = await prisma.$queryRaw<
    Array<{ id: string; text: string; orderIndex: number }>
  >`SELECT "id", "text", "orderIndex" FROM "ThreadPollOption" WHERE "pollId" = ${pollId} ORDER BY "orderIndex" ASC`;

  const votes = await prisma.$queryRaw<
    Array<{ optionId: string; userId: string }>
  >`SELECT "optionId", "userId" FROM "ThreadPollVote" WHERE "pollId" = ${pollId}`;

  const totalVotes = votes.length;
  const userVotedOptionId = currentUserId
    ? votes.find((v) => v.userId === currentUserId)?.optionId || null
    : null;

  const formattedOptions: PollOptionView[] = options.map((opt) => {
    const voteCount = votes.filter((v) => v.optionId === opt.id).length;
    const percentage =
      totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    return {
      id: opt.id,
      text: opt.text,
      orderIndex: Number(opt.orderIndex),
      voteCount,
      percentage,
    };
  });

  return {
    id: pollId,
    threadId,
    question,
    totalVotes,
    userVotedOptionId,
    options: formattedOptions,
  };
}

export async function voteInPoll(
  pollId: string,
  optionId: string,
  userId: string
): Promise<ThreadPollView | null> {
  await ensurePollTables();

  const polls = await prisma.$queryRaw<
    Array<{ id: string; threadId: string; question: string }>
  >`SELECT "id", "threadId", "question" FROM "ThreadPoll" WHERE "id" = ${pollId} LIMIT 1`;

  if (polls.length === 0) return null;
  const poll = polls[0];

  const validOption = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "ThreadPollOption" WHERE "id" = ${optionId} AND "pollId" = ${pollId} LIMIT 1
  `;
  if (validOption.length === 0) return null;

  // Mevcut oyu varsa güncelle, yoksa yeni ekle
  const existing = await prisma.$queryRaw<Array<{ id: string; optionId: string }>>`
    SELECT "id", "optionId" FROM "ThreadPollVote" WHERE "pollId" = ${pollId} AND "userId" = ${userId} LIMIT 1
  `;

  const nowIso = new Date().toISOString();

  if (existing.length > 0) {
    await prisma.$executeRaw`
      UPDATE "ThreadPollVote" SET "optionId" = ${optionId}, "createdAt" = ${nowIso} WHERE "id" = ${existing[0].id}
    `;
  } else {
    const voteId = `pvote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await prisma.$executeRaw`
      INSERT INTO "ThreadPollVote" ("id", "pollId", "optionId", "userId", "createdAt")
      VALUES (${voteId}, ${pollId}, ${optionId}, ${userId}, ${nowIso})
    `;
  }

  return getPollDetailsById(poll.id, poll.threadId, poll.question, userId);
}


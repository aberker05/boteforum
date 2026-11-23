import { prisma } from './prisma';
import type { HomeCategoryItem, HomeTopUser } from '@/components/HomeFeedClient';

export interface HomeSidebarData {
  categories: HomeCategoryItem[];
  topUsers: HomeTopUser[];
  totalUsers: number;
  totalComments: number;
}

export interface CachedHomeThread {
  id: string;
  title: string;
  slug: string;
  content: string;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  tags: string;
  createdAt: Date;
  updatedAt: Date;
  score: number;
  voteUserIds: string[];
  bookmarkedUserIds: string[];
  commentCount: number;
  author: {
    username: string;
    displayName: string;
    avatarColor: string;
    role: string;
    reputation: number;
  };
  category: {
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
  lastReply: {
    createdAt: Date;
    author: {
      username: string;
      displayName: string;
      avatarColor: string;
    };
  } | null;
}

const HOME_CACHE_TTL_MS = 300_000;

const globalForHomeCache = globalThis as unknown as {
  homeSidebarCache?: { data: HomeSidebarData; expiresAt: number };
  homeSidebarInFlight?: Promise<HomeSidebarData>;
  homeThreadsCache?: { data: CachedHomeThread[]; expiresAt: number };
  homeThreadsInFlight?: Promise<CachedHomeThread[]>;
};

export function invalidateHomeCache() {
  globalForHomeCache.homeSidebarCache = undefined;
  globalForHomeCache.homeSidebarInFlight = undefined;
  globalForHomeCache.homeThreadsCache = undefined;
  globalForHomeCache.homeThreadsInFlight = undefined;
}

export async function getHomeSidebarData(): Promise<HomeSidebarData> {
  const now = Date.now();
  if (
    globalForHomeCache.homeSidebarCache &&
    globalForHomeCache.homeSidebarCache.expiresAt > now
  ) {
    return globalForHomeCache.homeSidebarCache.data;
  }

  if (globalForHomeCache.homeSidebarInFlight) {
    return globalForHomeCache.homeSidebarInFlight;
  }

  const promise = (async () => {
    const [categories, topUsers, countsRow] = await Promise.all([
      prisma.category.findMany({
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { threads: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: { not: 'BANNED' } },
        orderBy: { reputation: 'desc' },
        take: 5,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarColor: true,
          role: true,
          reputation: true,
        },
      }),
      prisma.$queryRaw<Array<{ userCount: bigint | number; commentCount: bigint | number }>>`
        SELECT
          (SELECT COUNT(*) FROM "User") AS "userCount",
          (SELECT COUNT(*) FROM "Comment") AS "commentCount"
      `,
    ]);

    const totalUsers = Number(countsRow[0]?.userCount || 0);
    const totalComments = Number(countsRow[0]?.commentCount || 0);

    const data: HomeSidebarData = {
      categories,
      topUsers,
      totalUsers,
      totalComments,
    };

    globalForHomeCache.homeSidebarCache = {
      data,
      expiresAt: Date.now() + HOME_CACHE_TTL_MS,
    };
    return data;
  })().finally(() => {
    globalForHomeCache.homeSidebarInFlight = undefined;
  });

  globalForHomeCache.homeSidebarInFlight = promise;
  return promise;
}

export async function getCachedHomeThreads(): Promise<CachedHomeThread[]> {
  const now = Date.now();
  if (
    globalForHomeCache.homeThreadsCache &&
    globalForHomeCache.homeThreadsCache.expiresAt > now
  ) {
    return globalForHomeCache.homeThreadsCache.data;
  }

  if (globalForHomeCache.homeThreadsInFlight) {
    return globalForHomeCache.homeThreadsInFlight;
  }

  const promise = (async () => {
    const allThreads = await prisma.thread.findMany({
      take: 80,
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
            avatarColor: true,
            role: true,
            reputation: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        votes: {
          select: {
            userId: true,
            value: true,
          },
        },
        bookmarks: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });

    const cached: CachedHomeThread[] = allThreads.map((t) => {
      const upvoters = t.votes.filter((v) => v.value === 1).map((v) => v.userId);
      const bookmarkers = t.bookmarks.map((b) => b.userId);
      const lightContent = t.content
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[$1 Görsel]')
        .slice(0, 500);

      return {
        id: t.id,
        title: t.title,
        slug: t.slug,
        content: lightContent,
        views: t.views,
        isPinned: t.isPinned,
        isLocked: t.isLocked,
        isSolved: t.isSolved,
        tags: t.tags,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        score: upvoters.length,
        voteUserIds: upvoters,
        bookmarkedUserIds: bookmarkers,
        commentCount: t._count.comments,
        author: t.author,
        category: t.category,
        lastReply: null,
      };
    });

    globalForHomeCache.homeThreadsCache = {
      data: cached,
      expiresAt: Date.now() + HOME_CACHE_TTL_MS,
    };

    return cached;
  })().finally(() => {
    globalForHomeCache.homeThreadsInFlight = undefined;
  });

  globalForHomeCache.homeThreadsInFlight = promise;
  return promise;
}

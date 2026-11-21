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

const HOME_CACHE_TTL_MS = 60_000;

const globalForHomeCache = globalThis as unknown as {
  homeSidebarCache?: { data: HomeSidebarData; expiresAt: number };
  homeThreadsCache?: { data: CachedHomeThread[]; expiresAt: number };
};

export function invalidateHomeCache() {
  globalForHomeCache.homeSidebarCache = undefined;
  globalForHomeCache.homeThreadsCache = undefined;
}

export async function getHomeSidebarData(): Promise<HomeSidebarData> {
  const now = Date.now();
  if (
    globalForHomeCache.homeSidebarCache &&
    globalForHomeCache.homeSidebarCache.expiresAt > now
  ) {
    return globalForHomeCache.homeSidebarCache.data;
  }

  const [categories, topUsers, totalUsers, totalComments] = await Promise.all([
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
    prisma.user.count(),
    prisma.comment.count(),
  ]);

  const data: HomeSidebarData = {
    categories,
    topUsers,
    totalUsers,
    totalComments,
  };

  globalForHomeCache.homeSidebarCache = {
    data,
    expiresAt: now + HOME_CACHE_TTL_MS,
  };

  return data;
}

export async function getCachedHomeThreads(): Promise<CachedHomeThread[]> {
  const now = Date.now();
  if (
    globalForHomeCache.homeThreadsCache &&
    globalForHomeCache.homeThreadsCache.expiresAt > now
  ) {
    return globalForHomeCache.homeThreadsCache.data;
  }

  const allThreads = await prisma.thread.findMany({
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
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          createdAt: true,
          author: {
            select: {
              username: true,
              displayName: true,
              avatarColor: true,
            },
          },
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
    const latestComment = t.comments[0] || null;
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
      lastReply: latestComment
        ? {
            createdAt: latestComment.createdAt,
            author: latestComment.author,
          }
        : null,
    };
  });

  globalForHomeCache.homeThreadsCache = {
    data: cached,
    expiresAt: now + HOME_CACHE_TTL_MS,
  };

  return cached;
}

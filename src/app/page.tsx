import React, { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getAllTechNews } from '@/lib/techNews';
import { getHomeSidebarData, getCachedHomeThreads } from '@/lib/homeCache';
import { HomeFeedClient } from '@/components/HomeFeedClient';

interface HomeProps {
  searchParams: Promise<{
    kategori?: string;
    etiket?: string;
    sirala?: string;
    filtre?: string;
    q?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const [params, user, sidebarData, cachedThreads, techNews] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getHomeSidebarData(),
    getCachedHomeThreads(),
    getAllTechNews(),
  ]);

  const { categories, topUsers, totalUsers, totalComments } = sidebarData;
  const totalThreads = cachedThreads.length;

  const formattedThreads = cachedThreads.map((t) => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    content: t.content,
    views: t.views,
    isPinned: t.isPinned,
    isLocked: t.isLocked,
    isSolved: t.isSolved,
    tags: t.tags,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    score: t.score,
    userVote: user && t.voteUserIds.includes(user.id) ? 1 : 0,
    isBookmarked: !!user && t.bookmarkedUserIds.includes(user.id),
    commentCount: t.commentCount,
    author: t.author,
    category: t.category,
    lastReply: t.lastReply,
  }));

  // Ana sayfa vitrini için yalnızca ilk 4 haberi (ağır markdown gövdesi olmadan) gönder
  const lightTechNews = techNews.slice(0, 4).map((n) => ({
    ...n,
    content: '',
  }));

  return (
    <Suspense fallback={null}>
      <HomeFeedClient
        categories={categories}
        threads={formattedThreads}
        topUsers={topUsers}
        techNews={lightTechNews}
        stats={{
          totalThreads,
          totalComments,
          totalUsers,
        }}
        isLoggedIn={!!user}
        canModerate={!!user && (user.role === 'ADMIN' || user.role === 'MODERATOR')}
        initialCategory={params.kategori || ''}
        initialTag={params.etiket || ''}
        initialSort={params.sirala || 'aktivite'}
        initialFilter={params.filtre || ''}
        initialSearch={params.q?.trim() || ''}
      />
    </Suspense>
  );
}

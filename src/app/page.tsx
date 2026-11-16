import React, { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getAllTechNews } from '@/lib/techNews';
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
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  const [
    categories,
    allThreads,
    topUsers,
    totalUsers,
    totalComments,
    techNews,
  ] = await Promise.all([
    prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { threads: true } },
      },
    }),
    prisma.thread.findMany({
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
        bookmarks: user
          ? { where: { userId: user.id }, select: { id: true } }
          : false,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
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
    getAllTechNews(),
  ]);

  const totalThreads = allThreads.length;

  const formattedThreads = allThreads.map((t) => {
    const score = t.votes.filter((v) => v.value === 1).length;
    const userVote =
      user && t.votes.some((v) => v.userId === user.id && v.value === 1)
        ? 1
        : 0;
    const isBookmarked =
      Array.isArray(t.bookmarks) && t.bookmarks.length > 0;

    const latestComment = t.comments[0] || null;
    const lightContent = t.content
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[$1 Görsel]')
      .slice(0, 600);

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
      score,
      userVote,
      isBookmarked,
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

  return (
    <Suspense fallback={null}>
      <HomeFeedClient
        categories={categories}
        threads={formattedThreads}
        topUsers={topUsers}
        techNews={techNews}
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

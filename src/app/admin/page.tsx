import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getAllReports } from '@/lib/reports';
import { getSiteSettings } from '@/lib/siteSettings';
import {
  getAllTechNews,
  getAllTechNewsCommentsForAdmin,
} from '@/lib/techNews';
import { AdminDashboard } from '@/components/AdminDashboard';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/');
  }

  const [
    users,
    categories,
    threads,
    comments,
    techNews,
    techNewsComments,
    reports,
    siteSettings,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarColor: true,
        role: true,
        reputation: true,
        createdAt: true,
        _count: {
          select: {
            threads: true,
            comments: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { threads: true },
        },
      },
    }),
    prisma.thread.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
            avatarColor: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    }),
    prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
            avatarColor: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    }),
    getAllTechNews(),
    getAllTechNewsCommentsForAdmin(),
    getAllReports(),
    getSiteSettings(),
  ]);

  const totalThreads = threads.length;
  const solvedThreads = threads.filter((t) => t.isSolved).length;
  const totalComments = comments.length;

  return (
    <AdminDashboard
      currentAdminId={user.id}
      stats={{
        totalUsers: users.length,
        totalThreads,
        solvedThreads,
        totalComments,
        totalCategories: categories.length,
      }}
      users={users}
      categories={categories}
      threads={threads}
      comments={comments}
      techNews={techNews}
      techNewsComments={techNewsComments}
      reports={reports}
      initialSiteSettings={siteSettings}
    />
  );
}


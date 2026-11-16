import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NewThreadForm } from '@/components/NewThreadForm';

export default async function NewThreadPage() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    prisma.category.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
      },
    }),
  ]);

  if (!user) {
    redirect('/giris');
  }

  return <NewThreadForm categories={categories} />;
}

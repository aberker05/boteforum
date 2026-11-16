import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getAllTechNews } from '@/lib/techNews';
import { TechNewsClient } from '@/components/TechNewsClient';

export default async function TechNewsPage() {
  const [user, news] = await Promise.all([
    getCurrentUser(),
    getAllTechNews(),
  ]);

  return <TechNewsClient initialNews={news} currentUser={user} />;
}


import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getAllTechNews } from '@/lib/techNews';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const [threads, news] = await Promise.all([
    prisma.thread.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    }),
    getAllTechNews().catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/haberler`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kurallar`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/gizlilik`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  const threadRoutes: MetadataRoute.Sitemap = threads.map((t) => ({
    url: `${baseUrl}/konu/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const newsRoutes: MetadataRoute.Sitemap = news.map((n) => ({
    url: `${baseUrl}/haberler/${n.slug}`,
    lastModified: new Date(n.createdAt),
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  return [...staticRoutes, ...threadRoutes, ...newsRoutes];
}


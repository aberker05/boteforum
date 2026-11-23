import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllTechNews } from '@/lib/techNews';
import { getCachedHomeThreads, getHomeSidebarData } from '@/lib/homeCache';
import { matchesSearch, normalizeSearchText } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    const [cachedThreads, sidebarData, users, techNews] = await Promise.all([
      getCachedHomeThreads(),
      getHomeSidebarData(),
      prisma.user.findMany({
        where: { role: { not: 'BANNED' } },
        orderBy: { reputation: 'desc' },
        take: 30,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarColor: true,
          reputation: true,
          role: true,
        },
      }),
      getAllTechNews(),
    ]);

    const categories = sidebarData.categories;
    const threads = cachedThreads.slice(0, 100);

    // Tüm etiketleri ve kullanım sayılarını çıkar
    const tagCounts: Record<string, number> = {};
    threads.forEach((t) => {
      if (!t.tags) return;
      t.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const allTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    const formattedThreads = threads.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      excerpt: t.content
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[#>*_`~-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 140),
      tags: t.tags,
      isSolved: t.isSolved,
      views: t.views,
      commentCount: t.commentCount,
      author: t.author,
      category: t.category,
    }));

    const formattedNews = techNews.map((n) => ({
      id: n.id,
      title: n.title,
      slug: n.slug,
      category: n.category,
      badgeColor: n.badgeColor,
      readTime: n.readTime,
    }));

    if (!q) {
      return NextResponse.json({
        threads: formattedThreads,
        categories,
        tags: allTags,
        users,
        news: formattedNews,
      });
    }

    const normQ = normalizeSearchText(q);

    const matchedThreads = formattedThreads
      .filter(
        (t) =>
          matchesSearch(t.title, normQ) ||
          matchesSearch(t.tags, normQ) ||
          matchesSearch(t.excerpt, normQ) ||
          matchesSearch(t.category.name, normQ) ||
          matchesSearch(t.author.displayName, normQ)
      )
      .slice(0, 8);

    const matchedCategories = categories
      .filter(
        (c) =>
          matchesSearch(c.name, normQ) || matchesSearch(c.description, normQ)
      )
      .slice(0, 4);

    const matchedTags = allTags
      .filter((t) => matchesSearch(t.tag, normQ))
      .slice(0, 6);

    const matchedUsers = users
      .filter(
        (u) =>
          matchesSearch(u.displayName, normQ) ||
          matchesSearch(u.username, normQ)
      )
      .slice(0, 4);

    const matchedNews = formattedNews
      .filter(
        (n) =>
          matchesSearch(n.title, normQ) || matchesSearch(n.category, normQ)
      )
      .slice(0, 3);

    return NextResponse.json({
      threads: matchedThreads,
      categories: matchedCategories,
      tags: matchedTags,
      users: matchedUsers,
      news: matchedNews,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Arama sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}


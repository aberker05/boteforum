import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Eye,
  Newspaper,
  MessageSquare,
  Sparkles,
  Flame,
} from 'lucide-react';
import {
  getTechNewsBySlug,
  getAllTechNews,
  getTechNewsComments,
} from '@/lib/techNews';
import { getCurrentUser } from '@/lib/auth';
import { getSiteSettings } from '@/lib/siteSettings';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { TechNewsComments } from '@/components/TechNewsComments';
import { TechNewsDetailActions } from '@/components/TechNewsDetailActions';
import TechNewsCover from '@/components/TechNewsCover';
import { formatRelativeTime } from '@/lib/utils';

interface NewsDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: NewsDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const [item, settings] = await Promise.all([
    getTechNewsBySlug(slug),
    getSiteSettings(),
  ]);
  const fullName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;
  if (!item) {
    return { title: `Haber Bulunamadı — ${fullName}` };
  }
  return {
    title: `${item.title} — ${fullName} Teknoloji Gündemi`,
    description: item.summary,
  };
}

export default async function TechNewsDetailPage({ params }: NewsDetailProps) {
  const { slug } = await params;
  const item = await getTechNewsBySlug(slug);

  if (!item) {
    notFound();
  }

  const [user, comments, allNews] = await Promise.all([
    getCurrentUser(),
    getTechNewsComments(item.id),
    getAllTechNews(),
  ]);
  const relatedNews = allNews.filter((n) => n.id !== item.id).slice(0, 3);
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    description: item.summary,
    image: item.imageUrl && item.imageUrl !== 'none' ? [item.imageUrl] : undefined,
    datePublished: item.createdAt,
    dateModified: item.createdAt,
    articleSection: item.category,
    author: {
      '@type': 'Organization',
      name: item.source || 'BÖTEForum Teknoloji Radarı',
    },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: comments.length,
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/haberler"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tüm Teknolojik Gelişmelere Dön
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
            <TechNewsDetailActions item={item} />
          )}
        </div>
      </div>

      <article className="rounded-md overflow-hidden border border-[#232730] bg-[#15181E]">
        {/* Tam Genişlik Sinematik Kapak Görseli */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full group overflow-hidden border-b border-[#232730]">
          <TechNewsCover
            title={item.title}
            category={item.category}
            badgeColor={item.badgeColor}
            imageUrl={item.imageUrl}
            slug={item.slug}
            className="w-full h-full"
            overlayVariant="detail"
          />

          <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-sm text-xs font-semibold bg-[#0D0F12]/90 border border-[#232730]"
                style={{ color: item.badgeColor }}
              >
                {item.category}
              </span>
              {Number(item.isFeatured) === 1 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#F59E0B] text-[#0D0F12]">
                  <Flame className="w-3 h-3 fill-[#0D0F12]" />
                  MANŞET
                </span>
              )}
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium bg-[#0D0F12]/90 text-[#E6EDF3] border border-[#232730]">
              <Clock className="w-3.5 h-3.5 text-[#10B981]" />
              {item.readTime}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-6">
          <div className="space-y-4 border-b border-[#232730] pb-5">
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#8B949E]">
              <span className="font-bold text-[#10B981] inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {item.source}
              </span>
              <span>•</span>
              <span>{formatRelativeTime(item.createdAt)}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {item.views} okunma
              </span>
              <span>•</span>
              <a
                href="#tartisma"
                className="inline-flex items-center gap-1 hover:text-[#10B981] transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {comments.length} yorum
              </a>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-[#E6EDF3] leading-snug tracking-tight">
              {item.title}
            </h1>

            <p className="text-sm sm:text-[15px] text-[#8B949E] font-medium leading-relaxed bg-[#0D0F12] p-4 rounded-md border border-[#232730]">
              {item.summary}
            </p>
          </div>

          <div className="py-1 text-sm sm:text-base">
            <MarkdownRenderer content={item.content} />
          </div>
        </div>
      </article>

      {/* Kullanıcı Yorumları ve Tartışma Alanı */}
      <TechNewsComments
        newsId={item.id}
        comments={comments}
        currentUser={user}
      />

      {/* Diğer Güncel Gelişmeler (Görsel Kapaklı) */}
      {relatedNews.length > 0 && (
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
            <Newspaper className="w-4 h-4 text-indigo-500" />
            Diğer Güncel Gelişmeler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedNews.map((n) => (
              <Link
                key={n.id}
                href={`/haberler/${n.slug}`}
                className="group rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 hover:border-indigo-500/40 hover:shadow-lg transition-all flex flex-col"
              >
                <div className="relative h-36 w-full overflow-hidden">
                  <TechNewsCover
                    title={n.title}
                    category={n.category}
                    badgeColor={n.badgeColor}
                    imageUrl={n.imageUrl}
                    slug={n.slug}
                    className="w-full h-full"
                    overlayVariant="card"
                  />
                  <span
                    className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border"
                    style={{
                      backgroundColor: 'rgba(9, 13, 22, 0.78)',
                      borderColor: `${n.badgeColor}60`,
                      color: n.badgeColor,
                    }}
                  >
                    {n.category}
                  </span>
                </div>
                <div className="p-4 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors line-clamp-2">
                    {n.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{n.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

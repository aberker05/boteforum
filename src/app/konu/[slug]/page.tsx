import React, { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Eye,
  Clock,
  Pin,
  CheckCircle2,
  Lock,
  Tag,
  Award,
  ChevronRight,
  Home,
  MessageSquare,
  Users,
  Activity,
  Sparkles,
  ArrowDownRight,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getUserLevelInfo } from '@/lib/badges';
import { VoteButtons } from '@/components/VoteButtons';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ThreadActions } from '@/components/ThreadActions';
import { CommentSection } from '@/components/CommentSection';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ThreadPollCard } from '@/components/ThreadPollCard';
import { UserAvatar } from '@/components/UserAvatar';
import { getPollByThreadId } from '@/lib/polls';
import { getSiteSettings } from '@/lib/siteSettings';
import { formatRelativeTime } from '@/lib/utils';

interface ThreadDetailProps {
  params: Promise<{ slug: string }>;
}

const getThreadBySlug = cache(async function getThreadBySlugImpl(slug: string) {
  return prisma.thread.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarColor: true,
          role: true,
          reputation: true,
        },
      },
      category: true,
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
      comments: {
        orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }],
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarColor: true,
              role: true,
              reputation: true,
            },
          },
          votes: {
            select: {
              userId: true,
              value: true,
            },
          },
        },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: ThreadDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const [thread, settings] = await Promise.all([
    getThreadBySlug(slug),
    getSiteSettings(),
  ]);
  const fullName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;

  if (!thread) {
    return { title: `Konu Bulunamadı — ${fullName}` };
  }

  const cleanDesc = thread.content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '[Görsel]')
    .replace(/[#>*_`~-]/g, '')
    .slice(0, 155);
  return {
    title: `${thread.title} — ${fullName}`,
    description: cleanDesc,
  };
}

export default async function ThreadDetailPage({ params }: ThreadDetailProps) {
  const { slug } = await params;
  const [user, thread, allCategories] = await Promise.all([
    getCurrentUser(),
    getThreadBySlug(slug),
    prisma.category.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        color: true,
      },
    }),
  ]);

  if (!thread) {
    notFound();
  }

  // Görüntülenme sayısını arka planda artır (updatedAt alanını bozmadan yalnızca views artırılır)
  prisma.$executeRaw`
    UPDATE "Thread" SET "views" = "views" + 1 WHERE "id" = ${thread.id}
  `.catch(() => {});

  const [threadPoll, relatedThreads] = await Promise.all([
    getPollByThreadId(thread.id, user?.id),
    prisma.thread.findMany({
      where: {
        categoryId: thread.categoryId,
        id: { not: thread.id },
      },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      select: {
        id: true,
        title: true,
        slug: true,
        isSolved: true,
        views: true,
        createdAt: true,
        _count: {
          select: { comments: true },
        },
      },
    }),
  ]);

  const score = thread.votes.filter((v) => v.value === 1).length;
  const userVote =
    user && thread.votes.some((v) => v.userId === user.id && v.value === 1)
      ? 1
      : 0;
  const isBookmarked =
    !!user && thread.bookmarks.some((b) => b.userId === user.id);

  const canModerate =
    !!user && (user.role === 'ADMIN' || user.role === 'MODERATOR');
  const canSolveOrDelete =
    !!user && (user.id === thread.authorId || canModerate);

  const tagList = thread.tags
    ? thread.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const formattedComments = thread.comments.map((c) => ({
    id: c.id,
    content: c.content,
    isAccepted: c.isAccepted,
    createdAt: c.createdAt,
    parentId: c.parentId,
    score: c.votes.filter((v) => v.value === 1).length,
    userVote:
      user && c.votes.some((v) => v.userId === user.id && v.value === 1)
        ? 1
        : 0,
    author: c.author,
  }));

  const acceptedComment = formattedComments.find((c) => c.isAccepted);
  const authorLevel = getUserLevelInfo(thread.author.reputation);

  // Konudaki benzersiz katılımcılar (Konu sahibi + yorum yapanlar)
  const participantMap = new Map<
    string,
    { username: string; displayName: string; avatarColor: string }
  >();
  participantMap.set(thread.author.id, {
    username: thread.author.username,
    displayName: thread.author.displayName,
    avatarColor: thread.author.avatarColor,
  });
  for (const c of thread.comments) {
    if (!participantMap.has(c.author.id)) {
      participantMap.set(c.author.id, {
        username: c.author.username,
        displayName: c.author.displayName,
        avatarColor: c.author.avatarColor,
      });
    }
  }
  const participants = Array.from(participantMap.values());
  const forumPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: thread.title,
    text: thread.content
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '[Görsel]')
      .slice(0, 500),
    datePublished: thread.createdAt,
    dateModified: thread.updatedAt,
    author: {
      '@type': 'Person',
      name: thread.author.displayName,
    },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: formattedComments.length,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: score,
      },
    ],
  };

  return (
    <div className="space-y-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(forumPostingJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      {/* Profesyonel Forum Breadcrumb Navigasyonu */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-md border border-[#232730] bg-[#15181E] text-xs font-mono"
      >
        <ol className="flex items-center gap-1.5 flex-wrap text-[#8B949E] min-w-0">
          <li>
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-semibold text-[#E6EDF3] hover:text-[#10B981] transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-[#10B981]" />
              Forum
            </Link>
          </li>
          <li>
            <ChevronRight className="w-3.5 h-3.5 text-[#8B949E]" />
          </li>
          <li>
            <Link
              href={`/?kategori=${thread.category.slug}`}
              className="inline-flex items-center gap-1 font-semibold hover:underline"
              style={{ color: thread.category.color }}
            >
              <CategoryIcon name={thread.category.icon} className="w-3.5 h-3.5" />
              {thread.category.name}
            </Link>
          </li>
          <li className="hidden sm:block">
            <ChevronRight className="w-3.5 h-3.5 text-[#8B949E]" />
          </li>
          <li className="hidden sm:block text-[#E6EDF3] font-sans font-semibold truncate max-w-xs md:max-w-md">
            {thread.title}
          </li>
        </ol>

        <div className="flex items-center gap-2 shrink-0">
          {thread.isSolved ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/35">
              <CheckCircle2 className="w-3 h-3" /> SOLVED
            </span>
          ) : thread.isLocked ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/35">
              <Lock className="w-3 h-3" /> LOCKED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-[#0D0F12] text-[#10B981] border border-[#232730]">
              <MessageSquare className="w-3 h-3" /> OPEN
            </span>
          )}
        </div>
      </nav>

      {/* 2 Sütunlu Profesyonel Forum Konu Düzeni */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* SOL SÜTUN: Ana Konu Mesajı (#1) ve Yanıtlar */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* Ana Konu Kartı (Post #1) */}
          <article className="rounded-md border border-[#232730] bg-[#15181E] p-5 sm:p-6">
            {/* Üst Kategori ve Durum Rozetleri */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 font-mono">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/?kategori=${thread.category.slug}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#0D0F12] border border-[#232730] hover:border-[#10B981]/50"
                  style={{ color: thread.category.color }}
                >
                  <CategoryIcon name={thread.category.icon} className="w-3.5 h-3.5" />
                  {thread.category.name}
                </Link>

                {thread.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/35">
                    <Pin className="w-3 h-3" /> PINNED
                  </span>
                )}
                {thread.isSolved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/35">
                    <CheckCircle2 className="w-3 h-3" /> SOLVED
                  </span>
                )}
                {thread.isLocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/35">
                    <Lock className="w-3 h-3" /> LOCKED
                  </span>
                )}
              </div>

              <span className="px-2 py-0.5 rounded-sm bg-[#0D0F12] border border-[#232730] text-[11px] font-mono font-semibold text-[#8B949E]">
                #1 • OP
              </span>
            </div>

            {/* Başlık */}
            <h1 className="text-xl sm:text-2xl font-bold text-[#E6EDF3] leading-snug tracking-tight">
              {thread.title}
            </h1>

            {/* Yazar & Tarih Bilgisi */}
            <div className="mt-4 pb-4 border-b border-[#232730] flex flex-wrap items-center justify-between gap-4">
              <Link
                href={`/kullanici/${thread.author.username}`}
                className="flex items-center gap-3 group"
              >
                <UserAvatar
                  name={thread.author.displayName}
                  avatar={thread.author.avatarColor}
                  className="w-9 h-9 rounded-md text-xs border border-[#232730]"
                />
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors">
                      {thread.author.displayName}
                    </span>
                    <span className="px-1.5 py-0.2 font-mono text-[10px] font-semibold rounded-sm bg-[#0D0F12] border border-[#232730] text-[#10B981]">
                      AUTHOR
                    </span>
                    {thread.author.role === 'ADMIN' && (
                      <span className="px-1.5 py-0.2 font-mono text-[10px] font-semibold rounded-sm bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                        ADMIN
                      </span>
                    )}
                    {thread.author.role === 'MODERATOR' && (
                      <span className="px-1.5 py-0.2 font-mono text-[10px] font-semibold rounded-sm bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        MOD
                      </span>
                    )}
                    {thread.author.role === 'BANNED' && (
                      <span className="px-1.5 py-0.2 font-mono text-[10px] font-semibold rounded-sm bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        BANNED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#8B949E] mt-0.5">
                    <span>@{thread.author.username}</span>
                    <span>•</span>
                    <span
                      className="font-semibold"
                      style={{ color: authorLevel.color }}
                    >
                      Lv.{authorLevel.level} {authorLevel.title}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-0.5 text-[#F59E0B] font-semibold">
                      <Award className="w-3 h-3" /> {thread.author.reputation}p
                    </span>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-3 text-xs font-mono text-[#8B949E]">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                  {formatRelativeTime(thread.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-[#F59E0B]" />
                  {thread.views + 1} görüntü
                </span>
              </div>
            </div>

            {/* Konu İçeriği */}
            <div className="py-5 text-sm sm:text-[15px] leading-relaxed">
              <MarkdownRenderer content={thread.content} />
            </div>

            {/* Varsa Konu İçi Anket */}
            {threadPoll && (
              <ThreadPollCard initialPoll={threadPoll} isLoggedIn={!!user} />
            )}

            {/* Kabul Edilen Çözüm Özeti Kutusu (Varsa) */}
            {acceptedComment && (
              <div className="my-4 rounded-md border border-[#10B981]/45 bg-[#10B981]/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-mono font-bold text-[#10B981]">
                      SOLVED BY @{acceptedComment.author.username}
                    </p>
                    <p className="text-xs text-[#E6EDF3] line-clamp-1 mt-0.5">
                      {acceptedComment.content
                        .replace(/!\[[^\]]*\]\([^)]+\)/g, '[Görsel]')
                        .replace(/[#>*_`~-]/g, '')
                        .slice(0, 120)}
                    </p>
                  </div>
                </div>
                <a
                  href={`#yorum-${acceptedComment.id}`}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-mono font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] transition-colors"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Çözüme Git
                </a>
              </div>
            )}

            {/* Etiketler */}
            {tagList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-4 font-mono">
                {tagList.map((tag) => (
                  <Link
                    key={tag}
                    href={`/?etiket=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-xs font-medium bg-[#0D0F12] border border-[#232730] text-[#8B949E] hover:border-[#10B981]/50 hover:text-[#10B981] transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Alt Bar: Oylama ve Aksiyon Butonları */}
            <div className="pt-4 border-t border-[#232730] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <VoteButtons
                  threadId={thread.id}
                  initialScore={score}
                  initialUserVote={userVote}
                  vertical={false}
                  isLoggedIn={!!user}
                />
                <span className="text-xs font-mono text-[#8B949E] hidden sm:inline">
                  Faydalı mı?
                </span>
              </div>

              <ThreadActions
                threadId={thread.id}
                slug={thread.slug}
                initialTitle={thread.title}
                initialContent={thread.content}
                initialTags={thread.tags}
                initialCategoryId={thread.categoryId}
                categories={allCategories}
                initialBookmarked={isBookmarked}
                isPinned={thread.isPinned}
                isLocked={thread.isLocked}
                isSolved={thread.isSolved}
                canModerate={canModerate}
                canSolveOrDelete={canSolveOrDelete}
                isLoggedIn={!!user}
              />
            </div>
          </article>

          {/* Yorum Bölümü */}
          <CommentSection
            threadId={thread.id}
            threadAuthorId={thread.authorId}
            isLocked={thread.isLocked}
            comments={formattedComments}
            currentUser={user}
          />
        </div>

        {/* SAĞ SÜTUN: Profesyonel Forum Bilgi Paneli (Sticky Sidebar) */}
        <aside className="lg:col-span-4 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:sticky lg:top-20">
          {/* Konu Özeti & Metrikler */}
          <div className="rounded-md border border-[#232730] bg-[#15181E] p-4 space-y-3.5">
            <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#10B981]" /> TARTIŞMA TELEMETRİSİ
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 rounded-md bg-[#0D0F12] border border-[#232730]">
                <p className="text-base font-bold text-[#E6EDF3] tabular-nums">
                  {formattedComments.length}
                </p>
                <p className="text-[10px] text-[#8B949E] uppercase">
                  YANIT
                </p>
              </div>
              <div className="p-2 rounded-md bg-[#0D0F12] border border-[#232730]">
                <p className="text-base font-bold text-[#10B981] tabular-nums">
                  {thread.views + 1}
                </p>
                <p className="text-[10px] text-[#8B949E] uppercase">
                  OKUNMA
                </p>
              </div>
              <div className="p-2 rounded-md bg-[#0D0F12] border border-[#232730]">
                <p className="text-base font-bold text-[#F59E0B] tabular-nums">
                  {score}
                </p>
                <p className="text-[10px] text-[#8B949E] uppercase">
                  OY
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#232730] text-xs font-mono">
              <div className="flex items-center justify-between text-[#8B949E]">
                <span>Açılış:</span>
                <span className="font-semibold text-[#E6EDF3]">
                  {formatRelativeTime(thread.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#8B949E]">
                <span>Son Aktivite:</span>
                <span className="font-semibold text-[#10B981]">
                  {formatRelativeTime(thread.updatedAt)}
                </span>
              </div>
            </div>

            {/* Katılımcılar */}
            <div className="pt-3 border-t border-[#232730]">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8B949E] mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#F59E0B]" /> KATILIMCILAR ({participants.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {participants.slice(0, 8).map((p) => (
                  <Link
                    key={p.username}
                    href={`/kullanici/${p.username}`}
                    title={`${p.displayName} (@${p.username})`}
                  >
                    <UserAvatar
                      name={p.displayName}
                      avatar={p.avatarColor}
                      className="w-7 h-7 rounded-md text-xs border border-[#232730]"
                    />
                  </Link>
                ))}
              </div>
            </div>

            {!thread.isLocked && (
              <a
                href="#yeni-yorum-formu"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Tartışmaya Yanıt Yaz
              </a>
            )}
          </div>

          {/* Konu Sahibi Kartı */}
          <div className="rounded-md border border-[#232730] bg-[#15181E] p-4 space-y-3">
            <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" /> KONU SAHİBİ
            </h3>

            <Link
              href={`/kullanici/${thread.author.username}`}
              className="flex items-center gap-3 group"
            >
              <UserAvatar
                name={thread.author.displayName}
                avatar={thread.author.avatarColor}
                className="w-10 h-10 rounded-md text-sm border border-[#232730]"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#E6EDF3] group-hover:text-[#10B981] truncate">
                  {thread.author.displayName}
                </p>
                <p className="text-xs font-mono text-[#8B949E] truncate">
                  @{thread.author.username}
                </p>
              </div>
            </Link>

            {thread.author.bio && (
              <p className="text-xs text-[#8B949E] line-clamp-2">
                {thread.author.bio}
              </p>
            )}

            <div className="p-2.5 rounded-md bg-[#0D0F12] border border-[#232730] font-mono">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span
                  className="font-semibold"
                  style={{ color: authorLevel.color }}
                >
                  Lv.{authorLevel.level} • {authorLevel.title}
                </span>
                <span className="font-bold text-[#F59E0B]">
                  {thread.author.reputation}p
                </span>
              </div>
              <div className="w-full h-1 rounded-xs bg-[#232730] overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${authorLevel.progressPercent}%`,
                    backgroundColor: authorLevel.color,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Benzer / İlgili Konular */}
          {relatedThreads.length > 0 && (
            <div className="rounded-md border border-[#232730] bg-[#15181E] p-4 space-y-3">
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8B949E]">
                İLGİLİ TARTIŞMALAR
              </h3>
              <div className="space-y-2.5 divide-y divide-[#232730]">
                {relatedThreads.map((rt) => (
                  <Link
                    key={rt.id}
                    href={`/konu/${rt.slug}`}
                    className="block group pt-2 first:pt-0"
                  >
                    <p className="text-xs font-semibold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors line-clamp-2 leading-snug">
                      {rt.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#8B949E]">
                      {rt.isSolved && (
                        <span className="text-[#10B981] font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> SOLVED
                        </span>
                      )}
                      <span>{rt._count.comments} yanıt</span>
                      <span>•</span>
                      <span>{rt.views} görüntü</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

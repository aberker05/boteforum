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

  return (
    <div className="space-y-5">
      {/* Profesyonel Forum Breadcrumb Navigasyonu */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 text-xs"
      >
        <ol className="flex items-center gap-1.5 flex-wrap text-slate-500 dark:text-slate-400 min-w-0">
          <li>
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Forum
            </Link>
          </li>
          <li>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
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
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </li>
          <li className="hidden sm:block text-slate-700 dark:text-slate-200 font-semibold truncate max-w-xs md:max-w-md">
            {thread.title}
          </li>
        </ol>

        <div className="flex items-center gap-2 shrink-0">
          {thread.isSolved ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Çözüldü
            </span>
          ) : thread.isLocked ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <Lock className="w-3.5 h-3.5" /> Kilitli
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-3.5 h-3.5" /> Açık Tartışma
            </span>
          )}
        </div>
      </nav>

      {/* 2 Sütunlu Profesyonel Forum Konu Düzeni */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SOL SÜTUN: Ana Konu Mesajı (#1) ve Yanıtlar */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Ana Konu Kartı (Post #1) */}
          <article className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-5 sm:p-7 shadow-xs">
            {/* Üst Kategori ve Durum Rozetleri */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/?kategori=${thread.category.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: `${thread.category.color}18`,
                    color: thread.category.color,
                  }}
                >
                  <CategoryIcon name={thread.category.icon} className="w-3.5 h-3.5" />
                  {thread.category.name}
                </Link>

                {thread.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Pin className="w-3.5 h-3.5" /> Sabitlenen Konu
                  </span>
                )}
                {thread.isSolved && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Çözüldü
                  </span>
                )}
                {thread.isLocked && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    <Lock className="w-3.5 h-3.5" /> Kilitli
                  </span>
                )}
              </div>

              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                #1 • Konu Başlangıcı
              </span>
            </div>

            {/* Başlık */}
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-extrabold text-slate-900 dark:text-white leading-tight">
              {thread.title}
            </h1>

            {/* Yazar & Tarih Bilgisi */}
            <div className="mt-4 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <Link
                href={`/kullanici/${thread.author.username}`}
                className="flex items-center gap-3 group"
              >
                <UserAvatar
                  name={thread.author.displayName}
                  avatar={thread.author.avatarColor}
                  className="w-10 h-10 rounded-xl text-sm shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                      {thread.author.displayName}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                      KONU SAHİBİ
                    </span>
                    {thread.author.role === 'ADMIN' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        YÖNETİCİ
                      </span>
                    )}
                    {thread.author.role === 'MODERATOR' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-pink-500/15 text-pink-600 dark:text-pink-400">
                        MOD
                      </span>
                    )}
                    {thread.author.role === 'BANNED' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        ASKIYA ALINDI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>@{thread.author.username}</span>
                    <span>•</span>
                    <span
                      className="font-semibold"
                      style={{ color: authorLevel.color }}
                    >
                      Sv.{authorLevel.level} {authorLevel.title}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                      <Award className="w-3 h-3" /> {thread.author.reputation}p
                    </span>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatRelativeTime(thread.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {thread.views + 1} okunma
                </span>
              </div>
            </div>

            {/* Konu İçeriği */}
            <div className="py-6 text-base leading-relaxed">
              <MarkdownRenderer content={thread.content} />
            </div>

            {/* Varsa Konu İçi Anket */}
            {threadPoll && (
              <ThreadPollCard initialPoll={threadPoll} isLoggedIn={!!user} />
            )}

            {/* Kabul Edilen Çözüm Özeti Kutusu (Varsa) */}
            {acceptedComment && (
              <div className="my-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                      Çözüm Onaylandı — @{acceptedComment.author.username} tarafından yanıtlandı
                    </p>
                    <p className="text-xs text-emerald-700/90 dark:text-emerald-200/80 line-clamp-1 mt-0.5">
                      {acceptedComment.content
                        .replace(/!\[[^\]]*\]\([^)]+\)/g, '[Görsel]')
                        .replace(/[#>*_`~-]/g, '')
                        .slice(0, 120)}
                    </p>
                  </div>
                </div>
                <a
                  href={`#yorum-${acceptedComment.id}`}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Çözüme Git
                </a>
              </div>
            )}

            {/* Etiketler */}
            {tagList.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 pb-5">
                {tagList.map((tag) => (
                  <Link
                    key={tag}
                    href={`/?etiket=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Alt Bar: Oylama ve Aksiyon Butonları */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <VoteButtons
                  threadId={thread.id}
                  initialScore={score}
                  initialUserVote={userVote}
                  vertical={false}
                  isLoggedIn={!!user}
                />
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Konuyu faydalı buldunuz mu?
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
        <aside className="lg:col-span-4 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5 lg:sticky lg:top-22">
          {/* Konu Özeti & Metrikler */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" /> Tartışma Özeti
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {formattedComments.length}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Yanıt
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {thread.views + 1}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Okunma
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                  {score}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Beğeni
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Açılış Tarihi:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatRelativeTime(thread.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Son Aktivite:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatRelativeTime(thread.updatedAt)}
                </span>
              </div>
            </div>

            {/* Katılımcılar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Katılımcılar ({participants.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {participants.slice(0, 8).map((p) => (
                  <Link
                    key={p.username}
                    href={`/kullanici/${p.username}`}
                    title={`${p.displayName} (@${p.username})`}
                    className="hover:scale-105 transition-transform"
                  >
                    <UserAvatar
                      name={p.displayName}
                      avatar={p.avatarColor}
                      className="w-7 h-7 rounded-lg text-xs shadow-2xs"
                    />
                  </Link>
                ))}
              </div>
            </div>

            {!thread.isLocked && (
              <a
                href="#yeni-yorum-formu"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Tartışmaya Yanıt Yaz
              </a>
            )}
          </div>

          {/* Konu Sahibi Kartı */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Konu Sahibi
            </h3>

            <Link
              href={`/kullanici/${thread.author.username}`}
              className="flex items-center gap-3 group"
            >
              <UserAvatar
                name={thread.author.displayName}
                avatar={thread.author.avatarColor}
                className="w-11 h-11 rounded-2xl text-base"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 truncate">
                  {thread.author.displayName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  @{thread.author.username}
                </p>
              </div>
            </Link>

            {thread.author.bio && (
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {thread.author.bio}
              </p>
            )}

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span
                  className="font-bold"
                  style={{ color: authorLevel.color }}
                >
                  Sv.{authorLevel.level} • {authorLevel.title}
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {thread.author.reputation}p
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full"
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
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4 space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Bu Kategorideki Diğer Konular
              </h3>
              <div className="space-y-3">
                {relatedThreads.map((rt) => (
                  <Link
                    key={rt.id}
                    href={`/konu/${rt.slug}`}
                    className="block group"
                  >
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                      {rt.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      {rt.isSolved && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Çözüldü
                        </span>
                      )}
                      <span>{rt._count.comments} yanıt</span>
                      <span>•</span>
                      <span>{rt.views} okunma</span>
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

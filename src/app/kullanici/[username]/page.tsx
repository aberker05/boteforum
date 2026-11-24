import React, { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Award,
  Calendar,
  MessageSquare,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Sparkles,
  Flame,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getSiteSettings } from '@/lib/siteSettings';
import { getUserBadges, getUserLevelInfo } from '@/lib/badges';
import { ThreadCard } from '@/components/ThreadCard';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { UserAvatar } from '@/components/UserAvatar';
import { formatRelativeTime } from '@/lib/utils';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

const getProfileUserByUsername = cache(async function getProfileUserByUsernameImpl(
  username: string
) {
  return prisma.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: {
          threads: true,
          comments: true,
        },
      },
      threads: {
        orderBy: { createdAt: 'desc' },
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
          votes: {
            select: {
              userId: true,
              value: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          thread: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const [user, settings] = await Promise.all([
    getProfileUserByUsername(username),
    getSiteSettings(),
  ]);
  const fullName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;

  if (!user) {
    return { title: `Kullanıcı Bulunamadı — ${fullName}` };
  }

  return {
    title: `${user.displayName} (@${user.username}) — ${fullName}`,
    description:
      user.bio || `${user.displayName} kullanıcısının ${fullName} profili, açtığı konular ve katkıları.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const [currentUser, profileUser] = await Promise.all([
    getCurrentUser(),
    getProfileUserByUsername(username),
  ]);

  if (!profileUser) {
    notFound();
  }

  const acceptedSolutionsCount = await prisma.comment.count({
    where: { authorId: profileUser.id, isAccepted: true },
  });

  const levelInfo = getUserLevelInfo(profileUser.reputation);
  const badges = getUserBadges({
    reputation: profileUser.reputation,
    threadCount: profileUser._count.threads,
    commentCount: profileUser._count.comments,
    acceptedSolutionsCount,
    role: profileUser.role,
  });

  const isOwnProfile = currentUser?.id === profileUser.id;

  const formattedThreads = profileUser.threads.map((t) => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    content: t.content
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '[Görsel]')
      .slice(0, 300),
    views: t.views,
    isPinned: t.isPinned,
    isLocked: t.isLocked,
    isSolved: t.isSolved,
    tags: t.tags,
    createdAt: t.createdAt,
    score: t.votes.filter((v) => v.value === 1).length,
    userVote:
      currentUser &&
        t.votes.some((v) => v.userId === currentUser.id && v.value === 1)
        ? 1
        : 0,
    commentCount: t._count.comments,
    author: t.author,
    category: t.category,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya Dön
      </Link>

      {/* Üst Profil Kartı */}
      <div className="rounded-md border border-[#232730] bg-[#15181E] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <UserAvatar
              name={profileUser.displayName}
              avatar={profileUser.avatarColor}
              className="w-16 h-16 rounded-md text-2xl font-bold border border-[#232730]"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {profileUser.displayName}
                </h1>
                {profileUser.role === 'ADMIN' && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    YÖNETİCİ
                  </span>
                )}
                {profileUser.role === 'MODERATOR' && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400">
                    MODERATÖR
                  </span>
                )}
                {profileUser.role === 'BANNED' && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    ASKIYA ALINDI
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                @{profileUser.username}
              </p>
              <p className="mt-2.5 text-sm text-slate-700 dark:text-slate-300 max-w-2xl">
                {profileUser.bio || 'Henüz biyografi eklenmemiş.'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Katılım: {new Date(profileUser.createdAt).toLocaleDateString('tr-TR')}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                  <Award className="w-4 h-4" />
                  {profileUser.reputation} İtibar Puanı
                </span>
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <div className="shrink-0">
              <ProfileEditModal
                initialDisplayName={profileUser.displayName}
                initialEmail={profileUser.email}
                initialBio={profileUser.bio || ''}
                initialColor={profileUser.avatarColor}
              />
            </div>
          )}
        </div>

        {/* İstatistik Kutuları */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
            <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {profileUser._count.threads}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Açılan Konu
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {profileUser._count.comments}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Toplam Yorum
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
            <p className="text-xl font-extrabold text-teal-600 dark:text-teal-400">
              {acceptedSolutionsCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Çözüm Kabulü
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {profileUser.reputation}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              İtibar Puanı
            </p>
          </div>
        </div>

        {/* Seviye Çubuğu ve Rozetler */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-extrabold"
                style={{
                  backgroundColor: `${levelInfo.color}20`,
                  color: levelInfo.color,
                }}
              >
                Seviye {levelInfo.level} • {levelInfo.title}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                {levelInfo.level === 5
                  ? `${profileUser.reputation}p (Maks.)`
                  : `${profileUser.reputation} / ${levelInfo.nextLevelPoints}p`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${levelInfo.progressPercent}%`,
                  backgroundColor: levelInfo.color,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                {levelInfo.level === 5
                  ? 'En yüksek topluluk rütbesine ulaşıldı! 🏆'
                  : `Sonraki seviyeye ${levelInfo.remainingPoints} puan kaldı`}
              </span>
              <Link
                href="/kurallar"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Puan Tablosu →
              </Link>
            </div>
          </div>

          <div className="md:col-span-7">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Kazanılan Rozetler ({badges.length})
            </p>
            {badges.length === 0 ? (
              <p className="text-xs text-slate-500">
                Henüz rozet kazanılmadı. Konu açarak ve çözümler üreterek rozet kazanabilirsiniz.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    title={b.description}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
                  >
                    {b.icon === 'Shield' || b.icon === 'ShieldCheck' ? (
                      <Shield className="w-3.5 h-3.5" style={{ color: b.color }} />
                    ) : b.icon === 'Sparkles' ? (
                      <Sparkles className="w-3.5 h-3.5" style={{ color: b.color }} />
                    ) : b.icon === 'Flame' ? (
                      <Flame className="w-3.5 h-3.5" style={{ color: b.color }} />
                    ) : b.icon === 'CheckCircle2' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: b.color }} />
                    ) : (
                      <Award className="w-3.5 h-3.5" style={{ color: b.color }} />
                    )}
                    <span className="text-slate-800 dark:text-slate-200">{b.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alt İçerik: Konular ve Son Yorumlar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            Açtığı Konular ({formattedThreads.length})
          </h2>

          {formattedThreads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
              Henüz konu açmamış.
            </div>
          ) : (
            <div className="space-y-3">
              {formattedThreads.map((t) => (
                <ThreadCard
                  key={t.id}
                  thread={t}
                  isLoggedIn={!!currentUser}
                  canModerate={
                    !!currentUser &&
                    (currentUser.id === profileUser.id ||
                      currentUser.role === 'ADMIN' ||
                      currentUser.role === 'MODERATOR')
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            Son Yorumları ({profileUser.comments.length})
          </h2>

          {profileUser.comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
              Henüz yorum yapmamış.
            </div>
          ) : (
            <div className="space-y-3">
              {profileUser.comments.map((c) => (
                <Link
                  key={c.id}
                  href={`/konu/${c.thread.slug}#yorumlar`}
                  className="block rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4 hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 line-clamp-1">
                      {c.thread.title}
                    </span>
                    {c.isAccepted && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {c.content
                      .replace(/!\[[^\]]*\]\([^)]+\)/g, '[Görsel]')
                      .replace(/[#>*_`~-]/g, '')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {formatRelativeTime(c.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

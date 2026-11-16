'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Eye,
  Pin,
  CheckCircle2,
  Lock,
  Tag,
  CornerDownRight,
  Award,
  Edit2,
  Trash2,
} from 'lucide-react';
import { VoteButtons } from './VoteButtons';
import { CategoryIcon } from './CategoryIcon';
import { formatRelativeTime } from '@/lib/utils';

export interface ThreadCardData {
  id: string;
  title: string;
  slug: string;
  content: string;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  tags: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  score: number;
  userVote: number;
  commentCount: number;
  author: {
    username: string;
    displayName: string;
    avatarColor: string;
    role: string;
    reputation?: number;
  };
  category: {
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
  lastReply?: {
    createdAt: string | Date;
    author: {
      username: string;
      displayName: string;
      avatarColor: string;
    };
  } | null;
}

export function ThreadCard({
  thread,
  isLoggedIn,
  canModerate = false,
  compact = false,
  onDeleted,
}: {
  thread: ThreadCardData;
  isLoggedIn: boolean;
  canModerate?: boolean;
  compact?: boolean;
  onDeleted?: (threadId: string) => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleQuickDelete = async () => {
    if (
      !confirm(
        `"${thread.title}" başlıklı konuyu kalıcı olarak silmek istediğinize emin misiniz?`
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/threads/${thread.slug}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (onDeleted) {
          onDeleted(thread.id);
        } else {
          router.refresh();
        }
      }
    } finally {
      setDeleting(false);
    }
  };
  const tagList = thread.tags
    ? thread.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  // Markdown karakterlerini ve gömülü görselleri temizleyip kısa özet çıkarma
  const plainExcerpt = thread.content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '[Görsel]')
    .replace(/```[\s\S]*?```/g, '[Kod Bloğu]')
    .replace(/[#>*_`~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 165);

  if (compact) {
    return (
      <article
        className={`group relative flex items-center justify-between gap-4 px-4 py-3.5 border-b last:border-b-0 transition-colors ${
          thread.isPinned
            ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-slate-200/80 dark:border-slate-800/80 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30'
            : 'bg-white dark:bg-slate-900/90 border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50/90 dark:hover:bg-slate-800/50'
        }`}
      >
        {/* Sol: Yazar Avatarı + Konu Başlığı & Meta */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <Link
            href={`/kullanici/${thread.author.username}`}
            title={`${thread.author.displayName} (@${thread.author.username})`}
            className="shrink-0 relative"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-2xs"
              style={{ backgroundColor: thread.author.avatarColor }}
            >
              {thread.author.displayName.charAt(0).toUpperCase()}
            </div>
            {thread.isSolved && (
              <span
                title="Çözüldü"
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
              >
                <CheckCircle2 className="w-3 h-3" />
              </span>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              {thread.isPinned && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Pin className="w-2.5 h-2.5" /> SABİT
                </span>
              )}
              {thread.isSolved && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-2.5 h-2.5" /> ÇÖZÜLDÜ
                </span>
              )}
              {thread.isLocked && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <Lock className="w-2.5 h-2.5" /> KİLİTLİ
                </span>
              )}
              <Link
                href={`/konu/${thread.slug}`}
                className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate"
              >
                {thread.title}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Link
                href={`/?kategori=${thread.category.slug}`}
                className="inline-flex items-center gap-1 font-semibold hover:underline"
                style={{ color: thread.category.color }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: thread.category.color }}
                />
                {thread.category.name}
              </Link>

              <span>•</span>
              <Link
                href={`/kullanici/${thread.author.username}`}
                className="font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-500"
              >
                {thread.author.displayName}
              </Link>
              <span>•</span>
              <span>{formatRelativeTime(thread.createdAt)}</span>

              {tagList.slice(0, 2).map((tag) => (
                <Link
                  key={tag}
                  href={`/?etiket=${encodeURIComponent(tag)}`}
                  className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-500"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ: Profesyonel Forum Tablo Metrikleri (Yanıt, Görüntülenme, Son Aktivite) */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-3 text-center">
            <div
              className={`min-w-[54px] px-2 py-1 rounded-xl border text-xs ${
                thread.isSolved
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                  : thread.commentCount > 0
                  ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 font-semibold'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <div className="text-xs font-extrabold tabular-nums leading-tight">
                {thread.commentCount}
              </div>
              <div className="text-[10px] opacity-75">Yanıt</div>
            </div>

            <div className="min-w-[54px] px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300 leading-tight">
                {thread.views}
              </div>
              <div className="text-[10px] opacity-75">Okunma</div>
            </div>
          </div>

          {/* Son Yanıt / Aktivite Sütunu */}
          <div className="hidden xl:flex flex-col items-end min-w-[115px] text-right">
            {thread.lastReply ? (
              <>
                <Link
                  href={`/kullanici/${thread.lastReply.author.username}`}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-500 truncate max-w-[115px]"
                >
                  {thread.lastReply.author.displayName}
                </Link>
                <span className="text-[11px] text-slate-400">
                  {formatRelativeTime(thread.lastReply.createdAt)}
                </span>
              </>
            ) : (
              <>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Henüz yanıt yok
                </span>
                <span className="text-[11px] text-slate-400">
                  {formatRelativeTime(thread.createdAt)}
                </span>
              </>
            )}
          </div>

          {canModerate && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Link
                href={`/konu/${thread.slug}?duzenle=1`}
                className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                title="Konuyu Düzenle"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                disabled={deleting}
                onClick={handleQuickDelete}
                className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                title="Konuyu Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group relative rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex gap-3.5 sm:gap-4 ${
        thread.isPinned
          ? 'bg-indigo-50/40 dark:bg-indigo-950/15 border-indigo-200/90 dark:border-indigo-800/60 hover:border-indigo-400/80'
          : thread.isSolved
          ? 'bg-white dark:bg-slate-900/90 border-emerald-500/30 dark:border-emerald-500/25 hover:border-emerald-500/50 shadow-2xs hover:shadow-md'
          : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 shadow-2xs hover:shadow-md'
      }`}
    >
      {/* Sol: Yazar Avatarı & Durum Rozeti */}
      <Link
        href={`/kullanici/${thread.author.username}`}
        title={`${thread.author.displayName} (@${thread.author.username})`}
        className="shrink-0 relative self-start mt-0.5 hidden sm:block group/avatar"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-xs group-hover/avatar:scale-105 transition-transform"
          style={{ backgroundColor: thread.author.avatarColor }}
        >
          {thread.author.displayName.charAt(0).toUpperCase()}
        </div>
        {thread.isSolved ? (
          <span
            title="Çözüldü"
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
          >
            <CheckCircle2 className="w-3 h-3" />
          </span>
        ) : thread.isPinned ? (
          <span
            title="Sabitlendi"
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
          >
            <Pin className="w-2.5 h-2.5" />
          </span>
        ) : null}
      </Link>

      {/* Sağ İçerik Sütunu */}
      <div className="flex-1 min-w-0">
        {/* Üst Rozetler ve Kategori */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/?kategori=${thread.category.slug}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
              style={{
                backgroundColor: `${thread.category.color}18`,
                color: thread.category.color,
              }}
            >
              <CategoryIcon name={thread.category.icon} className="w-3 h-3" />
              {thread.category.name}
            </Link>

            {thread.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Pin className="w-3 h-3" /> Sabitlendi
              </span>
            )}

            {thread.isSolved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Çözüldü
              </span>
            )}

            {thread.isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <Lock className="w-3 h-3" /> Kilitli
              </span>
            )}
          </div>

          {/* Sağ Üst: Beğeni, Yanıt & Görüntülenme Metrikleri */}
          <div className="flex items-center gap-2 text-xs">
            <VoteButtons
              threadId={thread.id}
              initialScore={thread.score}
              initialUserVote={thread.userVote}
              compact={true}
              isLoggedIn={isLoggedIn}
            />

            <Link
              href={`/konu/${thread.slug}#yorumlar`}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                thread.isSolved
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : thread.commentCount > 0
                  ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:text-indigo-500'
                  : 'border-transparent text-slate-400 hover:text-indigo-500'
              }`}
              title="Yanıt Sayısı"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {thread.commentCount} yanıt
            </Link>

            <span
              className="hidden sm:inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 pl-1"
              title="Görüntülenme"
            >
              <Eye className="w-3.5 h-3.5" />
              {thread.views}
            </span>

            {canModerate && (
              <div className="inline-flex items-center gap-1 pl-1.5 border-l border-slate-200 dark:border-slate-800">
                <Link
                  href={`/konu/${thread.slug}?duzenle=1`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  title="Konuyu Düzenle"
                >
                  <Edit2 className="w-3 h-3" />
                  <span className="hidden md:inline">Düzenle</span>
                </Link>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleQuickDelete}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                  title="Konuyu Sil"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden md:inline">Sil</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Konu Başlığı */}
        <Link
          href={`/konu/${thread.slug}`}
          className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
        >
          <h2 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
            {thread.title}
          </h2>
        </Link>

        {/* Kısa Özet */}
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {plainExcerpt}
          {thread.content.length > 165 ? '...' : ''}
        </p>

        {/* Etiketler + Yazar & Son Aktivite Alt Bilgisi */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/kullanici/${thread.author.username}`}
              className="flex items-center gap-2 group/author"
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
                style={{ backgroundColor: thread.author.avatarColor }}
              >
                {thread.author.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover/author:text-indigo-500 transition-colors">
                {thread.author.displayName}
              </span>
            </Link>

            {thread.author.role === 'ADMIN' && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                YÖNETİCİ
              </span>
            )}
            {thread.author.role === 'MODERATOR' && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-pink-500/15 text-pink-600 dark:text-pink-400">
                MOD
              </span>
            )}
            {typeof thread.author.reputation === 'number' && (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <Award className="w-3 h-3" />
                {thread.author.reputation}p
              </span>
            )}

            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {formatRelativeTime(thread.createdAt)}
            </span>

            {thread.lastReply && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 pl-1 border-l border-slate-200 dark:border-slate-800">
                <CornerDownRight className="w-3 h-3 text-indigo-500" />
                <span>Son yanıt:</span>
                <Link
                  href={`/kullanici/${thread.lastReply.author.username}`}
                  className="font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-500"
                >
                  @{thread.lastReply.author.username}
                </Link>
                <span className="text-slate-400">
                  ({formatRelativeTime(thread.lastReply.createdAt)})
                </span>
              </span>
            )}
          </div>

          {/* Etiketler */}
          {tagList.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5">
              {tagList.slice(0, 3).map((tag) => (
                <Link
                  key={tag}
                  href={`/?etiket=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

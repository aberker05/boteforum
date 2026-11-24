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
import { UserAvatar } from './UserAvatar';
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

  const hasCodeBlock =
    thread.content.includes('```') || thread.content.includes('[Kod Bloğu]');
  const hasImage =
    thread.content.includes('![') || thread.content.includes('Görsel]');

  const plainExcerpt = thread.content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '[Görsel]')
    .replace(/```[\s\S]*?```/g, '[Kod Bloğu]')
    .replace(/[#>*_`~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 155);

  if (compact) {
    return (
      <article
        className={`group relative flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-[#232730] last:border-b-0 transition-colors ${
          thread.isPinned
            ? 'bg-[#15181E] hover:bg-[#1A1E26]'
            : 'bg-[#0D0F12] hover:bg-[#15181E]'
        }`}
      >
        {/* Sol: Yazar Avatarı + Konu Başlığı & Meta */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <Link
            href={`/kullanici/${thread.author.username}`}
            title={`${thread.author.displayName} (@${thread.author.username})`}
            className="shrink-0 relative"
          >
            <UserAvatar
              name={thread.author.displayName}
              avatar={thread.author.avatarColor}
              className="w-7 h-7 rounded-md text-[11px]"
            />
            {thread.isSolved && (
              <span
                title="Çözüldü"
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-sm bg-[#10B981] text-[#0D0F12] flex items-center justify-center ring-1 ring-[#0D0F12]"
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
              </span>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              {thread.isPinned && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm font-mono text-[10px] font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                  <Pin className="w-2.5 h-2.5" /> PIN
                </span>
              )}
              {thread.isSolved && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm font-mono text-[10px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  <CheckCircle2 className="w-2.5 h-2.5" /> SOLVED
                </span>
              )}
              {thread.isLocked && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm font-mono text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <Lock className="w-2.5 h-2.5" /> LOCKED
                </span>
              )}
              <Link
                href={`/konu/${thread.slug}`}
                className="text-sm font-semibold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors truncate"
              >
                {thread.title}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#8B949E]">
              <Link
                href={`/?kategori=${thread.category.slug}`}
                className="inline-flex items-center gap-1 font-medium text-[#E6EDF3] hover:text-[#10B981]"
              >
                <span
                  className="w-1.5 h-1.5 rounded-xs"
                  style={{ backgroundColor: thread.category.color }}
                />
                {thread.category.name}
              </Link>

              <span className="text-[#232730]">/</span>
              <Link
                href={`/kullanici/${thread.author.username}`}
                className="text-[#8B949E] hover:text-[#E6EDF3]"
              >
                @{thread.author.username}
              </Link>
              <span className="text-[#232730]">/</span>
              <span>{formatRelativeTime(thread.createdAt)}</span>

              {tagList.slice(0, 2).map((tag) => (
                <Link
                  key={tag}
                  href={`/?etiket=${encodeURIComponent(tag)}`}
                  className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded-sm text-[10px] font-mono bg-[#15181E] border border-[#232730] text-[#8B949E] hover:border-[#10B981]/50 hover:text-[#10B981]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ: Tablo Metrikleri */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-mono">
          <Link
            href={`/konu/${thread.slug}#yorumlar`}
            className={`sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
              thread.isSolved
                ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981]'
                : 'bg-[#15181E] border-[#232730] text-[#8B949E]'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            {thread.commentCount}
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-center">
            <div
              className={`min-w-[52px] px-2 py-1 rounded-md border text-xs ${
                thread.isSolved
                  ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981]'
                  : thread.commentCount > 0
                  ? 'bg-[#15181E] border-[#232730] text-[#E6EDF3]'
                  : 'border-[#232730]/50 text-[#8B949E]'
              }`}
            >
              <div className="text-xs font-semibold tabular-nums leading-tight">
                {thread.commentCount}
              </div>
              <div className="text-[9px] uppercase tracking-wider opacity-75">
                yanıt
              </div>
            </div>

            <div className="min-w-[52px] px-2 py-1 text-xs text-[#8B949E]">
              <div className="text-xs font-semibold tabular-nums text-[#E6EDF3] leading-tight">
                {thread.views}
              </div>
              <div className="text-[9px] uppercase tracking-wider opacity-75">
                görüntü
              </div>
            </div>
          </div>

          <div className="hidden xl:flex flex-col items-end min-w-[115px] text-right">
            {thread.lastReply ? (
              <>
                <Link
                  href={`/kullanici/${thread.lastReply.author.username}`}
                  className="text-[11px] font-medium text-[#E6EDF3] hover:text-[#10B981] truncate max-w-[115px]"
                >
                  @{thread.lastReply.author.username}
                </Link>
                <span className="text-[10px] text-[#8B949E]">
                  {formatRelativeTime(thread.lastReply.createdAt)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[11px] text-[#8B949E]">—</span>
                <span className="text-[10px] text-[#8B949E]">
                  {formatRelativeTime(thread.createdAt)}
                </span>
              </>
            )}
          </div>

          {canModerate && (
            <div className="flex items-center gap-1 pl-2 border-l border-[#232730]">
              <Link
                href={`/konu/${thread.slug}?duzenle=1`}
                className="p-1.5 rounded-md text-[#8B949E] hover:text-[#10B981] hover:bg-[#15181E] transition-colors"
                title="Konuyu Düzenle"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                disabled={deleting}
                onClick={handleQuickDelete}
                className="p-1.5 rounded-md text-[#8B949E] hover:text-rose-400 hover:bg-[#15181E] transition-colors disabled:opacity-50"
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
      className={`group relative overflow-hidden rounded-md border transition-colors p-3.5 sm:p-4 pl-4 sm:pl-5 flex gap-3.5 ${
        thread.isPinned
          ? 'bg-[#15181E] border-[#F59E0B]/45 hover:border-[#F59E0B]'
          : thread.isSolved
          ? 'bg-[#15181E] border-[#10B981]/40 hover:border-[#10B981]'
          : 'bg-[#15181E] border-[#232730] hover:border-[#343B48] hover:bg-[#181C23]'
      }`}
    >
      {/* Sol Kenar 2px Keskin Durum Şeridi */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{
          backgroundColor: thread.isPinned
            ? '#F59E0B'
            : thread.isSolved
            ? '#10B981'
            : thread.category.color,
        }}
      />

      {/* Sol: Yazar Avatarı */}
      <Link
        href={`/kullanici/${thread.author.username}`}
        title={`${thread.author.displayName} (@${thread.author.username})`}
        className="shrink-0 relative self-start mt-0.5 hidden sm:block"
      >
        <UserAvatar
          name={thread.author.displayName}
          avatar={thread.author.avatarColor}
          className="w-9 h-9 rounded-md text-xs border border-[#232730]"
        />
        {thread.isSolved ? (
          <span
            title="Çözüldü"
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-sm bg-[#10B981] text-[#0D0F12] flex items-center justify-center ring-1 ring-[#15181E]"
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
          </span>
        ) : thread.isPinned ? (
          <span
            title="Sabitlendi"
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-sm bg-[#F59E0B] text-[#0D0F12] flex items-center justify-center ring-1 ring-[#15181E]"
          >
            <Pin className="w-2.5 h-2.5" />
          </span>
        ) : null}
      </Link>

      {/* Sağ İçerik Sütunu */}
      <div className="flex-1 min-w-0">
        {/* Üst Rozetler ve Kategori */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex flex-wrap items-center gap-1.5 font-mono">
            <Link
              href={`/?kategori=${thread.category.slug}`}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#0D0F12] border border-[#232730] hover:border-[#10B981]/50 transition-colors"
              style={{ color: thread.category.color }}
            >
              <CategoryIcon name={thread.category.icon} className="w-3 h-3" />
              {thread.category.name}
            </Link>

            {thread.isPinned && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/35">
                <Pin className="w-2.5 h-2.5" /> PINNED
              </span>
            )}

            {thread.isSolved && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/35">
                <CheckCircle2 className="w-2.5 h-2.5" /> SOLVED
              </span>
            )}

            {thread.isLocked && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/35">
                <Lock className="w-2.5 h-2.5" /> LOCKED
              </span>
            )}

            {hasCodeBlock && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-[#0D0F12] text-[#10B981] border border-[#232730]">
                &lt;/&gt; CODE
              </span>
            )}

            {hasImage && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-[#0D0F12] text-[#F59E0B] border border-[#232730]">
                IMG
              </span>
            )}
          </div>

          {/* Sağ Üst: Metrikler */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-1.5">
              <VoteButtons
                threadId={thread.id}
                initialScore={thread.score}
                initialUserVote={thread.userVote}
                compact={true}
                isLoggedIn={isLoggedIn}
              />

              <Link
                href={`/konu/${thread.slug}#yorumlar`}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                  thread.isSolved
                    ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
                    : thread.commentCount > 0
                    ? 'bg-[#0D0F12] border-[#232730] text-[#E6EDF3] hover:border-[#10B981]/40'
                    : 'bg-[#0D0F12] border-[#232730] text-[#8B949E] hover:border-[#10B981]/40'
                }`}
                title="Yanıt Sayısı"
              >
                <MessageSquare className="w-3 h-3" />
                <span className="tabular-nums">{thread.commentCount}</span>
              </Link>

              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#0D0F12] border border-[#232730] text-[#8B949E] tabular-nums"
                title="Görüntülenme"
              >
                <Eye className="w-3 h-3" />
                {thread.views}
              </span>
            </div>

            {canModerate && (
              <div className="inline-flex items-center gap-1 sm:pl-1.5 sm:border-l border-[#232730]">
                <Link
                  href={`/konu/${thread.slug}?duzenle=1`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[#8B949E] hover:text-[#10B981] hover:bg-[#0D0F12] border border-transparent hover:border-[#232730] transition-colors"
                  title="Konuyu Düzenle"
                >
                  <Edit2 className="w-3 h-3" />
                  <span className="hidden md:inline">Düzenle</span>
                </Link>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleQuickDelete}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[#8B949E] hover:text-rose-400 hover:bg-[#0D0F12] border border-transparent hover:border-[#232730] transition-colors disabled:opacity-50 cursor-pointer"
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
          prefetch={true}
          className="block group-hover:text-[#10B981] transition-colors"
        >
          <h2 className="text-[15px] sm:text-base font-bold text-[#E6EDF3] group-hover:text-[#10B981] leading-snug line-clamp-2 tracking-tight">
            {thread.title}
          </h2>
        </Link>

        {/* Kısa Özet */}
        <p className="mt-1 text-xs sm:text-[13px] text-[#8B949E] line-clamp-2 leading-relaxed">
          {plainExcerpt}
          {thread.content.length > 155 ? '...' : ''}
        </p>

        {/* Etiketler + Yazar & Son Aktivite Alt Bilgisi */}
        <div className="mt-3 pt-2.5 border-t border-[#232730] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/kullanici/${thread.author.username}`}
              className="flex items-center gap-1.5 group/author"
            >
              <UserAvatar
                name={thread.author.displayName}
                avatar={thread.author.avatarColor}
                className="w-5 h-5 rounded-sm text-[10px]"
              />
              <span className="font-medium text-[#E6EDF3] group-hover/author:text-[#10B981] transition-colors">
                @{thread.author.username}
              </span>
            </Link>

            {thread.author.role === 'ADMIN' && (
              <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-sm bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                ADMIN
              </span>
            )}
            {thread.author.role === 'MODERATOR' && (
              <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-sm bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                MOD
              </span>
            )}
            {typeof thread.author.reputation === 'number' && (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[11px] text-[#F59E0B]">
                <Award className="w-3 h-3" />
                {thread.author.reputation}p
              </span>
            )}

            <span className="text-[#232730]">/</span>
            <span className="text-[#8B949E]">
              {formatRelativeTime(thread.createdAt)}
            </span>

            {thread.lastReply && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[#8B949E] pl-2 border-l border-[#232730]">
                <CornerDownRight className="w-3 h-3 text-[#10B981]" />
                <Link
                  href={`/kullanici/${thread.lastReply.author.username}`}
                  className="text-[#E6EDF3] hover:text-[#10B981]"
                >
                  @{thread.lastReply.author.username}
                </Link>
                <span>({formatRelativeTime(thread.lastReply.createdAt)})</span>
              </span>
            )}
          </div>

          {/* Mobil Alt Etkileşim Çubuğu */}
          <div className="flex sm:hidden items-center gap-1.5 text-xs ml-auto">
            <VoteButtons
              threadId={thread.id}
              initialScore={thread.score}
              initialUserVote={thread.userVote}
              compact={true}
              isLoggedIn={isLoggedIn}
            />
            <Link
              href={`/konu/${thread.slug}#yorumlar`}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium border text-[11px] ${
                thread.isSolved
                  ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
                  : 'bg-[#0D0F12] border-[#232730] text-[#8B949E]'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              {thread.commentCount}
            </Link>
            <span className="inline-flex items-center gap-0.5 text-[11px] text-[#8B949E] pl-0.5">
              <Eye className="w-3 h-3" />
              {thread.views}
            </span>
          </div>

          {/* Etiketler */}
          {tagList.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {tagList.slice(0, 3).map((tag) => (
                <Link
                  key={tag}
                  href={`/?etiket=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[11px] font-mono bg-[#0D0F12] border border-[#232730] text-[#8B949E] hover:border-[#10B981]/50 hover:text-[#10B981] transition-colors"
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

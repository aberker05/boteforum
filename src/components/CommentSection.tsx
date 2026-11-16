'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Reply,
  CheckCircle2,
  Trash2,
  Send,
  Lock,
  CornerDownRight,
  Edit2,
  AlertTriangle,
  Quote,
  Award,
  ArrowUpDown,
} from 'lucide-react';
import { VoteButtons } from './VoteButtons';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MarkdownEditor } from './MarkdownEditor';
import { ReportModalButton } from './ReportModalButton';
import { formatRelativeTime } from '@/lib/utils';
import { checkContentModeration } from '@/lib/moderation';
import { getUserLevelInfo } from '@/lib/badges';

export interface CommentItem {
  id: string;
  content: string;
  isAccepted: boolean;
  createdAt: string | Date;
  parentId: string | null;
  score: number;
  userVote: number;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarColor: string;
    role: string;
    reputation: number;
  };
}

interface CommentSectionProps {
  threadId: string;
  threadAuthorId: string;
  isLocked: boolean;
  comments: CommentItem[];
  currentUser: {
    id: string;
    username: string;
    role: string;
  } | null;
}

// Ana yorum yazma kutusu izole edilerek her harf yazımında mevcut yorumların yeniden render edilmesi önlenir
const NewCommentForm = React.memo(function NewCommentForm({
  threadId,
  quotePayload,
  onCommentCreated,
}: {
  threadId: string;
  quotePayload: { text: string; seq: number } | null;
  onCommentCreated: (created: CommentItem) => void;
}) {
  const draftKey = `novaforum_draft_comment_${threadId}`;
  const [newComment, setNewComment] = useState('');
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Bu konu için kaydedilmiş yorum taslağı varsa geri yükle
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(draftKey);
      if (saved && saved.trim()) {
        setNewComment(saved);
        setDraftSaved(true);
      }
    } catch {
      // yoksay
    } finally {
      setDraftHydrated(true);
    }
  }, [draftKey]);

  // Yorum yazıldıkça taslağı otomatik kaydet
  useEffect(() => {
    if (!draftHydrated) return;
    const timer = setTimeout(() => {
      try {
        if (newComment.trim()) {
          window.localStorage.setItem(draftKey, newComment);
          setDraftSaved(true);
        } else {
          window.localStorage.removeItem(draftKey);
          setDraftSaved(false);
        }
      } catch {
        // yoksay
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [newComment, draftKey, draftHydrated]);

  useEffect(() => {
    if (quotePayload && quotePayload.seq > 0) {
      setNewComment((prev) =>
        prev.trim() ? `${prev.trim()}\n\n${quotePayload.text}` : quotePayload.text
      );
    }
  }, [quotePayload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;

    const modCheck = checkContentModeration(text);
    if (!modCheck.isClean) {
      setError(
        modCheck.reason ||
          'Yorumunuz topluluk kurallarına aykırı ifadeler içeriyor.'
      );
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          content: text,
          parentId: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Yorum gönderilemedi.');
      } else if (data.comment) {
        setNewComment('');
        setDraftSaved(false);
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          // yoksay
        }
        onCommentCreated(data.comment);
      }
    } catch {
      setError('Bir bağlantı hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id="yeni-yorum-formu"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4 sm:p-5 space-y-3 shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
          Tartışmaya Yanıt Yazın
        </label>
        <div className="flex items-center gap-3">
          {draftSaved && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Taslak kaydedildi
              <button
                type="button"
                onClick={() => {
                  setNewComment('');
                  setDraftSaved(false);
                  try {
                    window.localStorage.removeItem(draftKey);
                  } catch {
                    // yoksay
                  }
                }}
                className="text-rose-500 hover:underline ml-1"
              >
                (Temizle)
              </button>
            </span>
          )}
          <span className="text-[11px] text-slate-400">
            Markdown, kod bloğu ve görsel yükleme desteklenir
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>
          <strong>Topluluk Kuralları Uyarısı:</strong> Yorumlarda küfür, hakaret,
          aşağılayıcı ifadeler, nefret söylemi veya zararlı içerik paylaşılması
          kesinlikle yasaktır. Kurallara aykırı içerikler otomatik filtre
          tarafından engellenir.
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}
      <MarkdownEditor
        value={newComment}
        onChange={setNewComment}
        rows={5}
        placeholder="Yorumunuzu, teknik analizinizi veya çözüm önerinizi buraya yazın..."
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Gönderiliyor...' : 'Yanıtı Gönder'}
        </button>
      </div>
    </form>
  );
});

export function CommentSection({
  threadId,
  threadAuthorId,
  isLocked,
  comments: initialComments,
  currentUser,
}: CommentSectionProps) {
  const [commentList, setCommentList] = useState<CommentItem[]>(initialComments);
  const [commentSort, setCommentSort] = useState<'best' | 'oldest' | 'newest'>('best');
  const [quotePayload, setQuotePayload] = useState<{ text: string; seq: number } | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setCommentList(initialComments);
  }, [initialComments]);

  const rootComments = useMemo(() => {
    const roots = commentList.filter((c) => !c.parentId);
    return [...roots].sort((a, b) => {
      if (commentSort === 'best') {
        if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (commentSort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [commentList, commentSort]);

  const getReplies = (parentId: string) =>
    commentList.filter((c) => c.parentId === parentId);

  const handleCommentCreated = (created: CommentItem) => {
    setCommentList((prev) => [...prev, created]);
  };

  const handleQuoteComment = (comment: CommentItem) => {
    const cleanLine = comment.content
      .split('\n')
      .map((l) => `> ${l}`)
      .join('\n');
    const formattedQuote = `> **@${comment.author.username}** yazdı:\n${cleanLine}\n\n`;
    setQuotePayload((prev) => ({
      text: formattedQuote,
      seq: (prev?.seq || 0) + 1,
    }));
    const formEl = document.getElementById('yeni-yorum-formu');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    const text = replyContent.trim();
    if (!text) return;

    const modCheck = checkContentModeration(text);
    if (!modCheck.isClean) {
      setActionError(
        modCheck.reason ||
          'Yanıtınız topluluk kurallarına aykırı ifadeler içeriyor.'
      );
      return;
    }

    setSubmitting(true);
    setActionError('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          content: text,
          parentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Yanıt gönderilemedi.');
      } else if (data.comment) {
        setReplyContent('');
        setReplyingTo(null);
        setCommentList((prev) => [...prev, data.comment]);
      }
    } catch {
      setActionError('Bir bağlantı hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAccept = async (commentId: string) => {
    // Anlık (Optimistic) UI güncellemesi
    setCommentList((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, isAccepted: !c.isAccepted };
        }
        return { ...c, isAccepted: false };
      })
    );

    await fetch('/api/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, action: 'toggleAccept' }),
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    // Anında listeden kaldır
    setCommentList((prev) =>
      prev.filter((c) => c.id !== commentId && c.parentId !== commentId)
    );
    await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
  };

  const handleSaveEdit = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    const trimmed = editContent.trim();
    if (!trimmed) return;

    if (currentUser?.role !== 'ADMIN') {
      const modCheck = checkContentModeration(trimmed);
      if (!modCheck.isClean) {
        setActionError(modCheck.reason || 'Uygunsuz içerik tespit edildi.');
        return;
      }
    }

    setSubmitting(true);
    setActionError('');
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          action: 'edit',
          content: trimmed,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCommentList((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, content: trimmed } : c))
        );
        setEditingId(null);
        setEditContent('');
      } else {
        setActionError(data.error || 'Yorum güncellenemedi.');
      }
    } catch {
      setActionError('Bağlantı hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const canMarkSolution =
    currentUser &&
    (currentUser.id === threadAuthorId ||
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'MODERATOR');

  const renderCommentCard = (
    comment: CommentItem,
    isReply = false,
    postIndex = 2
  ) => {
    const canDelete =
      currentUser &&
      (currentUser.id === comment.author.id ||
        currentUser.role === 'ADMIN' ||
        currentUser.role === 'MODERATOR');

    const replies = getReplies(comment.id);
    const authorLevel = getUserLevelInfo(comment.author.reputation);

    return (
      <div
        key={comment.id}
        id={`yorum-${comment.id}`}
        className={isReply ? 'mt-3 ml-5 sm:ml-9 border-l-2 border-slate-200 dark:border-slate-800 pl-3 sm:pl-4' : 'scroll-mt-24'}
      >
        <div
          className={`rounded-2xl border p-4 sm:p-5 transition-all ${
            comment.isAccepted
              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/60 dark:border-emerald-600/60 shadow-sm'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80'
          }`}
        >
          {comment.isAccepted && (
            <div className="mb-3 flex items-center justify-between gap-2 pb-2.5 border-b border-emerald-500/20">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Kabul Edilen Çözüm
              </div>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Konu sahibi tarafından onaylandı
              </span>
            </div>
          )}

          {/* Yazar Başlığı & Forum Post Meta */}
          <div className="flex items-start sm:items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/70">
            <div className="flex items-center gap-2.5 flex-wrap">
              {isReply && (
                <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <Link
                href={`/kullanici/${comment.author.username}`}
                className="flex items-center gap-2.5 group"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                  style={{ backgroundColor: comment.author.avatarColor }}
                >
                  {comment.author.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 transition-colors">
                      {comment.author.displayName}
                    </span>
                    <span className="text-xs text-slate-400">
                      @{comment.author.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: authorLevel.color }}
                    >
                      Sv.{authorLevel.level} {authorLevel.title}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      <Award className="w-2.5 h-2.5" />
                      {comment.author.reputation}p
                    </span>
                  </div>
                </div>
              </Link>

              {comment.author.id === threadAuthorId && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  KONU SAHİBİ
                </span>
              )}
              {comment.author.role === 'ADMIN' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  YÖNETİCİ
                </span>
              )}
              {comment.author.role === 'MODERATOR' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-pink-500/15 text-pink-600 dark:text-pink-400">
                  MOD
                </span>
              )}
              {comment.author.role === 'BANNED' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  ASKIYA ALINDI
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400">
              <span>{formatRelativeTime(comment.createdAt)}</span>
              {!isReply && (
                <a
                  href={`#yorum-${comment.id}`}
                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-500"
                  title="Mesaj Bağlantısı"
                >
                  #{postIndex}
                </a>
              )}
            </div>
          </div>

          {/* Yorum İçeriği */}
          {editingId === comment.id ? (
            <form
              onSubmit={(e) => handleSaveEdit(e, comment.id)}
              className="mt-2 space-y-2.5"
            >
              {actionError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                  {actionError}
                </div>
              )}
              <MarkdownEditor
                value={editContent}
                onChange={setEditContent}
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setActionError('');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !editContent.trim()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {submitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-sm sm:text-[15px] leading-relaxed">
              <MarkdownRenderer content={comment.content} />
            </div>
          )}

          {/* Alt Aksiyonlar */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <VoteButtons
                commentId={comment.id}
                initialScore={comment.score}
                initialUserVote={comment.userVote}
                vertical={false}
                isLoggedIn={!!currentUser}
              />

              {!isReply && currentUser && !isLocked && (
                <button
                  type="button"
                  onClick={() => {
                    setActionError('');
                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  Yanıtla
                </button>
              )}

              {currentUser && !isLocked && (
                <button
                  type="button"
                  onClick={() => handleQuoteComment(comment)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Bu mesajı alıntılayarak yanıt yaz"
                >
                  <Quote className="w-3.5 h-3.5" />
                  Alıntıla
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentUser?.id !== comment.author.id && (
                <ReportModalButton
                  targetType="COMMENT"
                  targetId={comment.id}
                  isLoggedIn={!!currentUser}
                  compact
                />
              )}

              {canMarkSolution && !isReply && (
                <button
                  type="button"
                  onClick={() => handleToggleAccept(comment.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    comment.isAccepted
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {comment.isAccepted ? 'Çözüm Seçildi' : 'Çözüm Seç'}
                </button>
              )}

              {canDelete && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActionError('');
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                    title="Yorumu Düzenle"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Yorumu Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sil</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Yanıtlama Formu */}
          {replyingTo === comment.id && (
            <form
              onSubmit={(e) => handleSubmitReply(e, comment.id)}
              className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800"
            >
              {actionError && (
                <div className="mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                  {actionError}
                </div>
              )}
              <textarea
                rows={3}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`@${comment.author.username} kullanıcısına yanıt yazın...`}
                className="w-full p-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  Yanıtı Gönder
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Alt Yanıtlar */}
        {replies.length > 0 && (
          <div className="space-y-3">
            {replies.map((reply) => renderCommentCard(reply, true, postIndex))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="yorumlar" className="mt-8 space-y-5">
      {/* Yorum Başlığı & Sıralama Sekmeleri */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/90 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          Tartışma Yanıtları ({commentList.length})
        </h3>

        {rootComments.length > 1 && (
          <div className="flex items-center gap-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:inline" />
            <button
              type="button"
              onClick={() => setCommentSort('best')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                commentSort === 'best'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Önerilen
            </button>
            <button
              type="button"
              onClick={() => setCommentSort('oldest')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                commentSort === 'oldest'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Kronolojik
            </button>
            <button
              type="button"
              onClick={() => setCommentSort('newest')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                commentSort === 'newest'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              En Yeni
            </button>
          </div>
        )}
      </div>

      {/* Yorum Listesi */}
      {rootComments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
          Henüz yanıt yazılmamış. İlk teknik değerlendirmeyi veya çözümü siz paylaşın!
        </div>
      ) : (
        <div className="space-y-4">
          {rootComments.map((comment, idx) =>
            renderCommentCard(comment, false, idx + 2)
          )}
        </div>
      )}

      {/* Yeni Yorum Yazma Alanı */}
      {isLocked && currentUser?.role === 'MEMBER' ? (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-4 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
          <Lock className="w-5 h-5 shrink-0" />
          Bu konu moderatör tarafından kilitlenmiştir, yeni yanıt yazılamaz.
        </div>
      ) : currentUser ? (
        <NewCommentForm
          threadId={threadId}
          quotePayload={quotePayload}
          onCommentCreated={handleCommentCreated}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Bu tartışmaya yanıt yazmak, alıntı yapmak ve oy kullanmak için giriş yapmalısınız.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/giris"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Giriş Yap
            </Link>
            <Link
              href="/kayit"
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

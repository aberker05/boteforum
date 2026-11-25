'use client';

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Reply,
  Trash2,
  Send,
  CornerDownRight,
  Edit2,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { TechNewsCommentItem } from '@/lib/techNews';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownRenderer } from './MarkdownRenderer';
import { UserAvatar } from './UserAvatar';
import { formatRelativeTime } from '@/lib/utils';
import { checkContentModeration } from '@/lib/moderation';

interface TechNewsCommentsProps {
  newsId: string;
  comments: TechNewsCommentItem[];
  currentUser: {
    id: string;
    username: string;
    role: string;
  } | null;
}

const NewNewsCommentForm = memo(function NewNewsCommentForm({
  newsId,
  onCommentAdded,
}: {
  newsId: string;
  onCommentAdded: (comment: TechNewsCommentItem) => void;
}) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const modCheck = checkContentModeration(newComment);
    if (!modCheck.isClean) {
      setError(modCheck.reason || 'Yorumunuz topluluk kurallarına aykırı ifadeler içeriyor.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/news/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsId,
          content: newComment,
          parentId: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Yorum gönderilemedi.');
      } else {
        setNewComment('');
        if (data.comment) {
          onCommentAdded(data.comment);
        }
      }
    } catch {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id="yeni-yorum-formu"
      onSubmit={handleSubmit}
      className="rounded-md border border-[#232730] bg-[#15181E] p-4 sm:p-5 space-y-3"
    >
      <label className="block text-sm font-bold text-[#E6EDF3]">
        Bu Teknolojik Gelişme Hakkında Görüşünüzü Paylaşın
      </label>

      <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B]">
        <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
        <span>
          <strong>Topluluk Kuralları Uyarısı:</strong> Yorumlarda küfür, hakaret, aşağılayıcı ifadeler, nefret söylemi veya zararlı içerik paylaşılması kesinlikle yasaktır. Kurallara aykırı içerikler otomatik filtre tarafından engellenir.
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
          {error}
        </div>
      )}
      <MarkdownEditor
        value={newComment}
        onChange={setNewComment}
        rows={4}
        placeholder="Bu gelişmenin sektöre etkileri, teknik detayları veya geleceği hakkındaki düşüncelerinizi yazın..."
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] disabled:opacity-50 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          {submitting ? 'Gönderiliyor...' : 'Yorumu Gönder'}
        </button>
      </div>
    </form>
  );
});

export function TechNewsComments({
  newsId,
  comments: initialComments,
  currentUser,
}: TechNewsCommentsProps) {
  const router = useRouter();
  const [commentList, setCommentList] = useState<TechNewsCommentItem[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCommentList(initialComments);
  }, [initialComments]);

  const rootComments = commentList.filter((c) => !c.parentId);
  const getReplies = (parentId: string) =>
    commentList.filter((c) => c.parentId === parentId);

  const handleCommentAdded = (comment: TechNewsCommentItem) => {
    setCommentList((prev) => [...prev, comment]);
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    const modCheck = checkContentModeration(replyContent);
    if (!modCheck.isClean) {
      setError(modCheck.reason || 'Yorumunuz topluluk kurallarına aykırı ifadeler içeriyor.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/news/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsId,
          content: replyContent,
          parentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Yorum gönderilemedi.');
      } else {
        setReplyContent('');
        setReplyingTo(null);
        if (data.comment) {
          setCommentList((prev) => [...prev, data.comment]);
        } else {
          router.refresh();
        }
      }
    } catch {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    const updatedText = editContent.trim();
    setSubmitting(true);
    const res = await fetch('/api/news/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, content: updatedText }),
    });
    setSubmitting(false);
    if (res.ok) {
      setCommentList((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: updatedText } : c))
      );
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/news/comments?id=${commentId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setCommentList((prev) =>
        prev.filter((c) => c.id !== commentId && c.parentId !== commentId)
      );
    }
  };

  const renderComment = (comment: TechNewsCommentItem, isReply = false) => {
    const canModify =
      !!currentUser &&
      (currentUser.id === comment.author.id ||
        currentUser.role === 'ADMIN' ||
        currentUser.role === 'MODERATOR');

    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={isReply ? 'mt-3 ml-6 sm:ml-10' : ''}>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4 sm:p-5">
          {/* Yazar Başlığı */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              {isReply && (
                <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <Link
                href={`/kullanici/${comment.author.username}`}
                className="flex items-center gap-2 group"
              >
                <UserAvatar
                  name={comment.author.displayName}
                  avatar={comment.author.avatarColor}
                  className="w-7 h-7 rounded-lg text-xs"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 transition-colors">
                    {comment.author.displayName}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5">
                    @{comment.author.username}
                  </span>
                </div>
              </Link>

              {comment.author.role === 'ADMIN' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  YÖNETİCİ
                </span>
              )}
              {comment.author.role === 'MODERATOR' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-pink-500/15 text-pink-600 dark:text-pink-400">
                  MOD
                </span>
              )}
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <Award className="w-3 h-3" />
                {comment.author.reputation}p
              </span>
            </div>

            <span className="text-xs text-slate-400">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          {/* Yorum İçeriği veya Düzenleme Formu */}
          {editingId === comment.id ? (
            <form
              onSubmit={(e) => handleSaveEdit(e, comment.id)}
              className="mt-2 space-y-2.5"
            >
              <MarkdownEditor
                value={editContent}
                onChange={setEditContent}
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
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
            <div className="text-sm sm:text-base">
              <MarkdownRenderer content={comment.content} />
            </div>
          )}

          {/* Alt Aksiyonlar */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-2">
            <div>
              {!isReply && currentUser && (
                <button
                  type="button"
                  onClick={() =>
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  Yanıtla
                </button>
              )}
            </div>

            {canModify && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
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
                  onClick={() => handleDelete(comment.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Yorumu Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sil</span>
                </button>
              </div>
            )}
          </div>

          {/* Yanıt Yazma Formu */}
          {replyingTo === comment.id && (
            <form
              onSubmit={(e) => handleReplySubmit(e, comment.id)}
              className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800"
            >
              {error && (
                <div className="mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}
              <textarea
                rows={3}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`@${comment.author.username} kullanıcısına yanıtınız...`}
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

        {replies.length > 0 && (
          <div className="space-y-3">
            {replies.map((r) => renderComment(r, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="tartisma" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          Topluluk Tartışması & Yorumlar ({commentList.length})
        </h2>
      </div>

      {/* Yorum Yazma Kutusu */}
      {currentUser ? (
        <NewNewsCommentForm newsId={newsId} onCommentAdded={handleCommentAdded} />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Bu teknolojik gelişme hakkındaki tartışmaya katılmak için giriş yapmalısınız.
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

      {/* Yorum Listesi */}
      {rootComments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
          Bu gelişme hakkında henüz yorum yapılmamış. İlk değerlendirmeyi siz yazın!
        </div>
      ) : (
        <div className="space-y-4">
          {rootComments.map((comment) => renderComment(comment, false))}
        </div>
      )}
    </section>
  );
}


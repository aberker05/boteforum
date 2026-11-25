'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  Pin,
  Lock,
  CheckCircle2,
  Trash2,
  Share2,
  Check,
  Edit2,
  X,
} from 'lucide-react';
import { MarkdownEditor } from './MarkdownEditor';
import { ReportModalButton } from './ReportModalButton';

interface ThreadCategoryOption {
  id: string;
  name: string;
  color: string;
}

interface ThreadActionsProps {
  threadId: string;
  slug: string;
  initialTitle: string;
  initialContent: string;
  initialTags: string;
  initialCategoryId?: string;
  categories?: ThreadCategoryOption[];
  initialBookmarked: boolean;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  canModerate: boolean;
  canSolveOrDelete: boolean;
  isLoggedIn: boolean;
}

export function ThreadActions({
  threadId,
  slug,
  initialTitle,
  initialContent,
  initialTags,
  initialCategoryId = '',
  categories = [],
  initialBookmarked,
  isPinned,
  isLocked,
  isSolved,
  canModerate,
  canSolveOrDelete,
  isLoggedIn,
}: ThreadActionsProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pinned, setPinned] = useState(isPinned);
  const [locked, setLocked] = useState(isLocked);
  const [solved, setSolved] = useState(isSolved);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPinned(isPinned);
    setLocked(isLocked);
    setSolved(isSolved);
  }, [isPinned, isLocked, isSolved]);

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(initialTitle);
  const [editContent, setEditContent] = useState(initialContent);
  const [editTags, setEditTags] = useState(initialTags);
  const [editCategoryId, setEditCategoryId] = useState(initialCategoryId);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (canSolveOrDelete && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('duzenle') === '1') {
        setEditOpen(true);
      }
    }
  }, [canSolveOrDelete]);

  const toggleBookmark = async () => {
    if (!isLoggedIn) {
      router.push('/giris');
      return;
    }
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId }),
      });
      if (!res.ok) {
        setBookmarked(prev);
      }
    } catch {
      setBookmarked(prev);
    }
  };

  const handleAction = async (action: 'togglePin' | 'toggleLock' | 'toggleSolved') => {
    // 0ms Anlık (Optimistic) buton güncellemesi
    if (action === 'toggleSolved') setSolved((prev) => !prev);
    if (action === 'togglePin') setPinned((prev) => !prev);
    if (action === 'toggleLock') setLocked((prev) => !prev);

    try {
      const res = await fetch(`/api/threads/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        if (action === 'toggleSolved') setSolved((prev) => !prev);
        if (action === 'togglePin') setPinned((prev) => !prev);
        if (action === 'toggleLock') setLocked((prev) => !prev);
      } else if (action === 'toggleLock') {
        router.refresh();
      }
    } catch {
      if (action === 'toggleSolved') setSolved((prev) => !prev);
      if (action === 'togglePin') setPinned((prev) => !prev);
      if (action === 'toggleLock') setLocked((prev) => !prev);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim().length < 5) {
      setEditError('Konu başlığı en az 5 karakter olmalıdır.');
      return;
    }
    if (!editContent.trim()) {
      setEditError('Konu içeriği boş olamaz.');
      return;
    }

    setLoading(true);
    setEditError('');
    try {
      const res = await fetch(`/api/threads/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          title: editTitle,
          content: editContent,
          tags: editTags,
          categoryId: editCategoryId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Güncelleme başarısız.');
      } else {
        setEditOpen(false);
        router.refresh();
      }
    } catch {
      setEditError('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu konuyu kalıcı olarak silmek istediğinize emin misiniz?')) return;
    setLoading(true);
    const res = await fetch(`/api/threads/${slug}`, { method: 'DELETE' });
    if (res.ok) {
      window.location.href = '/';
    } else {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleBookmark}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            bookmarked
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
          {bookmarked ? 'Kaydedildi' : 'Kaydet'}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Kopyalandı
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              Paylaş
            </>
          )}
        </button>

        {!canSolveOrDelete && (
          <ReportModalButton
            targetType="THREAD"
            targetId={threadId}
            isLoggedIn={isLoggedIn}
          />
        )}

        {canSolveOrDelete && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setEditTitle(initialTitle);
                setEditContent(initialContent);
                setEditTags(initialTags);
                setEditCategoryId(initialCategoryId);
                setEditError('');
                setEditOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Düzenle / Taşı
            </button>

            <button
              type="button"
              onClick={() => handleAction('toggleSolved')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                solved
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {solved ? 'Çözüldü İşaretini Kaldır' : 'Çözüldü İşaretle'}
            </button>
          </>
        )}

        {canModerate && (
          <>
            <button
              type="button"
              onClick={() => handleAction('togglePin')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                pinned
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              {pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
            </button>

            <button
              type="button"
              onClick={() => handleAction('toggleLock')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                locked
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {locked ? 'Kilidi Aç' : 'Kilitle'}
            </button>
          </>
        )}

        {canSolveOrDelete && (
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Sil
          </button>
        )}
      </div>

      {/* Konu Düzenleme Modalı */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Konuyu Düzenle
              </h3>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Konu Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kategori (Konuyu Başka Kategoriye Taşı)
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Etiketler (Virgülle ayırın, en fazla 5 adet)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="nextjs, react, mimari"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  İçerik (Markdown)
                </label>
                <MarkdownEditor
                  value={editContent}
                  onChange={setEditContent}
                  rows={8}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

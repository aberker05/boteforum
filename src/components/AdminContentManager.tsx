'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  MessageSquare,
  Newspaper,
  Search,
  Edit2,
  Trash2,
  Pin,
  Lock,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { MarkdownEditor } from './MarkdownEditor';
import { TechNewsCoverPicker } from './TechNewsCover';
import {
  TechNewsItem,
  AdminTechNewsCommentItem,
  TECH_NEWS_CATEGORIES,
} from '@/lib/techNews';
import { formatRelativeTime } from '@/lib/utils';

export interface AdminThreadRecord {
  id: string;
  title: string;
  slug: string;
  content: string;
  tags: string;
  categoryId: string;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  views: number;
  createdAt: string | Date;
  author: {
    username: string;
    displayName: string;
    avatarColor: string;
  };
  category: {
    id: string;
    name: string;
    color: string;
  };
  _count: {
    comments: number;
  };
}

export interface AdminCommentRecord {
  id: string;
  content: string;
  isAccepted: boolean;
  createdAt: string | Date;
  author: {
    username: string;
    displayName: string;
    avatarColor: string;
  };
  thread: {
    id: string;
    title: string;
    slug: string;
  };
}

interface AdminContentManagerProps {
  initialThreads: AdminThreadRecord[];
  initialComments: AdminCommentRecord[];
  initialTechNews: TechNewsItem[];
  initialTechNewsComments: AdminTechNewsCommentItem[];
  categories: Array<{ id: string; name: string; color: string }>;
}

export function AdminContentManager({
  initialThreads,
  initialComments,
  initialTechNews,
  initialTechNewsComments,
  categories,
}: AdminContentManagerProps) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<
    'threads' | 'comments' | 'news' | 'newsComments'
  >('threads');
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Yerel state listeleri (anlık UI güncellemesi için)
  const [threads, setThreads] = useState<AdminThreadRecord[]>(initialThreads);
  const [comments, setComments] =
    useState<AdminCommentRecord[]>(initialComments);
  const [techNews, setTechNews] = useState<TechNewsItem[]>(initialTechNews);
  const [techNewsComments, setTechNewsComments] = useState<
    AdminTechNewsCommentItem[]
  >(initialTechNewsComments);

  // Konu Düzenleme Modal State
  const [editingThread, setEditingThread] =
    useState<AdminThreadRecord | null>(null);
  const [tTitle, setTTitle] = useState('');
  const [tContent, setTContent] = useState('');
  const [tTags, setTTags] = useState('');
  const [tCategoryId, setTCategoryId] = useState('');

  // Yorum Düzenleme Modal State (Hem Forum Yorumu hem Haber Yorumu için)
  const [editingComment, setEditingComment] = useState<{
    id: string;
    kind: 'forum' | 'news';
    content: string;
    contextTitle: string;
  } | null>(null);
  const [cContent, setCContent] = useState('');

  // Teknoloji Haberi Ekleme / Düzenleme Modal State
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<TechNewsItem | null>(null);
  const [nTitle, setNTitle] = useState('');
  const [nCategory, setNCategory] = useState(TECH_NEWS_CATEGORIES[0].name);
  const [nBadgeColor, setNBadgeColor] = useState(TECH_NEWS_CATEGORIES[0].color);
  const [nSummary, setNSummary] = useState('');
  const [nContent, setNContent] = useState('');
  const [nSource, setNSource] = useState('');
  const [nReadTime, setNReadTime] = useState('3 dk okuma');
  const [nImageUrl, setNImageUrl] = useState('');
  const [nFeatured, setNFeatured] = useState(false);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    if (type === 'success') {
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Filtrelenmiş listeler
  const q = search.trim().toLowerCase();

  const filteredThreads = useMemo(() => {
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.author.username.toLowerCase().includes(q) ||
        t.author.displayName.toLowerCase().includes(q) ||
        t.category.name.toLowerCase().includes(q)
    );
  }, [threads, q]);

  const filteredComments = useMemo(() => {
    if (!q) return comments;
    return comments.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        c.author.username.toLowerCase().includes(q) ||
        c.author.displayName.toLowerCase().includes(q) ||
        c.thread.title.toLowerCase().includes(q)
    );
  }, [comments, q]);

  const filteredNews = useMemo(() => {
    if (!q) return techNews;
    return techNews.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
    );
  }, [techNews, q]);

  const filteredNewsComments = useMemo(() => {
    if (!q) return techNewsComments;
    return techNewsComments.filter(
      (nc) =>
        nc.content.toLowerCase().includes(q) ||
        nc.author.username.toLowerCase().includes(q) ||
        nc.author.displayName.toLowerCase().includes(q) ||
        nc.newsTitle.toLowerCase().includes(q)
    );
  }, [techNewsComments, q]);

  // --- KONU İŞLEMLERİ ---
  const openEditThread = (t: AdminThreadRecord) => {
    setEditingThread(t);
    setTTitle(t.title);
    setTContent(t.content);
    setTTags(t.tags);
    setTCategoryId(t.categoryId);
  };

  const handleSaveThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThread) return;
    setLoadingId(editingThread.id);
    try {
      const res = await fetch(`/api/threads/${editingThread.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          title: tTitle,
          content: tContent,
          tags: tTags,
          categoryId: tCategoryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('error', data.error || 'Konu güncellenemedi.');
      } else {
        const matchedCat =
          categories.find((c) => c.id === tCategoryId) || editingThread.category;
        setThreads((prev) =>
          prev.map((item) =>
            item.id === editingThread.id
              ? {
                  ...item,
                  title: tTitle.trim(),
                  content: tContent.trim(),
                  tags: tTags,
                  categoryId: tCategoryId,
                  category: matchedCat,
                }
              : item
          )
        );
        setEditingThread(null);
        showNotice('success', 'Konu başarıyla güncellendi.');
        router.refresh();
      }
    } catch {
      showNotice('error', 'Bağlantı hatası oluştu.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleThreadQuickAction = async (
    t: AdminThreadRecord,
    action: 'togglePin' | 'toggleLock' | 'toggleSolved'
  ) => {
    setLoadingId(t.id);
    try {
      const res = await fetch(`/api/threads/${t.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setThreads((prev) =>
          prev.map((item) => {
            if (item.id !== t.id) return item;
            if (action === 'togglePin')
              return { ...item, isPinned: !item.isPinned };
            if (action === 'toggleLock')
              return { ...item, isLocked: !item.isLocked };
            return { ...item, isSolved: !item.isSolved };
          })
        );
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteThread = async (t: AdminThreadRecord) => {
    if (
      !confirm(
        `"${t.title}" başlıklı konuyu ve altındaki tüm yorumları kalıcı olarak silmek istediğinize emin misiniz?`
      )
    ) {
      return;
    }
    setLoadingId(t.id);
    try {
      const res = await fetch(`/api/threads/${t.slug}`, { method: 'DELETE' });
      if (res.ok) {
        setThreads((prev) => prev.filter((item) => item.id !== t.id));
        setComments((prev) =>
          prev.filter((c) => c.thread.id !== t.id)
        );
        showNotice('success', 'Konu kalıcı olarak silindi.');
        router.refresh();
      } else {
        showNotice('error', 'Konu silinemedi.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  // --- YORUM İŞLEMLERİ (FORUM & HABER YORUMLARI) ---
  const handleSaveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment || !cContent.trim()) return;
    setLoadingId(editingComment.id);
    try {
      if (editingComment.kind === 'forum') {
        const res = await fetch('/api/comments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commentId: editingComment.id,
            action: 'edit',
            content: cContent.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showNotice('error', data.error || 'Yorum güncellenemedi.');
        } else {
          setComments((prev) =>
            prev.map((c) =>
              c.id === editingComment.id
                ? { ...c, content: cContent.trim() }
                : c
            )
          );
          setEditingComment(null);
          showNotice('success', 'Forum yorumu başarıyla güncellendi.');
          router.refresh();
        }
      } else {
        const res = await fetch('/api/news/comments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commentId: editingComment.id,
            content: cContent.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showNotice('error', data.error || 'Haber yorumu güncellenemedi.');
        } else {
          setTechNewsComments((prev) =>
            prev.map((nc) =>
              nc.id === editingComment.id
                ? { ...nc, content: cContent.trim() }
                : nc
            )
          );
          setEditingComment(null);
          showNotice('success', 'Haber yorumu başarıyla güncellendi.');
          router.refresh();
        }
      }
    } catch {
      showNotice('error', 'Bağlantı hatası oluştu.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteForumComment = async (id: string) => {
    if (!confirm('Bu yorumu kalıcı olarak silmek istediğinize emin misiniz?')) {
      return;
    }
    setLoadingId(id);
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        showNotice('success', 'Yorum silindi.');
        router.refresh();
      } else {
        showNotice('error', 'Yorum silinemedi.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteNewsComment = async (id: string) => {
    if (!confirm('Bu haber yorumunu kalıcı olarak silmek istediğinize emin misiniz?')) {
      return;
    }
    setLoadingId(id);
    try {
      const res = await fetch(`/api/news/comments?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTechNewsComments((prev) => prev.filter((nc) => nc.id !== id));
        showNotice('success', 'Haber yorumu silindi.');
        router.refresh();
      } else {
        showNotice('error', 'Haber yorumu silinemedi.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  // --- TEKNOLOJİ HABERİ İŞLEMLERİ ---
  const openCreateNews = () => {
    setEditingNews(null);
    setNTitle('');
    setNCategory(TECH_NEWS_CATEGORIES[0].name);
    setNBadgeColor(TECH_NEWS_CATEGORIES[0].color);
    setNSummary('');
    setNContent('');
    setNSource('');
    setNReadTime('3 dk okuma');
    setNImageUrl('');
    setNFeatured(false);
    setNewsModalOpen(true);
  };

  const openEditNews = (n: TechNewsItem) => {
    setEditingNews(n);
    setNTitle(n.title);
    setNCategory(n.category);
    setNBadgeColor(
      n.badgeColor ||
        TECH_NEWS_CATEGORIES.find((c) => c.name === n.category)?.color ||
        '#10b981'
    );
    setNSummary(n.summary);
    setNContent(n.content);
    setNSource(n.source);
    setNReadTime(n.readTime);
    setNImageUrl(n.imageUrl || '');
    setNFeatured(Number(n.isFeatured) === 1);
    setNewsModalOpen(true);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nTitle.trim() || !nSummary.trim() || !nContent.trim()) return;
    setLoadingId(editingNews ? editingNews.id : 'new_news');
    try {
      const res = await fetch('/api/news', {
        method: editingNews ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingNews ? { id: editingNews.id } : {}),
          title: nTitle,
          category: nCategory,
          badgeColor: nBadgeColor,
          summary: nSummary,
          content: nContent,
          source: nSource,
          readTime: nReadTime,
          imageUrl: nImageUrl,
          isFeatured: nFeatured,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('error', data.error || 'Haber kaydedilemedi.');
      } else {
        if (editingNews) {
          setTechNews((prev) =>
            prev.map((item) =>
              item.id === editingNews.id ? data.news : item
            )
          );
          showNotice('success', 'Teknoloji haberi güncellendi.');
        } else {
          setTechNews((prev) => [data.news, ...prev]);
          showNotice('success', 'Yeni teknoloji haberi yayınlandı.');
        }
        setNewsModalOpen(false);
        router.refresh();
      }
    } catch {
      showNotice('error', 'Bağlantı hatası oluştu.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteNews = async (n: TechNewsItem) => {
    if (
      !confirm(
        `"${n.title}" başlıklı haberi ve altındaki yorumları silmek istediğinize emin misiniz?`
      )
    ) {
      return;
    }
    setLoadingId(n.id);
    try {
      const res = await fetch(`/api/news?id=${n.id}`, { method: 'DELETE' });
      if (res.ok) {
        setTechNews((prev) => prev.filter((item) => item.id !== n.id));
        setTechNewsComments((prev) =>
          prev.filter((nc) => nc.newsId !== n.id)
        );
        showNotice('success', 'Teknoloji haberi silindi.');
        router.refresh();
      } else {
        showNotice('error', 'Haber silinemedi.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 sm:p-6 space-y-5">
      {/* Üst Başlık ve Alt Sekmeler */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Tüm Forum İçerikleri ve Yorum Yönetimi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Forumda paylaşılan tüm konuları, konu yorumlarını, teknoloji haberlerini ve haber yorumlarını tek merkezden düzenleyebilir veya silebilirsiniz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İçerik, başlık veya yazar ara..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
          {subTab === 'news' && (
            <button
              type="button"
              onClick={openCreateNews}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Yeni Haber Ekle
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alt Kategori Seçici */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSubTab('threads')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            subTab === 'threads'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Forum Konuları ({threads.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('comments')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            subTab === 'comments'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Forum Yorumları ({comments.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('news')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            subTab === 'news'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          Teknoloji Haberleri ({techNews.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('newsComments')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            subTab === 'newsComments'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Haber Yorumları ({techNewsComments.length})
        </button>
      </div>

      {/* 1. FORUM KONULARI LİSTESİ */}
      {subTab === 'threads' && (
        <div className="space-y-3">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              Eşleşen konu bulunamadı.
            </div>
          ) : (
            filteredThreads.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/30 transition-all"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                      style={{
                        backgroundColor: `${t.category.color}18`,
                        color: t.category.color,
                      }}
                    >
                      {t.category.name}
                    </span>
                    {t.isPinned && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        SABİT
                      </span>
                    )}
                    {t.isSolved && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        ÇÖZÜLDÜ
                      </span>
                    )}
                    {t.isLocked && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        KİLİTLİ
                      </span>
                    )}
                    <Link
                      href={`/konu/${t.slug}`}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate"
                    >
                      {t.title}
                    </Link>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {t.content
                      .replace(/!\[[^\]]*\]\([^)]+\)/g, '[Görsel]')
                      .replace(/[#>*_`~-]/g, '')
                      .slice(0, 180)}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>
                      Yazar:{' '}
                      <strong className="text-slate-600 dark:text-slate-300">
                        @{t.author.username}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>{formatRelativeTime(t.createdAt)}</span>
                    <span>•</span>
                    <span>{t._count.comments} yorum</span>
                    <span>•</span>
                    <span>{t.views} okunma</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={loadingId === t.id}
                    onClick={() => handleThreadQuickAction(t, 'togglePin')}
                    className={`p-2 rounded-xl border text-xs transition-colors ${
                      t.isPinned
                        ? 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title={t.isPinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={loadingId === t.id}
                    onClick={() => handleThreadQuickAction(t, 'toggleLock')}
                    className={`p-2 rounded-xl border text-xs transition-colors ${
                      t.isLocked
                        ? 'border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title={t.isLocked ? 'Kilidi Aç' : 'Kilitle'}
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={loadingId === t.id}
                    onClick={() => handleThreadQuickAction(t, 'toggleSolved')}
                    className={`p-2 rounded-xl border text-xs transition-colors ${
                      t.isSolved
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title={
                      t.isSolved ? 'Çözüldü İşaretini Kaldır' : 'Çözüldü İşaretle'
                    }
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditThread(t)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Düzenle
                  </button>

                  <button
                    type="button"
                    disabled={loadingId === t.id}
                    onClick={() => handleDeleteThread(t)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. FORUM YORUMLARI LİSTESİ */}
      {subTab === 'comments' && (
        <div className="space-y-3">
          {filteredComments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              Eşleşen yorum bulunamadı.
            </div>
          ) : (
            filteredComments.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/30 transition-all"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {c.author.displayName} (@{c.author.username})
                    </span>
                    <span className="text-slate-400">•</span>
                    <Link
                      href={`/konu/${c.thread.slug}#yorum-${c.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-md"
                    >
                      {c.thread.title}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </Link>
                    {c.isAccepted && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        ÇÖZÜM
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                    {c.content
                      .replace(/!\[[^\]]*\]\([^)]+\)/g, '[Görsel]')
                      .replace(/[#>*_`~-]/g, '')}
                  </p>

                  <span className="text-[11px] text-slate-400 block">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingComment({
                        id: c.id,
                        kind: 'forum',
                        content: c.content,
                        contextTitle: c.thread.title,
                      });
                      setCContent(c.content);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Düzenle
                  </button>

                  <button
                    type="button"
                    disabled={loadingId === c.id}
                    onClick={() => handleDeleteForumComment(c.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. TEKNOLOJİ GÜNDEMİ HABERLERİ LİSTESİ */}
      {subTab === 'news' && (
        <div className="space-y-3">
          {filteredNews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              Eşleşen teknoloji haberi bulunamadı.
            </div>
          ) : (
            filteredNews.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/30 transition-all"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                      style={{
                        backgroundColor: `${n.badgeColor}18`,
                        color: n.badgeColor,
                      }}
                    >
                      {n.category}
                    </span>
                    {Number(n.isFeatured) === 1 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        MANŞET
                      </span>
                    )}
                    <Link
                      href={`/haberler/${n.slug}`}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate"
                    >
                      {n.title}
                    </Link>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {n.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>Kaynak: {n.source}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(n.createdAt)}</span>
                    <span>•</span>
                    <span>{n.views} okunma</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditNews(n)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Düzenle
                  </button>

                  <button
                    type="button"
                    disabled={loadingId === n.id}
                    onClick={() => handleDeleteNews(n)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. TEKNOLOJİ HABERİ YORUMLARI LİSTESİ */}
      {subTab === 'newsComments' && (
        <div className="space-y-3">
          {filteredNewsComments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              Eşleşen haber yorumu bulunamadı.
            </div>
          ) : (
            filteredNewsComments.map((nc) => (
              <div
                key={nc.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/30 transition-all"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {nc.author.displayName} (@{nc.author.username})
                    </span>
                    <span className="text-slate-400">•</span>
                    <Link
                      href={`/haberler/${nc.newsSlug}#tartisma`}
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-md"
                    >
                      {nc.newsTitle}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </Link>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                    {nc.content}
                  </p>

                  <span className="text-[11px] text-slate-400 block">
                    {formatRelativeTime(nc.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingComment({
                        id: nc.id,
                        kind: 'news',
                        content: nc.content,
                        contextTitle: nc.newsTitle,
                      });
                      setCContent(nc.content);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Düzenle
                  </button>

                  <button
                    type="button"
                    disabled={loadingId === nc.id}
                    onClick={() => handleDeleteNewsComment(nc.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: KONU DÜZENLEME */}
      {editingThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Konuyu Düzenle
              </h3>
              <button
                type="button"
                onClick={() => setEditingThread(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveThread} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Konu Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={tCategoryId}
                    onChange={(e) => setTCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Etiketler (Virgülle ayırın)
                  </label>
                  <input
                    type="text"
                    value={tTags}
                    onChange={(e) => setTTags(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  İçerik (Markdown)
                </label>
                <MarkdownEditor
                  value={tContent}
                  onChange={setTContent}
                  rows={8}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingThread(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={loadingId === editingThread.id}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {loadingId === editingThread.id
                    ? 'Kaydediliyor...'
                    : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: YORUM DÜZENLEME */}
      {editingComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Yorumu Düzenle
              </h3>
              <button
                type="button"
                onClick={() => setEditingComment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 truncate">
              İlgili Başlık: <strong>{editingComment.contextTitle}</strong>
            </p>

            <form onSubmit={handleSaveComment} className="space-y-4">
              <MarkdownEditor
                value={cContent}
                onChange={setCContent}
                rows={6}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingComment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={loadingId === editingComment.id || !cContent.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {loadingId === editingComment.id
                    ? 'Kaydediliyor...'
                    : 'Yorumu Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TEKNOLOJİ HABERİ EKLEME / DÜZENLEME */}
      {newsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                {editingNews
                  ? 'Teknolojik Gelişmeyi Düzenle'
                  : 'Yeni Teknolojik Gelişme Ekle'}
              </h3>
              <button
                type="button"
                onClick={() => setNewsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNews} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Haber Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={nTitle}
                  onChange={(e) => setNTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={nCategory}
                    onChange={(e) => {
                      const nextCat = e.target.value;
                      setNCategory(nextCat);
                      const found = TECH_NEWS_CATEGORIES.find(
                        (c) => c.name === nextCat
                      );
                      if (found) setNBadgeColor(found.color);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {TECH_NEWS_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kaynak
                  </label>
                  <input
                    type="text"
                    value={nSource}
                    onChange={(e) => setNSource(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Okuma Süresi
                  </label>
                  <input
                    type="text"
                    value={nReadTime}
                    onChange={(e) => setNReadTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <TechNewsCoverPicker
                imageUrl={nImageUrl}
                category={nCategory}
                onChange={setNImageUrl}
                badgeColor={nBadgeColor}
                onBadgeColorChange={setNBadgeColor}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kısa Özet
                </label>
                <textarea
                  rows={2}
                  required
                  value={nSummary}
                  onChange={(e) => setNSummary(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detaylı İçerik (Markdown)
                </label>
                <MarkdownEditor
                  value={nContent}
                  onChange={setNContent}
                  rows={7}
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nFeatured}
                  onChange={(e) => setNFeatured(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Manşet (Öne Çıkan) olarak işaretle
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={!!loadingId}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {loadingId ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


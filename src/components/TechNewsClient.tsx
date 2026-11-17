'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  Sparkles,
  Clock,
  Eye,
  PlusCircle,
  Search,
  Trash2,
  Edit2,
  ArrowRight,
  Flame,
  X,
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { TechNewsItem, TECH_NEWS_CATEGORIES } from '@/lib/techNews';
import { formatRelativeTime } from '@/lib/utils';
import { MarkdownEditor } from './MarkdownEditor';
import TechNewsCover, {
  TechNewsCoverPicker,
  getCategoryIcon,
} from './TechNewsCover';

interface TechNewsClientProps {
  initialNews: TechNewsItem[];
  currentUser: {
    id: string;
    username: string;
    role: string;
  } | null;
}

export function TechNewsClient({ initialNews, currentUser }: TechNewsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TechNewsItem | null>(null);

  // Yeni / Düzenlenen Haber Formu
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(TECH_NEWS_CATEGORIES[0].name);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [readTime, setReadTime] = useState('3 dk okuma');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = !!currentUser && currentUser.role === 'ADMIN';
  const canModerate =
    !!currentUser &&
    (currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR');

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setCategory(TECH_NEWS_CATEGORIES[0].name);
    setSummary('');
    setContent('');
    setSource('');
    setReadTime('3 dk okuma');
    setImageUrl('');
    setIsFeatured(false);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item: TechNewsItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category);
    setSummary(item.summary);
    setContent(item.content);
    setSource(item.source);
    setReadTime(item.readTime);
    setImageUrl(item.imageUrl || '');
    setIsFeatured(Number(item.isFeatured) === 1);
    setError('');
    setModalOpen(true);
  };

  const filteredNews = initialNews.filter((item) => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const featuredNews = filteredNews.filter((n) => Number(n.isFeatured) === 1);
  const regularNews = filteredNews.filter((n) => Number(n.isFeatured) !== 1);

  const totalViews = initialNews.reduce((sum, n) => sum + (Number(n.views) || 0), 0);

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim()) {
      setError('Lütfen başlık, kısa özet ve detaylı içerik alanlarını doldurun.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/news', {
        method: editingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingItem ? { id: editingItem.id } : {}),
          title,
          category,
          summary,
          content,
          source,
          readTime,
          imageUrl,
          isFeatured,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'İşlem başarısız.');
        setSubmitting(false);
      } else if (editingItem) {
        window.location.reload();
      } else {
        window.location.href = `/haberler/${data.news.slug}`;
      }
    } catch {
      setError('Bağlantı hatası oluştu.');
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, newsTitle: string) => {
    if (!confirm(`"${newsTitle}" başlıklı teknoloji haberini silmek istediğinize emin misiniz?`)) {
      return;
    }
    const res = await fetch(`/api/news?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-7">
      {/* Üst Geri Dönüş */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Forum Akışına Dön
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Canlı Teknoloji Radarı
          </span>
        </div>
      </div>

      {/* Estetik Sinematik Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#090d16] via-indigo-950/95 to-slate-950 p-6 sm:p-9 text-white shadow-2xl border border-indigo-500/20 relative overflow-hidden">
        {/* Arka Plan Siber Dekoratif Işıklar ve Izgara */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.22) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                Canlı Teknoloji & Bilim Dergisi
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md">
                <Layers className="w-3.5 h-3.5 text-indigo-300" />
                {initialNews.length} Özel Dosya
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md">
                <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                {totalViews.toLocaleString('tr-TR')} Okunma
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-emerald-200 bg-clip-text text-transparent">
              Güncel Teknolojik Gelişmeler
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/95 leading-relaxed">
              Yapay zeka mimarileri, 2nm yarı iletken çip teknolojileri, kuantum siber güvenlik standartları, uzay araştırmaları ve modern yazılım dünyasındaki en son kırılmaları görsel dosyalarla keşfedin.
            </p>
          </div>

          {isAdmin && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Teknolojik Gelişme Ekle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Kategori Filtreleri ve Arama Çubuğu */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/90 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === ''
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tümü ({initialNews.length})
          </button>
          {TECH_NEWS_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() =>
                  setSelectedCategory(active ? '' : cat.name)
                }
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span style={{ color: active ? '#ffffff' : cat.color }}>
                  {getCategoryIcon(cat.name, 'w-3.5 h-3.5')}
                </span>
                {cat.name}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Teknoloji gündeminde ara..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>

      {/* Manşet / Öne Çıkan Gelişmeler (Görsel Sinematik Kartlar) */}
      {featuredNews.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              Manşet & Öne Çıkan Teknolojik Gelişmeler
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {featuredNews.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/90 bg-slate-950 shadow-lg hover:shadow-2xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-end min-h-[360px] sm:min-h-[400px]"
              >
                {/* Tam Boyutlu Görsel Arka Plan */}
                <TechNewsCover
                  title={item.title}
                  category={item.category}
                  badgeColor={item.badgeColor}
                  imageUrl={item.imageUrl}
                  slug={item.slug}
                  className="absolute inset-0 w-full h-full"
                  overlayVariant="hero"
                />

                {/* Üst Yüzen Rozetler ve Yönetici Butonları */}
                <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm border"
                      style={{
                        backgroundColor: `${item.badgeColor}28`,
                        borderColor: `${item.badgeColor}60`,
                        color: '#ffffff',
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.badgeColor }}
                      />
                      {item.category}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/90 text-slate-950 shadow-sm">
                      <Flame className="w-3 h-3 fill-slate-950" />
                      MANŞET
                    </span>
                  </div>

                  {canModerate && (
                    <div className="flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md p-1 rounded-xl border border-white/15">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 transition-colors cursor-pointer"
                        title="Haberi Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors cursor-pointer"
                        title="Haberi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sil</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Alt İçerik Katmanı */}
                <div className="relative z-10 p-6 sm:p-7 pt-24 flex flex-col justify-end bg-gradient-to-t from-[#070a12] via-[#070a12]/90 to-transparent">
                  <div className="flex items-center gap-2 text-xs text-slate-300/90 mb-2">
                    <span className="font-semibold text-emerald-300">
                      {item.source}
                    </span>
                    <span>•</span>
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>

                  <Link href={`/haberler/${item.slug}`}>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                      {item.title}
                    </h3>
                  </Link>

                  <p className="mt-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>

                  <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-3.5">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {item.readTime}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        {item.views}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        {item.commentCount || 0} yorum
                      </span>
                    </div>

                    <Link
                      href={`/haberler/${item.slug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-white border border-white/15 transition-all"
                    >
                      Oku & Tartış <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tüm Teknolojik Gelişmeler Izgarası (Görsel Kapaklı Dergi Kartları) */}
      <div className="space-y-3.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-1">
          <Newspaper className="w-4 h-4 text-indigo-500" />
          Son Teknolojik Gelişmeler
        </h2>

        {filteredNews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-2">
            <Newspaper className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Bu filtreye uygun teknolojik gelişme bulunamadı.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(regularNews.length > 0 ? regularNews : filteredNews).map((item) => (
              <div
                key={item.id}
                className="group rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 hover:border-indigo-500/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Üst Görsel Kapak Alanı */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <Link href={`/haberler/${item.slug}`} className="block w-full h-full">
                      <TechNewsCover
                        title={item.title}
                        category={item.category}
                        badgeColor={item.badgeColor}
                        imageUrl={item.imageUrl}
                        slug={item.slug}
                        className="w-full h-full"
                        overlayVariant="card"
                      />
                    </Link>

                    {/* Sol Üst Kategori Rozeti */}
                    <div className="absolute top-3 left-3 z-10">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-sm"
                        style={{
                          backgroundColor: 'rgba(9, 13, 22, 0.78)',
                          borderColor: `${item.badgeColor}60`,
                          color: item.badgeColor,
                        }}
                      >
                        {getCategoryIcon(item.category, 'w-3 h-3')}
                        {item.category}
                      </span>
                    </div>

                    {/* Sağ Üst Yönetici Hızlı Düzenle / Sil */}
                    {canModerate && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-white/15">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-indigo-300 hover:bg-indigo-500/25 transition-colors cursor-pointer"
                          title="Haberi Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-1.5 rounded-lg text-rose-300 hover:bg-rose-500/25 transition-colors cursor-pointer"
                          title="Haberi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Sağ Alt Okuma Süresi */}
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-950/75 text-slate-200 backdrop-blur-md border border-white/10">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        {item.readTime}
                      </span>
                    </div>
                  </div>

                  {/* Kart Gövdesi */}
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                        {item.source}
                      </span>
                      <span className="shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <Link href={`/haberler/${item.slug}`}>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                    </Link>

                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  </div>
                </div>

                {/* Kart Alt Bilgi Çubuğu */}
                <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" /> {item.views}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />{' '}
                      {item.commentCount || 0} yorum
                    </span>
                  </div>

                  <Link
                    href={`/haberler/${item.slug}`}
                    className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform"
                  >
                    Oku & Tartış <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yeni / Düzenlenen Teknolojik Gelişme Modalı */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                {editingItem
                  ? 'Teknolojik Gelişmeyi Düzenle'
                  : 'Yeni Teknolojik Gelişme Paylaş'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateNews} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Gelişme / Haber Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Açık Kaynaklı Yeni Nesil Kodlama Modeli Duyuruldu"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alan / Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
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
                    Kaynak Belirtin
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Örn: IEEE Spectrum / ArXiv"
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Okuma Süresi
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="3 dk okuma"
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Kapak Görseli Seçici / Yükleyici */}
              <TechNewsCoverPicker
                imageUrl={imageUrl}
                category={category}
                onChange={setImageUrl}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kısa Özet (Kartlarda görünür)
                </label>
                <textarea
                  rows={2}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Gelişmeyi 1-2 cümleyle özetleyin..."
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detaylı Teknik İnceleme (Markdown)
                </label>
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  rows={7}
                  placeholder="Teknolojik gelişmenin teknik detaylarını, etkilerini ve kod/mimari örneklerini yazın..."
                />
              </div>

              {canModerate && (
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Bu gelişmeyi Manşet (Öne Çıkan) olarak işaretle
                </label>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? 'Kaydediliyor...'
                    : editingItem
                    ? 'Değişiklikleri Kaydet'
                    : 'Gelişmeyi Yayınla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

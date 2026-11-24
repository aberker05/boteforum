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
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'discussed'>('newest');
  const [activeHeroIdx, setActiveHeroIdx] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TechNewsItem | null>(null);

  // Yeni / Düzenlenen Haber Formu
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(TECH_NEWS_CATEGORIES[0].name);
  const [badgeColor, setBadgeColor] = useState(TECH_NEWS_CATEGORIES[0].color);
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
    setBadgeColor(TECH_NEWS_CATEGORIES[0].color);
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
    setBadgeColor(
      item.badgeColor ||
        TECH_NEWS_CATEGORIES.find((c) => c.name === item.category)?.color ||
        '#10b981'
    );
    setSummary(item.summary);
    setContent(item.content);
    setSource(item.source);
    setReadTime(item.readTime);
    setImageUrl(item.imageUrl || '');
    setIsFeatured(Number(item.isFeatured) === 1);
    setError('');
    setModalOpen(true);
  };

  const filteredNews = initialNews
    .filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (Number(b.views) || 0) - (Number(a.views) || 0);
      }
      if (sortBy === 'discussed') {
        return (Number(b.commentCount) || 0) - (Number(a.commentCount) || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const featuredNews = filteredNews.filter((n) => Number(n.isFeatured) === 1);
  const regularNews = filteredNews.filter((n) => Number(n.isFeatured) !== 1);
  const topTrendingNews = [...initialNews]
    .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
    .slice(0, 4);

  const categoryCounts = initialNews.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const totalViews = initialNews.reduce((sum, n) => sum + (Number(n.views) || 0), 0);
  const totalComments = initialNews.reduce(
    (sum, n) => sum + (Number(n.commentCount) || 0),
    0
  );
  const activeHeroItem =
    featuredNews[activeHeroIdx] || featuredNews[0] || filteredNews[0] || null;
  const sideFeaturedItems = featuredNews.filter(
    (item) => !activeHeroItem || item.id !== activeHeroItem.id
  );

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
          badgeColor,
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

      {/* Canlı Son Dakika & Radar Şeridi */}
      {initialNews.length > 0 && (
        <div className="rounded-md border border-[#232730] bg-[#15181E] px-3 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar font-mono">
          <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-[#F59E0B] text-[#0D0F12]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D0F12]" />
            RADAR // LIVE
          </span>
          <div className="flex items-center gap-4 text-xs text-[#8B949E] shrink-0">
            {initialNews.slice(0, 4).map((n) => (
              <Link
                key={n.id}
                href={`/haberler/${n.slug}`}
                className="inline-flex items-center gap-2 hover:text-[#10B981] transition-colors group"
              >
                <span
                  className="w-1.5 h-1.5 rounded-xs shrink-0"
                  style={{ backgroundColor: n.badgeColor }}
                />
                <span className="font-sans font-medium text-[#E6EDF3] group-hover:text-[#10B981] truncate max-w-[230px] sm:max-w-[300px]">
                  {n.title}
                </span>
                <span className="text-[10px] text-[#232730]">/</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Keskin Hatlı Teknoloji Gündemi Başlığı */}
      <div className="rounded-md bg-[#15181E] p-5 sm:p-6 text-[#E6EDF3] border border-[#232730]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-2xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 font-mono">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40">
                <Sparkles className="w-3 h-3" />
                TECH.RADAR // BİLİM &amp; MÜHENDİSLİK DOSYALARI
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-[#0D0F12] text-[#E6EDF3] border border-[#232730]">
                <Layers className="w-3 h-3 text-[#10B981]" />
                {initialNews.length} Dosya
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-[#0D0F12] text-[#E6EDF3] border border-[#232730]">
                <TrendingUp className="w-3 h-3 text-[#F59E0B]" />
                {totalViews.toLocaleString('tr-TR')} Okunma
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-[#0D0F12] text-[#E6EDF3] border border-[#232730]">
                <MessageSquare className="w-3 h-3 text-[#10B981]" />
                {totalComments} Yorum
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#E6EDF3]">
              Teknoloji Gündemi &amp; İnovasyon Radarı
            </h1>
            <p className="text-xs sm:text-[13px] text-[#8B949E] leading-relaxed">
              Otonom yapay zeka ajanları, siber güvenlikte sıfır-gün savunması, BÖTE &amp; eğitim teknolojilerinde XR laboratuvarlar, 2nm yarı iletkenler ve modern yazılım mimarilerindeki en son kırılmaları derinlemesine inceleyin.
            </p>
          </div>

          {isAdmin && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Teknolojik Gelişme Ekle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Kategori Filtreleri, Sıralama ve Arama Çubuğu */}
      <div className="space-y-3 bg-white/95 dark:bg-slate-900/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('');
              setActiveHeroIdx(0);
            }}
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
            const count = categoryCounts[cat.name] || 0;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => {
                  setSelectedCategory(active ? '' : cat.name);
                  setActiveHeroIdx(0);
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/30'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span style={{ color: active ? '#ffffff' : cat.color }}>
                  {getCategoryIcon(cat.name, 'w-3.5 h-3.5')}
                </span>
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Sırala:
            </span>
            {(
              [
                { id: 'newest', label: 'En Yeni' },
                { id: 'popular', label: 'En Çok Okunan' },
                { id: 'discussed', label: 'En Çok Tartışılan' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSortBy(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  sortBy === opt.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Başlık, kategori veya kaynak ara..."
              className="w-full pl-9 pr-7 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bento-Grid Sinematik Manşet Vitrini */}
      {featuredNews.length > 0 && activeHeroItem && (
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              Editörün Seçimi & Manşet Dosyaları
            </h2>

            {featuredNews.length > 1 && (
              <div className="flex items-center gap-1.5">
                {featuredNews.map((fn, idx) => (
                  <button
                    key={fn.id}
                    type="button"
                    onClick={() => setActiveHeroIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      activeHeroItem.id === fn.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    0{idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Sol Büyük Vitrin (Ana Manşet) */}
            <div
              className={`${
                sideFeaturedItems.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'
              } group relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/90 bg-slate-950 shadow-xl hover:shadow-2xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-end min-h-[390px] sm:min-h-[450px]`}
            >
              <TechNewsCover
                title={activeHeroItem.title}
                category={activeHeroItem.category}
                badgeColor={activeHeroItem.badgeColor}
                imageUrl={activeHeroItem.imageUrl}
                slug={activeHeroItem.slug}
                className="absolute inset-0 w-full h-full"
                overlayVariant="hero"
              />

              {/* Üst Yüzen Rozetler ve Yönetici Butonları */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm border"
                    style={{
                      backgroundColor: 'rgba(9, 13, 22, 0.80)',
                      borderColor: `${activeHeroItem.badgeColor}75`,
                      color: activeHeroItem.badgeColor,
                    }}
                  >
                    {getCategoryIcon(activeHeroItem.category, 'w-3.5 h-3.5')}
                    {activeHeroItem.category}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-sm">
                    <Flame className="w-3 h-3 fill-slate-950" />
                    BAŞ MANŞET
                  </span>
                </div>

                {canModerate && (
                  <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-white/15">
                    <button
                      type="button"
                      onClick={() => openEditModal(activeHeroItem)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 transition-colors cursor-pointer"
                      title="Haberi Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Düzenle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(activeHeroItem.id, activeHeroItem.title)
                      }
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
              <div className="relative z-10 p-6 sm:p-8 pt-28 flex flex-col justify-end bg-gradient-to-t from-[#060911] via-[#060911]/92 to-transparent">
                <div className="flex items-center gap-2 text-xs text-slate-300/90 mb-2">
                  <span className="font-bold text-emerald-300">
                    {activeHeroItem.source}
                  </span>
                  <span>•</span>
                  <span>{formatRelativeTime(activeHeroItem.createdAt)}</span>
                </div>

                <Link href={`/haberler/${activeHeroItem.slug}`}>
                  <h3 className="text-xl sm:text-3xl font-extrabold text-white group-hover:text-emerald-300 transition-colors leading-tight">
                    {activeHeroItem.title}
                  </h3>
                </Link>

                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                  {activeHeroItem.summary}
                </p>

                <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {activeHeroItem.readTime}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      {activeHeroItem.views} okunma
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      {activeHeroItem.commentCount || 0} yorum
                    </span>
                  </div>

                  <Link
                    href={`/haberler/${activeHeroItem.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md transition-all"
                  >
                    Dosyayı İncele <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Sağ Sütun: Diğer Manşet Kartları */}
            {sideFeaturedItems.length > 0 && (
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                {sideFeaturedItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex-1 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/90 bg-slate-950 shadow-md hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-end min-h-[140px]"
                  >
                    <TechNewsCover
                      title={item.title}
                      category={item.category}
                      badgeColor={item.badgeColor}
                      imageUrl={item.imageUrl}
                      slug={item.slug}
                      className="absolute inset-0 w-full h-full"
                      overlayVariant="hero"
                    />

                    <div className="relative z-10 p-4 sm:p-5 bg-gradient-to-t from-[#060911] via-[#060911]/85 to-slate-950/30 flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border"
                          style={{
                            backgroundColor: 'rgba(9, 13, 22, 0.80)',
                            borderColor: `${item.badgeColor}65`,
                            color: item.badgeColor,
                          }}
                        >
                          {getCategoryIcon(item.category, 'w-3 h-3')}
                          {item.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-300 bg-slate-950/70 px-2 py-0.5 rounded-md border border-white/10">
                            {item.readTime}
                          </span>
                          {canModerate && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-1 rounded-lg bg-slate-950/80 text-indigo-300 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                                title="Haberi Düzenle"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id, item.title)}
                                className="p-1 rounded-lg bg-slate-950/80 text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
                                title="Haberi Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <Link href={`/haberler/${item.slug}`}>
                          <h4 className="text-sm sm:text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2">
                            {item.title}
                          </h4>
                        </Link>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300/90">
                          <span className="text-emerald-300 font-semibold truncate">
                            {item.source}
                          </span>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="inline-flex items-center gap-1">
                              <Eye className="w-3 h-3 text-slate-400" />
                              {item.views}
                            </span>
                            <Link
                              href={`/haberler/${item.slug}`}
                              className="inline-flex items-center gap-0.5 font-bold text-white group-hover:text-emerald-300"
                            >
                              Oku <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* En Çok Okunanlar / Trend Radar Barı */}
      {!selectedCategory && !searchQuery && topTrendingNews.length >= 4 && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/80 p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Haftanın En Çok Okunan Teknoloji Dosyaları
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              Okunma Sıralaması
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {topTrendingNews.map((item, idx) => (
              <Link
                key={item.id}
                href={`/haberler/${item.slug}`}
                className="group relative rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3.5 hover:border-indigo-500/40 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-start gap-3"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border"
                  style={{
                    backgroundColor: `${item.badgeColor}15`,
                    borderColor: `${item.badgeColor}40`,
                    color: item.badgeColor,
                  }}
                >
                  0{idx + 1}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider block truncate"
                    style={{ color: item.badgeColor }}
                  >
                    {item.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="inline-flex items-center gap-0.5">
                      <Eye className="w-3 h-3" /> {item.views}
                    </span>
                    <span>•</span>
                    <span>{item.readTime}</span>
                  </div>
                </div>
              </Link>
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
                className="group rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 hover:border-indigo-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative"
              >
                {/* Kategori Rengi Üst Vurgu Şeridi */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: item.badgeColor }}
                />
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
                    onChange={(e) => {
                      const nextCat = e.target.value;
                      setCategory(nextCat);
                      const found = TECH_NEWS_CATEGORIES.find(
                        (c) => c.name === nextCat
                      );
                      if (found) setBadgeColor(found.color);
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
                badgeColor={badgeColor}
                onBadgeColorChange={setBadgeColor}
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

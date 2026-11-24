'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
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

const COMPACT_CATEGORY_LABELS: Record<string, string> = {
  'Yapay Zeka': 'Yapay Zeka',
  'Siber Güvenlik': 'Siber Güvenlik',
  'Web & Yazılım': 'Web & Yazılım',
  'Donanım & Çip': 'Donanım & Çip',
  'Mobil & Bulut': 'Mobil & Bulut',
  'Veri Bilimi & Ağ': 'Veri & Ağ',
  'Oyun & Simülasyon': 'Oyun & Sim.',
  'Eğitim Teknolojileri': 'Eğitim Tek.',
  'BÖTE & Akademi': 'BÖTE & Akademi',
  'Robotik & Otomasyon': 'Robotik',
  'Uzay & Bilim': 'Uzay & Bilim',
};

export function TechNewsClient({ initialNews, currentUser }: TechNewsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'discussed'>('newest');
  const [activeHeroIdx, setActiveHeroIdx] = useState<number>(0);
  const [radarIdx, setRadarIdx] = useState<number>(0);
  const [radarPaused, setRadarPaused] = useState<boolean>(false);
  const [showAllCatsGrid, setShowAllCatsGrid] = useState<boolean>(false);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TechNewsItem | null>(null);

  const catScrollRef = useRef<HTMLDivElement>(null);

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

  const radarItems = initialNews.slice(0, Math.min(6, initialNews.length));

  // Canlı Radar otomatik geçişi (üzerine gelindiğinde duraklar)
  useEffect(() => {
    if (radarItems.length <= 1 || radarPaused) return;
    const timer = window.setInterval(() => {
      setRadarIdx((prev) => (prev + 1) % radarItems.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [radarItems.length, radarPaused]);

  const updateCatScrollButtons = useCallback(() => {
    const el = catScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    updateCatScrollButtons();
    window.addEventListener('resize', updateCatScrollButtons);
    return () => window.removeEventListener('resize', updateCatScrollButtons);
  }, [updateCatScrollButtons]);

  const scrollCategories = (dir: 'left' | 'right') => {
    const el = catScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === 'left' ? -240 : 240,
      behavior: 'smooth',
    });
  };

  const handleCatWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = catScrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      updateCatScrollButtons();
    }
  };

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
  const currentRadarItem = radarItems[radarIdx] || radarItems[0] || null;

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
    <div className="space-y-5">
      {/* Üst Geri Dönüş */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#8B949E] hover:text-[#10B981] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Forum Akışına Dön
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#8B949E]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#15181E] text-[#10B981] border border-[#232730] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            SYS:RADAR // AKTİF AKIŞ
          </span>
        </div>
      </div>

      {/* Canlı Radar Şeridi: Taşmayan, Tek Satır İnteraktif Haber Geçiş Barı */}
      {currentRadarItem && (
        <div
          onMouseEnter={() => setRadarPaused(true)}
          onMouseLeave={() => setRadarPaused(false)}
          className="rounded-md border border-[#232730] bg-[#15181E] px-3 py-2 flex items-center justify-between gap-2.5"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider bg-[#F59E0B] text-[#0D0F12]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D0F12] animate-pulse" />
              RADAR
            </span>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory(
                  selectedCategory === currentRadarItem.category
                    ? ''
                    : currentRadarItem.category
                );
                setActiveHeroIdx(0);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-[10px] font-semibold bg-[#0D0F12] border border-[#232730] hover:border-[#10B981]/50 shrink-0 cursor-pointer transition-colors"
              style={{ color: currentRadarItem.badgeColor }}
              title={`${currentRadarItem.category} kategorisini filtrele`}
            >
              <span
                className="w-1.5 h-1.5 rounded-xs shrink-0"
                style={{ backgroundColor: currentRadarItem.badgeColor }}
              />
              {COMPACT_CATEGORY_LABELS[currentRadarItem.category] ||
                currentRadarItem.category}
            </button>

            <Link
              href={`/haberler/${currentRadarItem.slug}`}
              className="min-w-0 flex-1 flex items-center gap-2 group"
            >
              <span className="text-xs sm:text-[13px] font-semibold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors truncate">
                {currentRadarItem.title}
              </span>
              <span className="hidden md:inline-block shrink-0 font-mono text-[11px] text-[#8B949E]">
                • {currentRadarItem.readTime}
              </span>
            </Link>
          </div>

          {/* Sağ: Kompakt Sayaç ve Önceki / Sonraki Kontrol Okları */}
          {radarItems.length > 1 && (
            <div className="flex items-center gap-1 shrink-0 font-mono pl-2 border-l border-[#232730]">
              <span className="hidden sm:inline text-[10px] text-[#8B949E] mr-1 tabular-nums">
                0{radarIdx + 1}/0{radarItems.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setRadarIdx((prev) =>
                    prev <= 0 ? radarItems.length - 1 : prev - 1
                  )
                }
                className="p-1 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#10B981]/50 transition-colors cursor-pointer"
                title="Önceki Gündem Başlığı"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setRadarIdx((prev) => (prev + 1) % radarItems.length)
                }
                className="p-1 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#10B981]/50 transition-colors cursor-pointer"
                title="Sonraki Gündem Başlığı"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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

      {/* Kategori Filtreleri, Kaydırma Okları, Sıralama ve Arama Çubuğu */}
      <div className="rounded-md bg-[#15181E] p-3 sm:p-3.5 border border-[#232730] space-y-3">
        {/* Üst Satır: Sol/Sağ Oklarla Kaydırılabilir Kompakt Kategori Şeridi + Tüm Alanlar Butonu */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            disabled={!canScrollLeft}
            title="Sola Kaydır"
            className="hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#0D0F12] border border-[#232730] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#10B981]/50 disabled:opacity-25 disabled:pointer-events-none shrink-0 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={catScrollRef}
            onScroll={updateCatScrollButtons}
            onWheel={handleCatWheel}
            className={`flex-1 min-w-0 flex items-center gap-1.5 ${
              showAllCatsGrid
                ? 'flex-wrap'
                : 'overflow-x-auto no-scrollbar scroll-smooth'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('');
                setActiveHeroIdx(0);
              }}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                selectedCategory === ''
                  ? 'bg-[#10B981] text-[#0D0F12] border-[#10B981]'
                  : 'bg-[#0D0F12] border-[#232730] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#343B48]'
              }`}
            >
              <span>Tümü</span>
              <span
                className={`text-[10px] px-1 rounded-xs tabular-nums ${
                  selectedCategory === ''
                    ? 'bg-[#0D0F12]/20 text-[#0D0F12]'
                    : 'text-[#8B949E]'
                }`}
              >
                {initialNews.length}
              </span>
            </button>

            {TECH_NEWS_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.name;
              const count = categoryCounts[cat.name] || 0;
              const shortLabel = COMPACT_CATEGORY_LABELS[cat.name] || cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  title={cat.name}
                  onClick={() => {
                    setSelectedCategory(active ? '' : cat.name);
                    setActiveHeroIdx(0);
                  }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]'
                      : 'bg-[#0D0F12] border-[#232730] text-[#E6EDF3]/90 hover:border-[#10B981]/45 hover:text-[#10B981]'
                  }`}
                >
                  <span style={{ color: active ? '#10B981' : cat.color }}>
                    {getCategoryIcon(cat.name, 'w-3.5 h-3.5')}
                  </span>
                  <span className="whitespace-nowrap">
                    {showAllCatsGrid ? cat.name : shortLabel}
                  </span>
                  {count > 0 && (
                    <span
                      className={`font-mono text-[10px] px-1 py-0.2 rounded-sm font-semibold tabular-nums ${
                        active
                          ? 'bg-[#10B981] text-[#0D0F12]'
                          : 'bg-[#15181E] text-[#8B949E] border border-[#232730]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!showAllCatsGrid && (
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              disabled={!canScrollRight}
              title="Sağa Kaydır"
              className="hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#0D0F12] border border-[#232730] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#10B981]/50 disabled:opacity-25 disabled:pointer-events-none shrink-0 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAllCatsGrid((v) => !v)}
            title={showAllCatsGrid ? 'Tek Satır Ray Görünümü' : 'Tüm Kategorileri Aç'}
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
              showAllCatsGrid
                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/50 text-[#F59E0B]'
                : 'bg-[#0D0F12] border-[#232730] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#343B48]'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden md:inline">
              {showAllCatsGrid ? 'Daralt' : 'Tümü'}
            </span>
          </button>
        </div>

        {/* Alt Satır: Sıralama Sekmeleri ve Hızlı Arama */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-[#232730]">
          <div className="flex items-center gap-1.5 flex-wrap font-mono">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B949E] mr-1">
              SIRALA:
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
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                  sortBy === opt.id
                    ? 'bg-[#0D0F12] border-[#10B981] text-[#10B981]'
                    : 'bg-[#0D0F12] border-[#232730] text-[#8B949E] hover:text-[#E6EDF3]'
                }`}
              >
                {opt.label}
              </button>
            ))}

            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/25 cursor-pointer"
              >
                <span>{selectedCategory}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 text-[#8B949E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Başlık, kategori veya kaynak ara..."
              className="w-full pl-8 pr-7 py-1.5 rounded-md text-xs font-mono bg-[#0D0F12] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#E6EDF3]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manşet Vitrini */}
      {featuredNews.length > 0 && activeHeroItem && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 font-mono">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#E6EDF3] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
              EDİTÖRÜN SEÇİMİ &amp; MANŞET DOSYALARI
            </h2>

            {featuredNews.length > 1 && (
              <div className="flex items-center gap-1">
                {featuredNews.map((fn, idx) => (
                  <button
                    key={fn.id}
                    type="button"
                    onClick={() => setActiveHeroIdx(idx)}
                    className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold border transition-colors cursor-pointer ${
                      activeHeroItem.id === fn.id
                        ? 'bg-[#10B981] border-[#10B981] text-[#0D0F12]'
                        : 'bg-[#15181E] border-[#232730] text-[#8B949E] hover:text-[#E6EDF3]'
                    }`}
                  >
                    0{idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Sol Büyük Vitrin (Ana Manşet) */}
            <div
              className={`${
                sideFeaturedItems.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'
              } group relative rounded-md overflow-hidden border border-[#232730] bg-[#15181E] hover:border-[#10B981]/60 transition-colors flex flex-col justify-end min-h-[360px] sm:min-h-[420px]`}
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

              {/* Üst Rozetler ve Yönetici Butonları */}
              <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2 font-mono">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[11px] font-semibold bg-[#0D0F12]/90 border border-[#232730]"
                    style={{ color: activeHeroItem.badgeColor }}
                  >
                    {getCategoryIcon(activeHeroItem.category, 'w-3 h-3')}
                    {activeHeroItem.category}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#F59E0B] text-[#0D0F12]">
                    <Flame className="w-3 h-3 fill-[#0D0F12]" />
                    BAŞ MANŞET
                  </span>
                </div>

                {canModerate && (
                  <div className="flex items-center gap-1 bg-[#0D0F12]/90 p-1 rounded-md border border-[#232730]">
                    <button
                      type="button"
                      onClick={() => openEditModal(activeHeroItem)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-medium text-[#10B981] hover:bg-[#15181E] transition-colors cursor-pointer"
                      title="Haberi Düzenle"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Düzenle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(activeHeroItem.id, activeHeroItem.title)
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-medium text-rose-400 hover:bg-[#15181E] transition-colors cursor-pointer"
                      title="Haberi Sil"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Sil</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Alt İçerik Katmanı */}
              <div className="relative z-10 p-5 sm:p-6 bg-[#0D0F12]/92 border-t border-[#232730] flex flex-col justify-end">
                <div className="flex items-center gap-2 text-xs font-mono text-[#8B949E] mb-1.5">
                  <span className="font-semibold text-[#10B981]">
                    {activeHeroItem.source}
                  </span>
                  <span>•</span>
                  <span>{formatRelativeTime(activeHeroItem.createdAt)}</span>
                </div>

                <Link href={`/haberler/${activeHeroItem.slug}`}>
                  <h3 className="text-lg sm:text-2xl font-bold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors leading-snug">
                    {activeHeroItem.title}
                  </h3>
                </Link>

                <p className="mt-2 text-xs sm:text-sm text-[#8B949E] leading-relaxed line-clamp-2">
                  {activeHeroItem.summary}
                </p>

                <div className="mt-4 pt-3 border-t border-[#232730] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#8B949E]">
                  <div className="flex items-center gap-3.5">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                      {activeHeroItem.readTime}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#F59E0B]" />
                      {activeHeroItem.views} okunma
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" />
                      {activeHeroItem.commentCount || 0} yorum
                    </span>
                  </div>

                  <Link
                    href={`/haberler/${activeHeroItem.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-sans font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] transition-colors"
                  >
                    Dosyayı İncele <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Sağ Sütun: Diğer Manşet Kartları */}
            {sideFeaturedItems.length > 0 && (
              <div className="lg:col-span-5 flex flex-col justify-between gap-3">
                {sideFeaturedItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex-1 rounded-md overflow-hidden border border-[#232730] bg-[#15181E] hover:border-[#10B981]/60 transition-colors flex flex-col justify-end min-h-[132px]"
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

                    <div className="relative z-10 p-4 bg-[#0D0F12]/88 flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between gap-2 font-mono">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-[#15181E] border border-[#232730]"
                          style={{ color: item.badgeColor }}
                        >
                          {getCategoryIcon(item.category, 'w-3 h-3')}
                          {item.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium text-[#8B949E] bg-[#15181E] px-1.5 py-0.5 rounded-sm border border-[#232730]">
                            {item.readTime}
                          </span>
                          {canModerate && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-1 rounded-sm bg-[#15181E] border border-[#232730] text-[#10B981] hover:bg-[#0D0F12] transition-colors cursor-pointer"
                                title="Haberi Düzenle"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id, item.title)}
                                className="p-1 rounded-sm bg-[#15181E] border border-[#232730] text-rose-400 hover:bg-[#0D0F12] transition-colors cursor-pointer"
                                title="Haberi Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5">
                        <Link href={`/haberler/${item.slug}`}>
                          <h4 className="text-sm font-bold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors leading-snug line-clamp-2">
                            {item.title}
                          </h4>
                        </Link>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-[#8B949E]">
                          <span className="text-[#10B981] font-medium truncate">
                            {item.source}
                          </span>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="inline-flex items-center gap-1">
                              <Eye className="w-3 h-3 text-[#8B949E]" />
                              {item.views}
                            </span>
                            <Link
                              href={`/haberler/${item.slug}`}
                              className="inline-flex items-center gap-0.5 font-semibold text-[#E6EDF3] group-hover:text-[#10B981]"
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
        <div className="rounded-md border border-[#232730] bg-[#15181E] p-4 space-y-3">
          <div className="flex items-center justify-between font-mono">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#E6EDF3] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
              HAFTANIN EN ÇOK OKUNAN DOSYALARI
            </h2>
            <span className="text-[10px] text-[#8B949E]">
              POPULAR // TOP 04
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topTrendingNews.map((item, idx) => (
              <Link
                key={item.id}
                href={`/haberler/${item.slug}`}
                className="group relative rounded-md border border-[#232730] bg-[#0D0F12] p-3 hover:border-[#10B981]/50 transition-colors flex items-start gap-2.5"
              >
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-[#232730] bg-[#15181E]"
                  style={{ color: item.badgeColor }}
                >
                  0{idx + 1}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span
                    className="text-[10px] font-mono font-semibold uppercase tracking-wider block truncate"
                    style={{ color: item.badgeColor }}
                  >
                    {item.category}
                  </span>
                  <h4 className="text-xs font-bold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#8B949E]">
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

      {/* Tüm Teknolojik Gelişmeler Izgarası */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5 px-0.5">
          <Newspaper className="w-3.5 h-3.5 text-[#10B981]" />
          SON TEKNOLOJİK GELİŞMELER
        </h2>

        {filteredNews.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#232730] bg-[#15181E] p-10 text-center space-y-2">
            <Newspaper className="w-8 h-8 text-[#8B949E] mx-auto" />
            <p className="text-sm font-bold text-[#E6EDF3]">
              Bu filtreye uygun teknolojik gelişme bulunamadı.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(regularNews.length > 0 ? regularNews : filteredNews).map((item) => (
              <div
                key={item.id}
                className="group rounded-md overflow-hidden border border-[#232730] bg-[#15181E] hover:border-[#10B981]/55 transition-colors flex flex-col justify-between relative"
              >
                <div
                  className="h-[2px] w-full"
                  style={{ backgroundColor: item.badgeColor }}
                />
                <div>
                  <div className="relative h-44 w-full overflow-hidden border-b border-[#232730]">
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

                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] font-semibold bg-[#0D0F12]/90 border border-[#232730]"
                        style={{ color: item.badgeColor }}
                      >
                        {getCategoryIcon(item.category, 'w-3 h-3')}
                        {item.category}
                      </span>
                    </div>

                    {canModerate && (
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-[#0D0F12]/90 p-1 rounded-md border border-[#232730]">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1 rounded-sm text-[#10B981] hover:bg-[#15181E] transition-colors cursor-pointer"
                          title="Haberi Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-1 rounded-sm text-rose-400 hover:bg-[#15181E] transition-colors cursor-pointer"
                          title="Haberi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="absolute bottom-2.5 right-2.5 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] font-medium bg-[#0D0F12]/90 text-[#E6EDF3] border border-[#232730]">
                        <Clock className="w-3 h-3 text-[#10B981]" />
                        {item.readTime}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 pb-3">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#8B949E] mb-1.5">
                      <span className="font-semibold text-[#10B981] truncate">
                        {item.source}
                      </span>
                      <span className="shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <Link href={`/haberler/${item.slug}`}>
                      <h3 className="text-sm sm:text-base font-bold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                    </Link>

                    <p className="mt-1.5 text-xs text-[#8B949E] leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2.5 border-t border-[#232730] flex items-center justify-between text-xs font-mono text-[#8B949E] bg-[#0D0F12]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {item.views}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />{' '}
                      {item.commentCount || 0}
                    </span>
                  </div>

                  <Link
                    href={`/haberler/${item.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-[#10B981] hover:underline"
                  >
                    Oku &amp; Tartış <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yeni / Düzenlenen Teknolojik Gelişme Modalı */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-md border border-[#232730] bg-[#15181E] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-[#E6EDF3] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#10B981]" />
                {editingItem
                  ? 'Teknolojik Gelişmeyi Düzenle'
                  : 'Yeni Teknolojik Gelişme Paylaş'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateNews} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-[#E6EDF3] mb-1">
                  Gelişme / Haber Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Açık Kaynaklı Yeni Nesil Kodlama Modeli Duyuruldu"
                  className="w-full px-3 py-2 rounded-md text-sm bg-[#0D0F12] border border-[#232730] text-[#E6EDF3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#E6EDF3] mb-1">
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
                    className="w-full px-3 py-2 rounded-md text-sm bg-[#0D0F12] border border-[#232730] text-[#E6EDF3]"
                  >
                    {TECH_NEWS_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#E6EDF3] mb-1">
                    Kaynak Belirtin
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Örn: IEEE Spectrum / ArXiv"
                    className="w-full px-3 py-2 rounded-md text-sm bg-[#0D0F12] border border-[#232730] text-[#E6EDF3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#E6EDF3] mb-1">
                    Okuma Süresi
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="3 dk okuma"
                    className="w-full px-3 py-2 rounded-md text-sm bg-[#0D0F12] border border-[#232730] text-[#E6EDF3]"
                  />
                </div>
              </div>

              <TechNewsCoverPicker
                imageUrl={imageUrl}
                category={category}
                onChange={setImageUrl}
                badgeColor={badgeColor}
                onBadgeColorChange={setBadgeColor}
              />

              <div>
                <label className="block text-xs font-mono font-semibold text-[#E6EDF3] mb-1">
                  Kısa Özet (Kartlarda görünür)
                </label>
                <textarea
                  rows={2}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Gelişmeyi 1-2 cümleyle özetleyin..."
                  className="w-full px-3 py-2 rounded-md text-sm bg-[#0D0F12] border border-[#232730] text-[#E6EDF3]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#E6EDF3] mb-1">
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
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#E6EDF3] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded-sm border-[#232730] bg-[#0D0F12] text-[#10B981] focus:ring-[#10B981]"
                  />
                  Bu gelişmeyi Manşet (Öne Çıkan) olarak işaretle
                </label>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded-md text-xs font-semibold text-[#8B949E] hover:text-[#E6EDF3] bg-[#0D0F12] border border-[#232730]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] disabled:opacity-50 cursor-pointer"
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

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Flame,
  Clock,
  Eye,
  PlusCircle,
  CheckCircle2,
  Bookmark,
  Tag,
  Users,
  MessageSquare,
  Award,
  Layers,
  X,
  Sparkles,
  Newspaper,
  ArrowRight,
  HelpCircle,
  LayoutGrid,
  List,
  Activity,
  Search,
  Zap,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { ThreadCard, type ThreadCardData } from './ThreadCard';
import { CategoryIcon } from './CategoryIcon';
import TechNewsCover from './TechNewsCover';
import { UserAvatar } from './UserAvatar';
import { matchesSearch, normalizeSearchText } from '@/lib/utils';
import type { TechNewsItem } from '@/lib/techNews';

export interface HomeCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  _count: {
    threads: number;
  };
}

export interface HomeThreadItem extends ThreadCardData {
  isBookmarked: boolean;
}

export interface HomeTopUser {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  role: string;
  reputation: number;
}

interface HomeFeedClientProps {
  categories: HomeCategoryItem[];
  threads: HomeThreadItem[];
  topUsers: HomeTopUser[];
  techNews: TechNewsItem[];
  stats: {
    totalThreads: number;
    totalComments: number;
    totalUsers: number;
  };
  isLoggedIn: boolean;
  canModerate?: boolean;
  initialCategory: string;
  initialTag: string;
  initialSort: string;
  initialFilter: string;
  initialSearch: string;
}

const PAGE_SIZE = 12;

export function HomeFeedClient({
  categories,
  threads: initialThreads,
  topUsers,
  techNews,
  stats,
  isLoggedIn,
  canModerate = false,
  initialCategory,
  initialTag,
  initialSort,
  initialFilter,
  initialSearch,
}: HomeFeedClientProps) {
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<HomeThreadItem[]>(initialThreads);

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  const handleThreadDeleted = (deletedId: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== deletedId));
  };

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [sortBy, setSortBy] = useState(initialSort || 'aktivite');
  const [filterBy, setFilterBy] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');

  // Navbar üzerinden arama veya filtre bağlantısına tıklandığında senkronize et
  useEffect(() => {
    const q = searchParams.get('q')?.trim() || '';
    const kat = searchParams.get('kategori') || '';
    const etk = searchParams.get('etiket') || '';
    const flt = searchParams.get('filtre') || '';
    const srl = searchParams.get('sirala') || 'aktivite';

    setSearchQuery(q);
    setActiveCategory(kat);
    setActiveTag(etk);
    setFilterBy(flt);
    setSortBy(srl);
    setCurrentPage(1);
  }, [searchParams]);

  // Navbar arama kutusundan gelen canlı arama (real-time search) olaylarını dinle
  useEffect(() => {
    const handleLiveSearch = (e: Event) => {
      const custom = e as CustomEvent<{
        q?: string;
        kategori?: string;
        etiket?: string;
      }>;
      if (custom.detail.q !== undefined) {
        setSearchQuery(custom.detail.q);
      }
      if (custom.detail.kategori !== undefined) {
        setActiveCategory(custom.detail.kategori);
      }
      if (custom.detail.etiket !== undefined) {
        setActiveTag(custom.detail.etiket);
      }
      setCurrentPage(1);
    };
    window.addEventListener('novaforum:search', handleLiveSearch);
    return () =>
      window.removeEventListener('novaforum:search', handleLiveSearch);
  }, []);

  const syncUrl = (next: {
    kategori?: string;
    etiket?: string;
    filtre?: string;
    sirala?: string;
    q?: string;
  }) => {
    const params = new URLSearchParams();
    const kat = next.kategori !== undefined ? next.kategori : activeCategory;
    const etk = next.etiket !== undefined ? next.etiket : activeTag;
    const flt = next.filtre !== undefined ? next.filtre : filterBy;
    const srl = next.sirala !== undefined ? next.sirala : sortBy;
    const q = next.q !== undefined ? next.q : searchQuery;

    if (kat) params.set('kategori', kat);
    if (etk) params.set('etiket', etk);
    if (flt) params.set('filtre', flt);
    if (q) params.set('q', q);
    if (srl && srl !== 'aktivite') params.set('sirala', srl);

    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `/?${qs}` : '/');
  };

  const selectCategory = (slug: string) => {
    const nextCat = activeCategory === slug ? '' : slug;
    setActiveCategory(nextCat);
    setCurrentPage(1);
    syncUrl({ kategori: nextCat });
  };

  const selectFilter = (flt: string) => {
    const nextFilter = filterBy === flt ? '' : flt;
    setFilterBy(nextFilter);
    if (flt === '') {
      setActiveCategory('');
      setActiveTag('');
      setSearchQuery('');
      window.dispatchEvent(new CustomEvent('novaforum:clear-search'));
      syncUrl({ kategori: '', etiket: '', filtre: '', q: '' });
    } else {
      syncUrl({ filtre: nextFilter });
    }
    setCurrentPage(1);
  };

  const selectTag = (tag: string) => {
    const nextTag = activeTag === tag ? '' : tag;
    setActiveTag(nextTag);
    setCurrentPage(1);
    syncUrl({ etiket: nextTag });
  };

  const selectSort = (srl: string) => {
    setSortBy(srl);
    setCurrentPage(1);
    syncUrl({ sirala: srl });
  };

  const clearAllFilters = () => {
    setActiveCategory('');
    setActiveTag('');
    setFilterBy('');
    setSearchQuery('');
    setCurrentPage(1);
    window.dispatchEvent(new CustomEvent('novaforum:clear-search'));
    window.history.replaceState(null, '', '/');
  };

  const solvedCount = useMemo(
    () => threads.filter((t) => t.isSolved).length,
    [threads]
  );
  const unansweredCount = useMemo(
    () => threads.filter((t) => t.commentCount === 0).length,
    [threads]
  );

  // Anlık (0ms) Türkçe karakter duyarlı istemci tarafı filtreleme ve sıralama
  const filteredAndSortedThreads = useMemo(() => {
    const normTag = normalizeSearchText(activeTag);
    const hasQuery = searchQuery.trim().length > 0;

    return threads
      .filter((t) => {
        if (activeCategory && t.category.slug !== activeCategory) return false;
        if (normTag && !normalizeSearchText(t.tags).includes(normTag))
          return false;
        if (filterBy === 'cozuldu' && !t.isSolved) return false;
        if (filterBy === 'cevapsiz' && t.commentCount > 0) return false;
        if (filterBy === 'kaydedilenler' && !t.isBookmarked) return false;
        if (hasQuery) {
          const combinedText = `${t.title} ${t.tags} ${t.category.name} ${t.author.displayName} ${t.author.username} ${t.content}`;
          if (!matchesSearch(combinedText, searchQuery)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (sortBy === 'populer') return b.score - a.score;
        if (sortBy === 'goruntulenme') return b.views - a.views;
        if (sortBy === 'yeni') {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        // Varsayılan: Güncel Aktivite (son yanıt veya oluşturulma tarihi)
        const aTime = new Date(a.updatedAt || a.createdAt).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt).getTime();
        return bTime - aTime;
      });
  }, [threads, activeCategory, activeTag, filterBy, searchQuery, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedThreads.length / PAGE_SIZE)
  );
  const paginatedThreads = useMemo(
    () =>
      filteredAndSortedThreads.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [filteredAndSortedThreads, currentPage]
  );

  // Popüler etiketler
  const popularTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    threads.forEach((t) => {
      if (!t.tags) return;
      t.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [threads]);

  const selectedCategoryObj = categories.find((c) => c.slug === activeCategory);
  const solveRate =
    stats.totalThreads > 0
      ? Math.round((solvedCount / stats.totalThreads) * 100)
      : 0;
  const leadNews = techNews[0] || null;

  return (
    <div className="space-y-6">
      {/* İLK GİRİŞ: LINEAR & GITHUB DISCUSSIONS KOMUTA MERKEZİ & YÜKSEK YOĞUNLUKLU KARŞILAMA */}
      {!selectedCategoryObj && !filterBy && !activeTag && (
        <section className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* Sol Ana Komuta Paneli (7 Sütun) */}
            <div className="lg:col-span-7 relative rounded-md overflow-hidden border border-[#232730] bg-[#15181E] p-5 sm:p-6 text-[#E6EDF3] flex flex-col justify-between">
              <div className="relative z-10 space-y-3.5">
                {/* Üst Canlı Sistem Durum Rozetleri */}
                <div className="flex flex-wrap items-center gap-2 font-mono">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[11px] font-semibold bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    SYS:ACTIVE // BÖTE &amp; TECH DISCUSSIONS
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[11px] font-medium bg-[#0D0F12] border border-[#232730] text-[#F59E0B]">
                    <Shield className="w-3 h-3 text-[#F59E0B]" />
                    VERIFIED CODE &amp; KNOWLEDGE BASE
                  </span>
                </div>

                {/* Ana Başlık & Slogan */}
                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl xl:text-[28px] font-bold tracking-tight leading-snug text-[#E6EDF3]">
                    Mühendislik, Bilişim ve{' '}
                    <span className="text-[#10B981] underline decoration-[#10B981]/40 underline-offset-4">
                      BÖTE Tartışma Platformu
                    </span>
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#8B949E] leading-relaxed max-w-2xl">
                    Yazılım mimarileri, siber güvenlik, yapay zeka, donanım, BÖTE ve eğitim teknolojileri üzerine yüksek bilgi yoğunluklu teknik tartışmalar başlatın, çalışan kod blokları paylaşın ve çözüm üreterek itibar kazanın.
                  </p>
                </div>

                {/* Hero İçi Hızlı Arama & Filtreleme Çubuğu */}
                <div className="relative max-w-xl pt-1">
                  <Search className="w-4 h-4 text-[#8B949E] absolute left-3.5 top-1/2 -translate-y-1/2 mt-0.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                      syncUrl({ q: e.target.value });
                    }}
                    placeholder="Tartışmalarda, kod bloklarında veya #etiketlerde filtrele..."
                    className="w-full pl-10 pr-24 py-2.5 rounded-md text-xs sm:text-sm bg-[#0D0F12] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981] transition-colors font-mono"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        syncUrl({ q: '' });
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 mt-0.5 px-2 py-0.5 rounded-sm font-mono text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer"
                    >
                      ESC / TEMİZLE
                    </button>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 absolute right-2.5 top-1/2 -translate-y-1/2 mt-0.5 px-2 py-0.5 rounded-sm font-mono text-[10px] font-medium bg-[#15181E] text-[#F59E0B] border border-[#232730]">
                      <Zap className="w-3 h-3 text-[#F59E0B]" /> 0ms FILTER
                    </span>
                  )}
                </div>
              </div>

              {/* Alt Aksiyon Butonları */}
              <div className="relative z-10 pt-4 mt-4 border-t border-[#232730] flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={isLoggedIn ? '/yeni-konu' : '/giris'}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Yeni Konu Başlat
                  </Link>
                  <Link
                    href="/haberler"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium bg-[#0D0F12] hover:border-[#10B981]/60 text-[#E6EDF3] border border-[#232730] transition-colors"
                  >
                    <Newspaper className="w-3.5 h-3.5 text-[#10B981]" />
                    Teknoloji Gündemi
                  </Link>
                  <button
                    type="button"
                    onClick={() => selectFilter('cevapsiz')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono font-medium bg-[#0D0F12] hover:border-[#F59E0B]/60 text-[#F59E0B] border border-[#232730] transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                    UNANSWERED [{unansweredCount}]
                  </button>
                </div>
              </div>
            </div>

            {/* Sağ Panel: Günün Teknoloji Manşeti + Canlı Telemetri (5 Sütun) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3">
              {/* Üst: Günün Öne Çıkan Teknoloji Dosyası */}
              {leadNews && (
                <Link
                  href={`/haberler/${leadNews.slug}`}
                  className="group relative flex-1 rounded-md overflow-hidden border border-[#232730] bg-[#15181E] hover:border-[#10B981]/60 transition-colors flex flex-col justify-end min-h-[190px]"
                >
                  <TechNewsCover
                    title={leadNews.title}
                    category={leadNews.category}
                    badgeColor={leadNews.badgeColor}
                    imageUrl={leadNews.imageUrl}
                    slug={leadNews.slug}
                    className="absolute inset-0 w-full h-full"
                    overlayVariant="hero"
                  />

                  <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 font-mono">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-semibold border bg-[#0D0F12]/90"
                      style={{
                        borderColor: '#232730',
                        color: leadNews.badgeColor,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-xs"
                        style={{ backgroundColor: leadNews.badgeColor }}
                      />
                      {leadNews.category}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-[#F59E0B] text-[#0D0F12]">
                      <Flame className="w-3 h-3 fill-[#0D0F12]" />
                      FEATURED
                    </span>
                  </div>

                  <div className="relative z-10 p-4 pt-12 bg-[#0D0F12]/90 border-t border-[#232730]">
                    <h2 className="text-sm sm:text-base font-bold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors leading-snug line-clamp-2">
                      {leadNews.title}
                    </h2>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#8B949E]">
                      <span className="text-[#10B981]">
                        {leadNews.source} • {leadNews.readTime}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#E6EDF3] group-hover:text-[#10B981]">
                        OKU <ArrowRight className="w-3 h-3 text-[#10B981]" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Alt: 4'lü Keskin Telemetri Izgarası */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5">
                <div className="rounded-md border border-[#232730] bg-[#15181E] p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-[#0D0F12] border border-[#232730] text-[#10B981] flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-base font-mono font-bold text-[#E6EDF3] leading-none tabular-nums">
                      {stats.totalThreads}
                    </p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] mt-1">
                      TARTIŞMA
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-[#232730] bg-[#15181E] p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-[#0D0F12] border border-[#232730] text-[#10B981] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-base font-mono font-bold text-[#10B981] leading-none tabular-nums">
                      %{solveRate}
                    </p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] mt-1">
                      ÇÖZÜM ({solvedCount})
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-[#232730] bg-[#15181E] p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-[#0D0F12] border border-[#232730] text-[#F59E0B] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-base font-mono font-bold text-[#E6EDF3] leading-none tabular-nums">
                      {stats.totalComments}
                    </p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] mt-1">
                      YANIT
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-[#232730] bg-[#15181E] p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-[#0D0F12] border border-[#232730] text-[#F59E0B] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-base font-mono font-bold text-[#E6EDF3] leading-none tabular-nums">
                      {stats.totalUsers}
                    </p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] mt-1">
                      ÜYE
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* İnteraktif Kategori Vitrin Şeridi */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {categories.slice(0, 6).map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.slug)}
                  className={`group p-2.5 rounded-md border text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
                    isActive
                      ? 'border-[#10B981] bg-[#10B981]/10'
                      : 'border-[#232730] bg-[#15181E] hover:border-[#10B981]/50 hover:bg-[#1A1E26]'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-[#0D0F12] border border-[#232730]"
                    style={{ color: cat.color }}
                  >
                    <CategoryIcon
                      name={cat.icon}
                      className="w-4 h-4"
                      color={cat.color}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#E6EDF3] truncate group-hover:text-[#10B981] transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-[10px] font-mono text-[#8B949E]">
                      {cat._count.threads} konu
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* SOL KENAR ÇUBUĞU: Forum Navigasyonu & Kategoriler */}
      <aside className="order-2 lg:order-1 lg:col-span-3 space-y-3.5 lg:sticky lg:top-20">
        {/* Forum Görünümleri */}
        <div className="hidden lg:block rounded-md border border-[#232730] bg-[#15181E] p-3">
          <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8B949E] px-2 mb-2">
            FORUM AKIŞI
          </h3>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => selectFilter('')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                !activeCategory && !filterBy && !activeTag && !searchQuery
                  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                Tüm Konular
              </span>
              <span className="text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#E6EDF3]">
                {threads.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => selectFilter('cevapsiz')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterBy === 'cevapsiz'
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                Cevapsız Sorular
              </span>
              <span className="text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#F59E0B]">
                {unansweredCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => selectFilter('cozuldu')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterBy === 'cozuldu'
                  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                Çözülen Konular
              </span>
              <span className="text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#10B981]">
                {solvedCount}
              </span>
            </button>

            <Link
              href="/haberler"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Newspaper className="w-3.5 h-3.5 text-[#10B981]" />
                Teknoloji Gündemi
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#10B981]">
                RADAR
              </span>
            </Link>

            <Link
              href="/destek"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#F59E0B]" />
                Destek & Talep
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#F59E0B]">
                TICKET
              </span>
            </Link>

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => selectFilter('kaydedilenler')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  filterBy === 'kaydedilenler'
                    ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40'
                    : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-[#10B981]" />
                  Kaydedilenler
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Forum Kategorileri */}
        <div className="hidden lg:block rounded-md border border-[#232730] bg-[#15181E] p-3">
          <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8B949E] px-2 mb-2">
            KATEGORİLER
          </h3>
          <div className="space-y-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.slug)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40'
                      : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="w-6 h-6 rounded-sm bg-[#0D0F12] border border-[#232730] flex items-center justify-center shrink-0">
                      <CategoryIcon
                        name={cat.icon}
                        className="w-3.5 h-3.5"
                        color={cat.color}
                      />
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#8B949E] tabular-nums">
                    {cat._count.threads}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Popüler Etiketler */}
        {popularTags.length > 0 && (
          <div className="rounded-md border border-[#232730] bg-[#15181E] p-3">
            <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8B949E] mb-2.5 flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-[#10B981]" /> ETİKETLER
            </h3>
            <div className="flex flex-wrap gap-1.5 font-mono">
              {popularTags.map(([tag, count]) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => selectTag(tag)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium border transition-colors cursor-pointer ${
                    activeTag === tag
                      ? 'bg-[#10B981] text-[#0D0F12] border-[#10B981] font-semibold'
                      : 'bg-[#0D0F12] border-[#232730] text-[#8B949E] hover:border-[#10B981]/50 hover:text-[#10B981]'
                  }`}
                >
                  #{tag}
                  <span className="text-[10px] opacity-65">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ORTA SÜTUN: Ana Forum Tartışma Akışı */}
      <div className="order-1 lg:order-2 lg:col-span-6 space-y-3 min-w-0">
        {/* Mobil & Tablet Hızlı Filtre ve Kategori Şeridi */}
        <div className="lg:hidden space-y-2 font-mono">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => selectFilter('')}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                !activeCategory && !filterBy && !activeTag && !searchQuery
                  ? 'bg-[#10B981] border-[#10B981] text-[#0D0F12]'
                  : 'bg-[#15181E] border-[#232730] text-[#8B949E]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Tümü ({threads.length})
            </button>

            <button
              type="button"
              onClick={() => selectFilter('cevapsiz')}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                filterBy === 'cevapsiz'
                  ? 'bg-[#F59E0B] border-[#F59E0B] text-[#0D0F12]'
                  : 'bg-[#15181E] border-[#232730] text-[#8B949E]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
              Cevapsız ({unansweredCount})
            </button>

            <button
              type="button"
              onClick={() => selectFilter('cozuldu')}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                filterBy === 'cozuldu'
                  ? 'bg-[#10B981] border-[#10B981] text-[#0D0F12]'
                  : 'bg-[#15181E] border-[#232730] text-[#8B949E]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              Çözülen ({solvedCount})
            </button>

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => selectFilter('kaydedilenler')}
                className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  filterBy === 'kaydedilenler'
                    ? 'bg-[#10B981] border-[#10B981] text-[#0D0F12]'
                    : 'bg-[#15181E] border-[#232730] text-[#8B949E]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-[#10B981]" />
                Kaydedilenler
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => selectCategory('')}
              className={`shrink-0 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                !activeCategory
                  ? 'bg-[#E6EDF3] text-[#0D0F12] border-[#E6EDF3]'
                  : 'bg-[#15181E] border-[#232730] text-[#8B949E]'
              }`}
            >
              Tüm Kategoriler
            </button>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.slug)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#10B981] border-[#10B981] text-[#0D0F12]'
                      : 'bg-[#15181E] border-[#232730] text-[#E6EDF3]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-xs"
                    style={{ backgroundColor: isActive ? '#0D0F12' : cat.color }}
                  />
                  {cat.name}
                  <span className="text-[10px] opacity-65">({cat._count.threads})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kategori Başlık Kartı */}
        {selectedCategoryObj && (
          <div className="rounded-md border border-[#232730] bg-[#15181E] p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-[#0D0F12] border border-[#232730] flex items-center justify-center shrink-0">
                <CategoryIcon
                  name={selectedCategoryObj.icon}
                  className="w-5 h-5"
                  color={selectedCategoryObj.color}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-[#E6EDF3]">
                    {selectedCategoryObj.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-sm font-mono text-[11px] font-semibold bg-[#0D0F12] border border-[#232730] text-[#10B981]">
                    {selectedCategoryObj._count.threads} konu
                  </span>
                </div>
                <p className="text-xs text-[#8B949E] mt-0.5">
                  {selectedCategoryObj.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => selectCategory(selectedCategoryObj.slug)}
              className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12]"
              title="Filtreyi Temizle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Güncel Teknolojik Gelişmeler Vitrini */}
        {!selectedCategoryObj && !searchQuery && !activeTag && !filterBy && techNews.length > 0 && (
          <div className="rounded-md border border-[#232730] bg-[#15181E] p-3.5 space-y-3">
            <div className="flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#E6EDF3] flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5 text-[#10B981]" />
                  GÜNCEL TEKNOLOJİ RADARI
                </h2>
              </div>
              <Link
                href="/haberler"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981] hover:underline"
              >
                TÜMÜ [{techNews.length}] <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {techNews.slice(0, 2).map((news) => (
                <Link
                  key={news.id}
                  href={`/haberler/${news.slug}`}
                  className="group rounded-md overflow-hidden border border-[#232730] bg-[#0D0F12] hover:border-[#10B981]/50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-28 w-full overflow-hidden border-b border-[#232730]">
                      <TechNewsCover
                        title={news.title}
                        category={news.category}
                        badgeColor={news.badgeColor}
                        imageUrl={news.imageUrl}
                        slug={news.slug}
                        className="w-full h-full"
                        overlayVariant="card"
                      />
                      <span
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-sm font-mono text-[10px] font-semibold bg-[#0D0F12]/90 border border-[#232730]"
                        style={{ color: news.badgeColor }}
                      >
                        {news.category}
                      </span>
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-sm font-mono text-[10px] font-medium bg-[#0D0F12]/90 text-[#8B949E] border border-[#232730]">
                        {news.readTime}
                      </span>
                    </div>
                    <div className="p-3 pb-1.5">
                      <h3 className="text-xs sm:text-[13px] font-bold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors line-clamp-2 leading-snug">
                        {news.title}
                      </h3>
                    </div>
                  </div>
                  <p className="px-3 pb-3 text-[11px] text-[#8B949E] line-clamp-2">
                    {news.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Aktif Arama veya Filtre Bilgisi */}
        {(searchQuery || activeTag || filterBy) && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-md bg-[#15181E] border border-[#10B981]/40 text-xs font-mono text-[#E6EDF3]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#8B949E]">FILTER:</span>
              {searchQuery && (
                <span className="font-semibold text-[#10B981]">q=&ldquo;{searchQuery}&rdquo;</span>
              )}
              {activeTag && <span className="font-semibold text-[#10B981]">#{activeTag}</span>}
              {filterBy === 'cozuldu' && <span className="font-semibold text-[#10B981]">status:solved</span>}
              {filterBy === 'cevapsiz' && (
                <span className="font-semibold text-[#F59E0B]">status:unanswered</span>
              )}
              {filterBy === 'kaydedilenler' && (
                <span className="font-semibold text-[#10B981]">saved:true</span>
              )}
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 font-semibold text-[#F59E0B] hover:underline cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> SIFIRLA
            </button>
          </div>
        )}

        {/* Forum Araç Çubuğu: Sıralama Sekmeleri + Görünüm Modu */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#15181E] p-1.5 rounded-md border border-[#232730]">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar font-mono">
            <button
              type="button"
              onClick={() => selectSort('aktivite')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                sortBy === 'aktivite'
                  ? 'bg-[#0D0F12] text-[#10B981] border border-[#232730]'
                  : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Aktivite
            </button>

            <button
              type="button"
              onClick={() => selectSort('yeni')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                sortBy === 'yeni'
                  ? 'bg-[#0D0F12] text-[#10B981] border border-[#232730]'
                  : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              En Yeni
            </button>

            <button
              type="button"
              onClick={() => selectSort('populer')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                sortBy === 'populer'
                  ? 'bg-[#0D0F12] text-[#F59E0B] border border-[#232730]'
                  : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              En Çok Oy
            </button>

            <button
              type="button"
              onClick={() => selectSort('goruntulenme')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                sortBy === 'goruntulenme'
                  ? 'bg-[#0D0F12] text-[#10B981] border border-[#232730]'
                  : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Okunma
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto font-mono">
            <span className="text-[11px] text-[#8B949E] hidden sm:inline tabular-nums">
              {filteredAndSortedThreads.length} kayıt
            </span>

            <div className="inline-flex items-center rounded-md bg-[#0D0F12] p-0.5 border border-[#232730]">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                title="Detaylı Kart Görünümü"
                className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-[#15181E] text-[#10B981]'
                    : 'text-[#8B949E] hover:text-[#E6EDF3]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                title="Kompakt Forum Tablo Görünümü"
                className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-[#15181E] text-[#10B981]'
                    : 'text-[#8B949E] hover:text-[#E6EDF3]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Konu Listesi */}
        {filteredAndSortedThreads.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#232730] bg-[#15181E] p-10 text-center space-y-2.5">
            <MessageSquare className="w-8 h-8 text-[#8B949E] mx-auto" />
            <h3 className="text-sm font-bold text-[#E6EDF3]">
              Aradığınız kriterlere uygun konu bulunamadı
            </h3>
            <p className="text-xs text-[#8B949E] max-w-sm mx-auto">
              Farklı bir kategori seçebilir, arama filtresini temizleyebilir veya bu alanda ilk konuyu siz açabilirsiniz.
            </p>
            <div className="pt-2">
              <Link
                href="/yeni-konu"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[#10B981] text-[#0D0F12] hover:bg-[#059669]"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Yeni Konu Aç
              </Link>
            </div>
          </div>
        ) : viewMode === 'compact' ? (
          <div className="rounded-md border border-[#232730] bg-[#15181E] overflow-hidden">
            <div className="px-3.5 py-2 bg-[#15181E] border-b border-[#232730] flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8B949E]">
              <span>KONU &amp; KATEGORİ</span>
              <div className="flex items-center gap-6">
                <span className="hidden sm:inline">METRİKLER</span>
                <span className="hidden xl:inline min-w-[115px] text-right">
                  SON AKTİVİTE
                </span>
              </div>
            </div>

            <div>
              {paginatedThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  isLoggedIn={isLoggedIn}
                  canModerate={canModerate}
                  compact={true}
                  onDeleted={handleThreadDeleted}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginatedThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                isLoggedIn={isLoggedIn}
                canModerate={canModerate}
                compact={false}
                onDeleted={handleThreadDeleted}
              />
            ))}
          </div>
        )}

        {/* Sayfalama (Pagination) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 font-mono">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-[#232730] bg-[#15181E] text-[#E6EDF3] disabled:opacity-40 hover:border-[#10B981]/50 cursor-pointer"
            >
              ← Önceki
            </button>
            <span className="text-xs text-[#8B949E]">
              [{currentPage} / {totalPages}]
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-[#232730] bg-[#15181E] text-[#E6EDF3] disabled:opacity-40 hover:border-[#10B981]/50 cursor-pointer"
            >
              Sonraki →
            </button>
          </div>
        )}
      </div>

      {/* SAĞ KENAR ÇUBUĞU: Topluluk Nabzı, Teknoloji Radarı ve Liderlik Tablosu */}
      <aside className="order-3 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3.5 lg:sticky lg:top-20">
        {/* Topluluk Nabzı */}
        <div className="rounded-md border border-[#232730] bg-[#15181E] p-3.5">
          <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8B949E] mb-2.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#10B981]" /> SİSTEM TELEMETRİSİ
          </h3>
          <div className="grid grid-cols-2 gap-2 text-center font-mono">
            <div className="p-2.5 rounded-md bg-[#0D0F12] border border-[#232730]">
              <p className="text-base font-bold text-[#E6EDF3] tabular-nums">
                {stats.totalThreads}
              </p>
              <p className="text-[10px] text-[#8B949E] uppercase">
                KONU
              </p>
            </div>
            <div className="p-2.5 rounded-md bg-[#0D0F12] border border-[#232730]">
              <p className="text-base font-bold text-[#10B981] tabular-nums">
                {stats.totalComments}
              </p>
              <p className="text-[10px] text-[#8B949E] uppercase">
                YANIT
              </p>
            </div>
            <div className="p-2.5 rounded-md bg-[#0D0F12] border border-[#232730]">
              <p className="text-base font-bold text-[#10B981] tabular-nums">
                {solvedCount}
              </p>
              <p className="text-[10px] text-[#8B949E] uppercase">
                ÇÖZÜLEN
              </p>
            </div>
            <div className="p-2.5 rounded-md bg-[#0D0F12] border border-[#232730]">
              <p className="text-base font-bold text-[#F59E0B] tabular-nums">
                {stats.totalUsers}
              </p>
              <p className="text-[10px] text-[#8B949E] uppercase">
                ÜYE
              </p>
            </div>
          </div>
        </div>

        {/* Sağ Kenar: Teknoloji Gündemi Özeti */}
        {techNews.length > 0 && (
          <div className="rounded-md border border-[#232730] bg-[#15181E] p-3.5">
            <div className="flex items-center justify-between mb-2.5 font-mono">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5 text-[#10B981]" /> TEKNOLOJİ RADARI
              </h3>
              <Link
                href="/haberler"
                className="text-[11px] font-semibold text-[#10B981] hover:underline"
              >
                Tümü
              </Link>
            </div>
            <div className="space-y-2.5 divide-y divide-[#232730]">
              {techNews.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/haberler/${item.slug}`}
                  className="block group pt-2 first:pt-0"
                >
                  <div className="flex items-center gap-1.5 mb-0.5 font-mono">
                    <span
                      className="w-1.5 h-1.5 rounded-xs shrink-0"
                      style={{ backgroundColor: item.badgeColor }}
                    />
                    <span className="text-[10px] text-[#8B949E]">
                      {item.category} • {item.readTime}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* En Aktif Katkıda Bulunanlar */}
        <div className="rounded-md border border-[#232730] bg-[#15181E] p-3.5">
          <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8B949E] mb-2.5 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#F59E0B]" /> İTİBAR LİDERLERİ
          </h3>
          <div className="space-y-2.5">
            {topUsers.map((u, idx) => (
              <Link
                key={u.id}
                href={`/kullanici/${u.username}`}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-xs font-mono font-bold w-4 ${
                      idx === 0
                        ? 'text-[#F59E0B]'
                        : idx === 1
                        ? 'text-[#10B981]'
                        : 'text-[#8B949E]'
                    }`}
                  >
                    {idx + 1}.
                  </span>
                  <UserAvatar
                    name={u.displayName}
                    avatar={u.avatarColor}
                    className="w-7 h-7 rounded-md text-xs border border-[#232730]"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#E6EDF3] truncate group-hover:text-[#10B981] transition-colors">
                      {u.displayName}
                    </p>
                    <p className="text-[10px] font-mono text-[#8B949E] truncate">
                      @{u.username}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#F59E0B] shrink-0 tabular-nums">
                  {u.reputation}p
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Hızlı Rehber / Bilgi Kutusu */}
        <div className="rounded-md border border-[#232730] bg-[#15181E] p-3.5 space-y-2">
          <div className="flex items-center justify-between font-mono">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#10B981]" /> FORUM PROTOKOLÜ
            </h3>
            <Link
              href="/kurallar"
              className="text-[11px] font-semibold text-[#10B981] hover:underline"
            >
              Kurallar →
            </Link>
          </div>
          <ul className="text-xs text-[#8B949E] space-y-1.5 list-disc pl-4">
            <li>Konu açarken açıklayıcı bir başlık ve doğru kategori seçin.</li>
            <li>Kod örneklerini Markdown kod blokları içine yerleştirin.</li>
            <li>Sorunuz çözüldüğünde yardımcı olan yanıtı <strong className="text-[#E6EDF3]">Çözüm Seç</strong> ile işaretleyin.</li>
            <li>
              Şikayet, yeni kategori önerisi veya teknik destek için{' '}
              <Link
                href="/destek"
                className="font-mono font-semibold text-[#10B981] hover:underline"
              >
                Destek &amp; Şikayet Merkezi
              </Link>
              &apos;ni kullanın.
            </li>
          </ul>
        </div>
      </aside>
      </div>
    </div>
  );
}


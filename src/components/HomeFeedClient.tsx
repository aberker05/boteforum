'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FolderKanban,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<HomeThreadItem[]>(initialThreads);
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);

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
  const [catCatalogOpen, setCatCatalogOpen] = useState(false);
  const [sidebarCatQuery, setSidebarCatQuery] = useState('');
  const [sidebarShowAllCats, setSidebarShowAllCats] = useState(false);
  const [canScrollCatLeft, setCanScrollCatLeft] = useState(false);
  const [canScrollCatRight, setCanScrollCatRight] = useState(true);
  const catRailRef = useRef<HTMLDivElement>(null);

  const updateCatRailArrows = useCallback(() => {
    const el = catRailRef.current;
    if (!el) return;
    setCanScrollCatLeft(el.scrollLeft > 6);
    setCanScrollCatRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    updateCatRailArrows();
    window.addEventListener('resize', updateCatRailArrows);
    return () => window.removeEventListener('resize', updateCatRailArrows);
  }, [updateCatRailArrows, categories.length]);

  const scrollCategoryRail = (dir: 'left' | 'right') => {
    const el = catRailRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === 'left' ? -260 : 260,
      behavior: 'smooth',
    });
  };

  const handleCategoryRailWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = catRailRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      updateCatRailArrows();
    }
  };

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

  // Filtre veya sayfa değiştiğinde klavye seçili konu indeksini sıfırla
  useEffect(() => {
    setFocusedIdx(-1);
  }, [activeCategory, activeTag, filterBy, searchQuery, sortBy, currentPage]);

  // Ana Sayfa Klavye Kısayolları (j/k konu gezinme, Enter/o açma, 1/2/3 filtre, v görünüm, x sıfırla)
  useEffect(() => {
    const handleFeedKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (key === 'j' && !e.shiftKey && paginatedThreads.length > 0) {
        e.preventDefault();
        setFocusedIdx((prev) => {
          const next = Math.min(paginatedThreads.length - 1, prev + 1);
          const el = document.getElementById(`feed-thread-${next}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return next;
        });
        return;
      }

      if (key === 'k' && !e.shiftKey && paginatedThreads.length > 0) {
        e.preventDefault();
        setFocusedIdx((prev) => {
          const next = prev <= 0 ? 0 : prev - 1;
          const el = document.getElementById(`feed-thread-${next}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return next;
        });
        return;
      }

      if (
        (e.key === 'Enter' || (key === 'o' && !e.shiftKey)) &&
        focusedIdx >= 0 &&
        focusedIdx < paginatedThreads.length
      ) {
        // Odakta başka bir buton/link yoksa seçili konuyu aç
        if (
          document.activeElement === document.body ||
          document.activeElement === document.documentElement
        ) {
          e.preventDefault();
          router.push(`/konu/${paginatedThreads[focusedIdx].slug}`);
        }
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        selectFilter('');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        selectFilter('cevapsiz');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        selectFilter('cozuldu');
        return;
      }
      if (key === 'v' && !e.shiftKey) {
        e.preventDefault();
        setViewMode((prev) => (prev === 'card' ? 'compact' : 'card'));
        return;
      }
      if (key === 'x' && !e.shiftKey) {
        if (activeCategory || activeTag || filterBy || searchQuery || catCatalogOpen) {
          e.preventDefault();
          setCatCatalogOpen(false);
          clearAllFilters();
        }
      }
    };

    window.addEventListener('keydown', handleFeedKeyDown);
    return () => window.removeEventListener('keydown', handleFeedKeyDown);
  });

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

  // Her kategori için canlı tartışma telemetrisi (0ms istemci tarafı hesaplama, sıfır ek sorgu)
  const categoryMetrics = useMemo(() => {
    const map: Record<
      string,
      {
        solved: number;
        unanswered: number;
        latestTitle: string;
        topTags: string[];
      }
    > = {};
    const tagMap: Record<string, Record<string, number>> = {};

    for (const t of threads) {
      const slug = t.category.slug;
      if (!map[slug]) {
        map[slug] = {
          solved: 0,
          unanswered: 0,
          latestTitle: t.title,
          topTags: [],
        };
        tagMap[slug] = {};
      }
      if (t.isSolved) map[slug].solved += 1;
      if (t.commentCount === 0) map[slug].unanswered += 1;
      if (t.tags) {
        t.tags
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
          .forEach((tg) => {
            tagMap[slug][tg] = (tagMap[slug][tg] || 0) + 1;
          });
      }
    }

    for (const slug of Object.keys(map)) {
      map[slug].topTags = Object.entries(tagMap[slug] || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tg]) => tg);
    }

    return map;
  }, [threads]);

  const maxCategoryCount = useMemo(
    () => Math.max(1, ...categories.map((c) => c._count.threads)),
    [categories]
  );

  const filteredSidebarCategories = useMemo(() => {
    const q = sidebarCatQuery.trim();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        matchesSearch(c.name, q) || matchesSearch(c.description || '', q)
    );
  }, [categories, sidebarCatQuery]);

  const visibleSidebarCategories = useMemo(() => {
    if (sidebarCatQuery.trim() || sidebarShowAllCats) {
      return filteredSidebarCategories;
    }
    return filteredSidebarCategories.slice(0, 8);
  }, [filteredSidebarCategories, sidebarCatQuery, sidebarShowAllCats]);

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
                    CANLI AKIM // YAZILIM &amp; TEKNOLOJİ EKOSİSTEMİ
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[11px] font-medium bg-[#0D0F12] border border-[#232730] text-[#F59E0B]">
                    <Shield className="w-3 h-3 text-[#F59E0B]" />
                    DOĞRULANMIŞ KOD &amp; ÇÖZÜM ARŞİVİ
                  </span>
                </div>

                {/* Ana Başlık & Slogan */}
                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl xl:text-[28px] font-bold tracking-tight leading-snug text-[#E6EDF3]">
                    Yazılım, Yapay Zeka ve Bilişim Dünyasının{' '}
                    <span className="text-[#10B981] underline decoration-[#10B981]/40 underline-offset-4">
                      Yeni Nesil Bilgi ve Çözüm Merkezi
                    </span>
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#8B949E] leading-relaxed max-w-2xl">
                    Modern yazılım mimarileri, siber güvenlik, yapay zeka, donanım ve dijital teknolojiler üzerine nitelikli tartışmalara katılın; çalışan kod blokları paylaşın, sorularınıza hızlı çözümler bulun ve uzmanlığınızla öne çıkın.
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
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        setSearchQuery('');
                        syncUrl({ q: '' });
                        e.currentTarget.blur();
                      }
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
              {/* Üst: Günün Öne Çıkan Teknoloji Dosyası (Net Görsel + Editöryal Alt Panel) */}
              {leadNews && (
                <Link
                  href={`/haberler/${leadNews.slug}`}
                  className="group relative flex-1 rounded-md overflow-hidden border border-[#232730] bg-[#15181E] hover:border-[#10B981]/60 transition-colors flex flex-col justify-between"
                >
                  <div className="relative h-32 sm:h-36 w-full overflow-hidden border-b border-[#232730]">
                    <TechNewsCover
                      title={leadNews.title}
                      category={leadNews.category}
                      badgeColor={leadNews.badgeColor}
                      imageUrl={leadNews.imageUrl}
                      slug={leadNews.slug}
                      className="w-full h-full"
                      overlayVariant="card"
                    />

                    <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-2 font-mono">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-semibold border border-[#232730] bg-[#0D0F12]/90 backdrop-blur-xs"
                        style={{ color: leadNews.badgeColor }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-xs"
                          style={{ backgroundColor: leadNews.badgeColor }}
                        />
                        {leadNews.category === 'Eğitim Teknolojileri (BÖTE)'
                          ? 'Eğitim Teknolojileri'
                          : leadNews.category}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#F59E0B] text-[#0D0F12]">
                        <Flame className="w-3 h-3 fill-[#0D0F12]" />
                        GÜNÜN DOSYASI
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 bg-[#15181E] flex-1 flex flex-col justify-between">
                    <h2 className="text-xs sm:text-sm font-bold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors leading-snug line-clamp-2">
                      {leadNews.title.replace(' (BÖTE)', '')}
                    </h2>
                    <div className="mt-2 pt-2 border-t border-[#232730]/80 flex items-center justify-between text-[11px] font-mono text-[#8B949E]">
                      <span className="text-[#10B981] truncate">
                        {leadNews.source.replace('BÖTE & ', '')} • {leadNews.readTime}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#E6EDF3] group-hover:text-[#10B981] shrink-0">
                        İncele <ArrowRight className="w-3 h-3 text-[#10B981]" />
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
        </section>
      )}

      {/* KALICI KATEGORİ & ALAN GEZGİNİ (Yana Kaydırılabilir Ray + Açılır Katalog Izgarası) */}
      <section className="rounded-md border border-[#232730] bg-[#15181E] p-2.5 sm:p-3 space-y-2.5">
        <div className="flex items-center gap-1.5">
          {/* Sol Kaydırma Oku */}
          {!catCatalogOpen && (
            <button
              type="button"
              onClick={() => scrollCategoryRail('left')}
              disabled={!canScrollCatLeft}
              title="Kategorileri Sola Kaydır"
              className="hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#0D0F12] border border-[#232730] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#10B981]/50 disabled:opacity-25 disabled:pointer-events-none shrink-0 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Yatay Akıcı Kategori Rayı (Fare Tekerleği ve Parmakla Kaydırma Destekli, Kırpılmasız Tam İsimler) */}
          <div
            ref={catRailRef}
            onScroll={updateCatRailArrows}
            onWheel={handleCategoryRailWheel}
            className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth"
          >
            <button
              type="button"
              onClick={() => {
                setActiveCategory('');
                setCurrentPage(1);
                syncUrl({ kategori: '' });
              }}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                !activeCategory
                  ? 'bg-[#10B981] text-[#0D0F12] border-[#10B981]'
                  : 'bg-[#0D0F12] border-[#232730] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#343B48]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tüm Alanlar</span>
              <span
                className={`text-[10px] px-1 rounded-xs tabular-nums ${
                  !activeCategory
                    ? 'bg-[#0D0F12]/20 text-[#0D0F12]'
                    : 'text-[#8B949E]'
                }`}
              >
                {threads.length}
              </span>
            </button>

            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              const catMeta = categoryMetrics[cat.slug];
              return (
                <button
                  key={cat.id}
                  type="button"
                  title={
                    cat.description
                      ? `${cat.name} — ${cat.description}`
                      : cat.name
                  }
                  onClick={() => selectCategory(cat.slug)}
                  className={`group shrink-0 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                      : 'bg-[#0D0F12] border-[#232730] text-[#E6EDF3] hover:border-[#10B981]/50 hover:bg-[#181C23]'
                  }`}
                >
                  <span
                    className="w-4 h-4 flex items-center justify-center shrink-0"
                    style={{ color: isActive ? '#10B981' : cat.color }}
                  >
                    <CategoryIcon
                      name={cat.icon}
                      className="w-3.5 h-3.5"
                      color={isActive ? '#10B981' : cat.color}
                    />
                  </span>
                  <span className="whitespace-nowrap font-semibold">
                    {cat.name}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-sm font-semibold tabular-nums ${
                      isActive
                        ? 'bg-[#10B981] text-[#0D0F12]'
                        : 'bg-[#15181E] text-[#8B949E] border border-[#232730]'
                    }`}
                  >
                    {cat._count.threads}
                  </span>
                  {catMeta && catMeta.unanswered > 0 && !isActive && (
                    <span
                      title={`${catMeta.unanswered} cevapsız soru`}
                      className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sağ Kaydırma Oku */}
          {!catCatalogOpen && (
            <button
              type="button"
              onClick={() => scrollCategoryRail('right')}
              disabled={!canScrollCatRight}
              title="Kategorileri Sağa Kaydır"
              className="hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#0D0F12] border border-[#232730] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#10B981]/50 disabled:opacity-25 disabled:pointer-events-none shrink-0 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Katalog Görünümü Aç/Kapat Butonu */}
          <button
            type="button"
            onClick={() => setCatCatalogOpen((prev) => !prev)}
            title="Detaylı Kategori Kataloğunu Aç / Kapat"
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
              catCatalogOpen
                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/50 text-[#F59E0B]'
                : 'bg-[#0D0F12] border-[#232730] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#10B981]/45'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {catCatalogOpen ? 'Kataloğu Kapat' : `Katalog [${categories.length}]`}
            </span>
            {catCatalogOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Açılır Detaylı Kategori Kataloğu (Açıklamalar, Çözüm/Bekleyen Oranı ve Son Konu Önizlemesi) */}
        {catCatalogOpen && (
          <div className="pt-2.5 border-t border-[#232730] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 font-mono text-[11px]">
              <span className="text-[#8B949E] uppercase tracking-wider font-semibold">
                TÜM FORUM ALANLARI &amp; TARTIŞMA YOĞUNLUĞU ({categories.length} KATEGORİ)
              </span>
              {activeCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('');
                    syncUrl({ kategori: '' });
                  }}
                  className="text-[#F59E0B] hover:underline cursor-pointer"
                >
                  Kategori Filtresini Sıfırla ×
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.slug;
                const meta = categoryMetrics[cat.slug];
                const barWidth = Math.max(
                  6,
                  Math.round((cat._count.threads / maxCategoryCount) * 100)
                );

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      selectCategory(cat.slug);
                      setCatCatalogOpen(false);
                    }}
                    className={`group relative rounded-md border p-3 text-left transition-colors cursor-pointer flex flex-col justify-between overflow-hidden ${
                      isActive
                        ? 'border-[#10B981] bg-[#10B981]/10'
                        : 'border-[#232730] bg-[#0D0F12] hover:border-[#10B981]/50 hover:bg-[#12161C]'
                    }`}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ backgroundColor: cat.color }}
                    />

                    <div className="pl-1.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-7 h-7 rounded-md bg-[#15181E] border border-[#232730] flex items-center justify-center shrink-0"
                            style={{ color: cat.color }}
                          >
                            <CategoryIcon
                              name={cat.icon}
                              className="w-3.5 h-3.5"
                              color={cat.color}
                            />
                          </span>
                          <span className="text-xs sm:text-[13px] font-bold text-[#E6EDF3] group-hover:text-[#10B981] transition-colors leading-snug">
                            {cat.name}
                          </span>
                        </div>

                        <span className="shrink-0 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-sm bg-[#15181E] border border-[#232730] text-[#E6EDF3] tabular-nums">
                          {cat._count.threads} konu
                        </span>
                      </div>

                      {cat.description && (
                        <p className="text-[11px] text-[#8B949E] line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div className="pl-1.5 mt-3 pt-2 border-t border-[#232730]/80 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[#10B981]">
                            ✓ {meta?.solved || 0} çözüldü
                          </span>
                          {(meta?.unanswered || 0) > 0 && (
                            <span className="text-[#F59E0B]">
                              • {meta?.unanswered} bekliyor
                            </span>
                          )}
                        </div>
                        <span className="text-[#8B949E] group-hover:text-[#10B981]">
                          Filtrele →
                        </span>
                      </div>

                      <div className="w-full h-1 rounded-xs bg-[#15181E] overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

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

        {/* Forum Kategorileri (Gelişmiş Sol Kategori Dizini) */}
        <div className="hidden lg:block rounded-md border border-[#232730] bg-[#15181E] p-3 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-[#10B981]" />
              KATEGORİ DİZİNİ [{categories.length}]
            </h3>
            {activeCategory && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('');
                  syncUrl({ kategori: '' });
                }}
                className="text-[10px] font-mono font-semibold text-[#F59E0B] hover:underline cursor-pointer"
              >
                Sıfırla
              </button>
            )}
          </div>

          {categories.length > 5 && (
            <div className="relative">
              <Search className="w-3 h-3 text-[#8B949E] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={sidebarCatQuery}
                onChange={(e) => setSidebarCatQuery(e.target.value)}
                placeholder="Kategori filtrele..."
                className="w-full pl-7 pr-6 py-1 rounded-md text-[11px] font-mono bg-[#0D0F12] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981]"
              />
              {sidebarCatQuery && (
                <button
                  type="button"
                  onClick={() => setSidebarCatQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#E6EDF3]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <div className="space-y-1">
            {!sidebarCatQuery && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('');
                  setCurrentPage(1);
                  syncUrl({ kategori: '' });
                }}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                  !activeCategory
                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 font-semibold'
                    : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-sm bg-[#0D0F12] border border-[#232730] flex items-center justify-center shrink-0 text-[#10B981]">
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                  <span>Tüm Kategoriler</span>
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#E6EDF3] tabular-nums">
                  {threads.length}
                </span>
              </button>
            )}

            {visibleSidebarCategories.length === 0 ? (
              <p className="text-[11px] font-mono text-[#8B949E] py-2 text-center">
                Eşleşen kategori yok
              </p>
            ) : (
              visibleSidebarCategories.map((cat) => {
                const isActive = activeCategory === cat.slug;
                const ratio = Math.max(
                  8,
                  Math.round((cat._count.threads / maxCategoryCount) * 100)
                );
                return (
                  <button
                    key={cat.id}
                    type="button"
                    title={
                      cat.description
                        ? `${cat.name} — ${cat.description}`
                        : cat.name
                    }
                    onClick={() => selectCategory(cat.slug)}
                    className={`group relative w-full px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-[#10B981]/12 text-[#10B981] border-[#10B981]/45'
                        : 'text-[#E6EDF3]/90 hover:text-[#E6EDF3] hover:bg-[#0D0F12] border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-sm bg-[#0D0F12] border border-[#232730] flex items-center justify-center shrink-0">
                          <CategoryIcon
                            name={cat.icon}
                            className="w-3.5 h-3.5"
                            color={isActive ? '#10B981' : cat.color}
                          />
                        </span>
                        <span className="text-xs font-medium leading-snug line-clamp-1">
                          {cat.name}
                        </span>
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-sm shrink-0 tabular-nums ${
                          isActive
                            ? 'bg-[#10B981] text-[#0D0F12] font-bold'
                            : 'bg-[#0D0F12] border border-[#232730] text-[#8B949E]'
                        }`}
                      >
                        {cat._count.threads}
                      </span>
                    </div>
                    <div className="mt-1.5 ml-8 h-[2px] rounded-xs bg-[#0D0F12] overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${ratio}%`,
                          backgroundColor: isActive ? '#10B981' : cat.color,
                          opacity: isActive ? 1 : 0.65,
                        }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {!sidebarCatQuery.trim() && filteredSidebarCategories.length > 8 && (
            <button
              type="button"
              onClick={() => setSidebarShowAllCats((prev) => !prev)}
              className="w-full py-1.5 rounded-md text-[11px] font-mono font-semibold text-[#8B949E] hover:text-[#10B981] bg-[#0D0F12] border border-[#232730] transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              {sidebarShowAllCats ? (
                <>
                  Daha Az Göster <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  Tümünü Göster (+{filteredSidebarCategories.length - 8}){' '}
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
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
        {/* Mobil & Tablet Hızlı Durum Filtre Şeridi (Kategoriler üstteki kalıcı rayda yer alır) */}
        <div className="lg:hidden font-mono">
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
        </div>

        {/* Seçili Kategori Komuta Başlığı (Canlı İstatistikler, Etiketler & Hızlı Konu Açma) */}
        {selectedCategoryObj && (
          <div className="relative rounded-md border border-[#232730] bg-[#15181E] overflow-hidden">
            <div
              className="h-[3px] w-full"
              style={{ backgroundColor: selectedCategoryObj.color }}
            />
            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-[#0D0F12] border border-[#232730] flex items-center justify-center shrink-0">
                    <CategoryIcon
                      name={selectedCategoryObj.icon}
                      className="w-5 h-5"
                      color={selectedCategoryObj.color}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-base sm:text-lg font-bold text-[#E6EDF3]">
                        {selectedCategoryObj.name}
                      </h1>
                      <span className="px-2 py-0.5 rounded-sm font-mono text-[11px] font-semibold bg-[#0D0F12] border border-[#232730] text-[#10B981]">
                        {selectedCategoryObj._count.threads} konu
                      </span>
                      {(categoryMetrics[selectedCategoryObj.slug]?.solved || 0) >
                        0 && (
                        <span className="px-2 py-0.5 rounded-sm font-mono text-[10px] font-semibold bg-[#10B981]/15 border border-[#10B981]/35 text-[#10B981]">
                          ✓ {categoryMetrics[selectedCategoryObj.slug].solved} çözüldü
                        </span>
                      )}
                      {(categoryMetrics[selectedCategoryObj.slug]?.unanswered ||
                        0) > 0 && (
                        <span className="px-2 py-0.5 rounded-sm font-mono text-[10px] font-semibold bg-[#F59E0B]/15 border border-[#F59E0B]/35 text-[#F59E0B]">
                          ? {categoryMetrics[selectedCategoryObj.slug].unanswered} cevapsız
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8B949E] leading-relaxed">
                      {selectedCategoryObj.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={
                      isLoggedIn
                        ? `/yeni-konu?kategoriId=${encodeURIComponent(
                            selectedCategoryObj.id
                          )}`
                        : '/giris'
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Bu Alanda Konu Aç
                  </Link>
                  <button
                    type="button"
                    onClick={() => selectCategory(selectedCategoryObj.slug)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono font-medium bg-[#0D0F12] border border-[#232730] text-[#8B949E] hover:text-[#E6EDF3] cursor-pointer"
                    title="Kategori Filtresini Kaldır"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tümü</span>
                  </button>
                </div>
              </div>

              {(categoryMetrics[selectedCategoryObj.slug]?.topTags.length || 0) >
                0 && (
                <div className="pt-2.5 border-t border-[#232730] flex items-center gap-1.5 flex-wrap font-mono">
                  <span className="text-[10px] uppercase tracking-wider text-[#8B949E] mr-1">
                    BU ALANDAKİ ETİKETLER:
                  </span>
                  {categoryMetrics[selectedCategoryObj.slug].topTags.map(
                    (tg) => (
                      <button
                        key={tg}
                        type="button"
                        onClick={() => selectTag(tg)}
                        className={`px-2 py-0.5 rounded-sm text-[11px] border transition-colors cursor-pointer ${
                          activeTag === tg
                            ? 'bg-[#10B981] border-[#10B981] text-[#0D0F12] font-semibold'
                            : 'bg-[#0D0F12] border-[#232730] text-[#8B949E] hover:border-[#10B981]/50 hover:text-[#10B981]'
                        }`}
                      >
                        #{tg}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
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
              {paginatedThreads.map((thread, idx) => (
                <div
                  key={thread.id}
                  id={`feed-thread-${idx}`}
                  className={
                    focusedIdx === idx
                      ? 'ring-1 ring-inset ring-[#10B981] bg-[#10B981]/5'
                      : ''
                  }
                >
                  <ThreadCard
                    thread={thread}
                    isLoggedIn={isLoggedIn}
                    canModerate={canModerate}
                    compact={true}
                    onDeleted={handleThreadDeleted}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginatedThreads.map((thread, idx) => (
              <div
                key={thread.id}
                id={`feed-thread-${idx}`}
                className={`rounded-md transition-all ${
                  focusedIdx === idx
                    ? 'ring-1 ring-[#10B981]'
                    : ''
                }`}
              >
                <ThreadCard
                  thread={thread}
                  isLoggedIn={isLoggedIn}
                  canModerate={canModerate}
                  compact={false}
                  onDeleted={handleThreadDeleted}
                />
              </div>
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


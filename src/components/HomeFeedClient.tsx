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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* SOL KENAR ÇUBUĞU: Forum Navigasyonu & Kategoriler */}
      <aside className="order-2 lg:order-1 lg:col-span-3 space-y-5 lg:sticky lg:top-22">
        {/* Forum Görünümleri (Masaüstünde görünür, mobil/tablette üst şeritte yer alır) */}
        <div className="hidden lg:block rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-3.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 mb-2">
            Forum Akışı
          </h3>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => selectFilter('')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                !activeCategory && !filterBy && !activeTag && !searchQuery
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                Tüm Konular
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  !activeCategory && !filterBy && !activeTag && !searchQuery
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {threads.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => selectFilter('cevapsiz')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                filterBy === 'cevapsiz'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <HelpCircle
                  className={`w-4 h-4 ${
                    filterBy === 'cevapsiz' ? 'text-white' : 'text-amber-500'
                  }`}
                />
                Cevapsız Sorular
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  filterBy === 'cevapsiz'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
              >
                {unansweredCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => selectFilter('cozuldu')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                filterBy === 'cozuldu'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    filterBy === 'cozuldu' ? 'text-white' : 'text-emerald-500'
                  }`}
                />
                Çözülen Konular
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  filterBy === 'cozuldu'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {solvedCount}
              </span>
            </button>

            <Link
              href="/haberler"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Newspaper className="w-4 h-4 text-indigo-500" />
                Teknoloji Gündemi
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                RADAR
              </span>
            </Link>

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => selectFilter('kaydedilenler')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  filterBy === 'kaydedilenler'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Bookmark
                    className={`w-4 h-4 ${
                      filterBy === 'kaydedilenler'
                        ? 'text-white'
                        : 'text-indigo-500'
                    }`}
                  />
                  Kaydedilenler
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Forum Kategorileri (Masaüstünde görünür, mobil/tablette üst şeritte yer alır) */}
        <div className="hidden lg:block rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2.5">
            Forum Kategorileri
          </h3>
          <div className="space-y-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.slug)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold ring-1 ring-indigo-500/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}18` }}
                    >
                      <CategoryIcon
                        name={cat.icon}
                        className="w-4 h-4"
                        color={cat.color}
                      />
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tabular-nums">
                    {cat._count.threads}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Popüler Etiketler */}
        {popularTags.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Popüler Etiketler
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {popularTags.map(([tag, count]) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => selectTag(tag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeTag === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  #{tag}
                  <span className="text-[10px] opacity-60">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ORTA SÜTUN: Ana Forum Tartışma Akışı */}
      <div className="order-1 lg:order-2 lg:col-span-6 space-y-3.5 sm:space-y-4 min-w-0">
        {/* Mobil & Tablet Hızlı Filtre ve Kategori Şeridi */}
        <div className="lg:hidden space-y-2">
          {/* Satır 1: Hızlı Durum Filtreleri */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => selectFilter('')}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                !activeCategory && !filterBy && !activeTag && !searchQuery
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Tüm Konular ({threads.length})
            </button>

            <button
              type="button"
              onClick={() => selectFilter('cevapsiz')}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                filterBy === 'cevapsiz'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              Cevapsız ({unansweredCount})
            </button>

            <button
              type="button"
              onClick={() => selectFilter('cozuldu')}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                filterBy === 'cozuldu'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Çözülen ({solvedCount})
            </button>

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => selectFilter('kaydedilenler')}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  filterBy === 'kaydedilenler'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                Kaydedilenler
              </button>
            )}
          </div>

          {/* Satır 2: Yatay Kaydırılabilir Kategori Sekmeleri */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => selectCategory('')}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                !activeCategory
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
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
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isActive ? '#ffffff' : cat.color }}
                  />
                  {cat.name}
                  <span className="text-[10px] opacity-65">({cat._count.threads})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kategori Başlık Kartı veya Profesyonel Forum Üst Barı */}
        {selectedCategoryObj ? (
          <div
            className="rounded-2xl border p-5 flex items-start justify-between gap-4"
            style={{
              borderColor: `${selectedCategoryObj.color}40`,
              backgroundColor: `${selectedCategoryObj.color}0c`,
            }}
          >
            <div className="flex items-start gap-3.5">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${selectedCategoryObj.color}25` }}
              >
                <CategoryIcon
                  name={selectedCategoryObj.icon}
                  className="w-6 h-6"
                  color={selectedCategoryObj.color}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {selectedCategoryObj.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300">
                    {selectedCategoryObj._count.threads} konu
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  {selectedCategoryObj.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => selectCategory(selectedCategoryObj.slug)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              title="Filtreyi Temizle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Teknik Tartışma & Bilgi Bankası
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Geliştirici & Teknoloji Forumu
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Sorularınızı paylaşın, kod blokları ve anketlerle teknik tartışmalar başlatın, doğru çözümlerle itibar puanı kazanın.
                </p>
              </div>
              <Link
                href={isLoggedIn ? '/yeni-konu' : '/giris'}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/30 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Yeni Konu Aç
              </Link>
            </div>
          </div>
        )}

        {/* Güncel Teknolojik Gelişmeler Vitrini */}
        {!selectedCategoryObj && !searchQuery && !activeTag && !filterBy && techNews.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5 text-indigo-500" />
                  Güncel Teknolojik Gelişmeler
                </h2>
              </div>
              <Link
                href="/haberler"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Tümünü Gör ({techNews.length}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {techNews.slice(0, 2).map((news) => (
                <Link
                  key={news.id}
                  href={`/haberler/${news.slug}`}
                  className="group rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-500/40 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-32 w-full overflow-hidden">
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
                        className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border"
                        style={{
                          backgroundColor: 'rgba(9, 13, 22, 0.78)',
                          borderColor: `${news.badgeColor}60`,
                          color: news.badgeColor,
                        }}
                      >
                        {news.category}
                      </span>
                      <span className="absolute bottom-2 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-950/75 text-slate-200 backdrop-blur-md">
                        {news.readTime}
                      </span>
                    </div>
                    <div className="p-3.5 pb-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                        {news.title}
                      </h3>
                    </div>
                  </div>
                  <p className="px-3.5 pb-3.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {news.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Aktif Arama veya Filtre Bilgisi */}
        {(searchQuery || activeTag || filterBy) && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-800 dark:text-indigo-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Aktif Görünüm:</span>
              {searchQuery && (
                <span className="font-bold">&ldquo;{searchQuery}&rdquo; araması</span>
              )}
              {activeTag && <span className="font-bold">#{activeTag} etiketi</span>}
              {filterBy === 'cozuldu' && <span className="font-bold">Çözülen Konular</span>}
              {filterBy === 'cevapsiz' && (
                <span className="font-bold">Cevapsız Sorular (0 Yanıt)</span>
              )}
              {filterBy === 'kaydedilenler' && (
                <span className="font-bold">Kaydedilen Konular</span>
              )}
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 font-semibold hover:underline"
            >
              <X className="w-3.5 h-3.5" /> Temizle
            </button>
          </div>
        )}

        {/* Profesyonel Forum Araç Çubuğu: Sıralama Sekmeleri + Görünüm Modu (Kart / Tablo) */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900/90 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => selectSort('aktivite')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                sortBy === 'aktivite'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Son Aktivite
            </button>

            <button
              type="button"
              onClick={() => selectSort('yeni')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                sortBy === 'yeni'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              En Yeni
            </button>

            <button
              type="button"
              onClick={() => selectSort('populer')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                sortBy === 'populer'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              En Çok Beğenilen
            </button>

            <button
              type="button"
              onClick={() => selectSort('goruntulenme')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                sortBy === 'goruntulenme'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Popüler
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-400 hidden sm:inline tabular-nums">
              {filteredAndSortedThreads.length} konu
            </span>

            {/* Görünüm Seçici: Kart / Kompakt Tablo */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/70 dark:border-slate-700/70">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                title="Detaylı Kart Görünümü"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'card'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                title="Kompakt Forum Tablo Görünümü"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Konu Listesi */}
        {filteredAndSortedThreads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-12 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Aradığınız kriterlere uygun konu bulunamadı
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Farklı bir kategori seçebilir, arama filtresini temizleyebilir veya bu alanda ilk konuyu siz açabilirsiniz.
            </p>
            <div className="pt-2">
              <Link
                href="/yeni-konu"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500"
              >
                <PlusCircle className="w-4 h-4" />
                Yeni Konu Aç
              </Link>
            </div>
          </div>
        ) : viewMode === 'compact' ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 overflow-hidden shadow-2xs">
            {/* Profesyonel Forum Tablo Başlığı */}
            <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Konu & Kategori</span>
              <div className="flex items-center gap-6">
                <span className="hidden sm:inline">İstatistik</span>
                <span className="hidden xl:inline min-w-[115px] text-right">
                  Son Aktivite
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
          <div className="space-y-3.5">
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
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              ← Önceki Sayfa
            </button>
            <span className="text-xs font-medium text-slate-500">
              Sayfa {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Sonraki Sayfa →
            </button>
          </div>
        )}
      </div>

      {/* SAĞ KENAR ÇUBUĞU: Topluluk Nabzı, Teknoloji Radarı ve Liderlik Tablosu */}
      <aside className="order-3 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5 lg:sticky lg:top-22">
        {/* Topluluk Nabzı */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" /> Forum İstatistikleri
          </h3>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {stats.totalThreads}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Toplam Konu
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {stats.totalComments}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Toplam Yanıt
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-lg font-extrabold text-teal-600 dark:text-teal-400 tabular-nums">
                {solvedCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Çözülen Soru
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                {stats.totalUsers}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Kayıtlı Üye
              </p>
            </div>
          </div>
        </div>

        {/* Sağ Kenar: Teknoloji Gündemi Özeti */}
        {techNews.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5 text-emerald-500" /> Teknoloji Radarı
              </h3>
              <Link
                href="/haberler"
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Tümü
              </Link>
            </div>
            <div className="space-y-3">
              {techNews.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/haberler/${item.slug}`}
                  className="block group"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.badgeColor }}
                    />
                    <span className="text-[10px] font-bold text-slate-400">
                      {item.category} • {item.readTime}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* En Aktif Katkıda Bulunanlar */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" /> İtibar Liderleri
          </h3>
          <div className="space-y-3">
            {topUsers.map((u, idx) => (
              <Link
                key={u.id}
                href={`/kullanici/${u.username}`}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`text-xs font-extrabold w-4 ${
                      idx === 0
                        ? 'text-amber-500'
                        : idx === 1
                        ? 'text-slate-400'
                        : idx === 2
                        ? 'text-amber-700 dark:text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {idx + 1}.
                  </span>
                  <UserAvatar
                    name={u.displayName}
                    avatar={u.avatarColor}
                    className="w-8 h-8 rounded-xl text-xs"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-500 transition-colors">
                      {u.displayName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      @{u.username}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 tabular-nums">
                  {u.reputation}p
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Hızlı Rehber / Bilgi Kutusu */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" /> Forum Rehberi
            </h3>
            <Link
              href="/kurallar"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Kurallar →
            </Link>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4">
            <li>Konu açarken açıklayıcı bir başlık ve doğru kategori seçin.</li>
            <li>Kod örneklerini Markdown kod blokları içine yerleştirin.</li>
            <li>Sorunuz çözüldüğünde yardımcı olan yanıtı <strong>Çözüm Seç</strong> ile işaretleyin.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}


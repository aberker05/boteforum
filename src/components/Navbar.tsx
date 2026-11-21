'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  Sun,
  Moon,
  PlusCircle,
  LogOut,
  User as UserIcon,
  Bookmark,
  Sparkles,
  Award,
  X,
  Shield,
  Newspaper,
  MessageSquare,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Tag,
  Layers,
  ArrowRight,
  CornerDownLeft,
  Lock,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { NotificationBell } from './NotificationBell';
import { BrandLogo } from './BrandLogo';
import { UserAvatar } from './UserAvatar';
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from '@/lib/siteSettings';
import { matchesSearch, normalizeSearchText } from '@/lib/utils';

interface NavbarUser {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  role: string;
  reputation: number;
}

interface SearchIndexData {
  threads: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    tags: string;
    isSolved: boolean;
    views: number;
    commentCount: number;
    author: {
      username: string;
      displayName: string;
      avatarColor: string;
    };
    category: {
      name: string;
      slug: string;
      color: string;
    };
  }[];
  categories: {
    id: string;
    name: string;
    slug: string;
    description: string;
    color: string;
    icon: string;
    _count: { threads: number };
  }[];
  tags: { tag: string; count: number }[];
  users: {
    id: string;
    username: string;
    displayName: string;
    avatarColor: string;
    reputation: number;
    role: string;
  }[];
  news: {
    id: string;
    title: string;
    slug: string;
    category: string;
    badgeColor: string;
    readTime: string;
  }[];
}

interface SuggestionItem {
  id: string;
  type: 'thread' | 'category' | 'tag' | 'news' | 'user';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  isSolved?: boolean;
  href: string;
  fillText: string;
  filterAction?: { q?: string; kategori?: string; etiket?: string };
}

export function Navbar({
  user,
  siteSettings = DEFAULT_SITE_SETTINGS,
}: {
  user: NavbarUser | null;
  siteSettings?: SiteSettings;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [sessionPref, setSessionPref] = useState<'ask' | 'close' | 'keep'>('ask');
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const [autoLoggingOut, setAutoLoggingOut] = useState(false);

  // Canlı arama önerileri (Autocomplete) durumları
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState<SearchIndexData | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  const currentFilter = searchParams.get('filtre') || '';

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // HomeFeedClient üzerinden filtre temizlendiğinde arama kutusunu da sıfırla
  useEffect(() => {
    const handleClear = () => setSearchQuery('');
    window.addEventListener('novaforum:clear-search', handleClear);
    return () => window.removeEventListener('novaforum:clear-search', handleClear);
  }, []);

  // Oturum Açık Kalma / Siteden Çıkış Tercihi Yönetimi (Admin ve tüm üyeler için geçerli)
  useEffect(() => {
    if (!user) return;

    const rawPref = localStorage.getItem('novaforum_session_pref');
    const savedPref: 'ask' | 'close' | 'keep' =
      rawPref === 'close' || rawPref === 'keep' || rawPref === 'ask'
        ? rawPref
        : 'ask';
    setSessionPref(savedPref);

    if (!rawPref) {
      localStorage.setItem('novaforum_session_pref', 'ask');
    }

    // Kullanıcının sekmeyi/tarayıcıyı kapatıp siteden ayrıldıktan sonra geri dönüp dönmediğini tespit et
    const hasActiveTab = sessionStorage.getItem('novaforum_active_tab') === '1';
    const lastActiveRaw = localStorage.getItem('novaforum_last_active_ts');
    const lastActiveTs = lastActiveRaw ? Number(lastActiveRaw) : 0;
    const now = Date.now();
    const timeSinceLastActive = lastActiveTs > 0 ? now - lastActiveTs : 0;

    // Sayfa yenileme (F5) mi yoksa yeni giriş / yeniden açılış mı kontrol et
    let isPageReload = false;
    try {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries && navEntries.length > 0 && navEntries[0].type === 'reload') {
        isPageReload = true;
      }
    } catch {
      // ignore
    }

    // Sekme kapatılıp yeniden açıldıysa veya siteden çıkılıp (>4 sn) tekrar girildiyse
    const leftSiteAndReturned =
      !hasActiveTab || (!isPageReload && timeSinceLastActive > 4000);

    // Eğer kullanıcı "Siteden Çıkınca Oturumu Kapat" ('close') seçtiyse ve siteden çıkıp tekrar girdiyse anında oturumu kapat
    if (leftSiteAndReturned && savedPref === 'close') {
      setAutoLoggingOut(true);
      sessionStorage.removeItem('novaforum_active_tab');
      fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
        keepalive: true,
      }).finally(() => {
        window.location.replace('/');
      });
      return;
    }

    sessionStorage.setItem('novaforum_active_tab', '1');
    localStorage.setItem('novaforum_last_active_ts', String(now));

    // Eğer siteden çıkıp geri döndüyse ve mod 'ask' ise "daha önce soruldu" bayrağını sıfırla ki tekrar sorsun
    if (leftSiteAndReturned && savedPref === 'ask') {
      sessionStorage.removeItem('novaforum_prompt_dismissed');
    }

    // Kullanıcı 'ask' (Çıkarken Sor) modundaysa ve bu sekmede henüz pencereyi kapatmadıysa doğrudan tercih penceresini aç
    if (
      savedPref === 'ask' &&
      sessionStorage.getItem('novaforum_prompt_dismissed') !== '1'
    ) {
      setExitPromptOpen(true);
    }

    // Sekme açık olduğu sürece her 1.5 saniyede bir aktiflik zaman damgasını güncelle
    const heartbeatTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        localStorage.setItem('novaforum_last_active_ts', String(Date.now()));
      }
    }, 1500);

    // Kullanıcı 'ask' (Çıkarken Sor) modundaysa sekmeyi kapatmaya çalıştığında uyar ve tercih penceresini aç
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentPref = localStorage.getItem('novaforum_session_pref') || 'ask';
      if (currentPref === 'ask') {
        setExitPromptOpen(true);
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Fare sayfa içerisindeyken sekme kapatma çubuğuna / adres çubuğuna (üst sınıra) çıktığında 'ask' modundaysa anında sor
    let armedForExit = true;
    let lastClientY = 200;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPref = localStorage.getItem('novaforum_session_pref') || 'ask';
      if (currentPref !== 'ask') return;

      if (e.clientY > 75) {
        armedForExit = true;
      } else if (
        armedForExit &&
        e.clientY <= 42 &&
        e.clientY < lastClientY
      ) {
        armedForExit = false;
        setExitPromptOpen(true);
      }
      lastClientY = e.clientY;
    };

    const handleMouseLeaveDocument = (e: MouseEvent) => {
      const currentPref = localStorage.getItem('novaforum_session_pref') || 'ask';
      if (currentPref !== 'ask') return;

      if (e.clientY <= 80) {
        armedForExit = false;
        setExitPromptOpen(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeaveDocument);
    document.documentElement.addEventListener('mouseleave', handleMouseLeaveDocument);

    return () => {
      window.clearInterval(heartbeatTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeaveDocument);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeaveDocument);
    };
  }, [user]);

  // Dışarı tıklandığında öneri penceresini kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktop =
        searchContainerRef.current &&
        searchContainerRef.current.contains(target);
      const inMobile =
        mobileSearchContainerRef.current &&
        mobileSearchContainerRef.current.contains(target);

      if (!inDesktop && !inMobile) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ctrl+K veya "/" ile arama kutusuna odaklanma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSuggestionsOpen(true);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSuggestionsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ensureSearchIndex = async () => {
    if (searchIndex || loadingIndex) return;
    setLoadingIndex(true);
    try {
      const res = await fetch('/api/search');
      if (res.ok) {
        const data = await res.json();
        setSearchIndex(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingIndex(false);
    }
  };

  // Kullanıcı yazdıkça eşleşen önerileri 0ms gecikmeyle hesapla
  const filteredResults = useMemo(() => {
    if (!searchIndex) {
      return {
        threads: [],
        categories: [],
        tags: [],
        news: [],
        users: [],
        flatList: [] as SuggestionItem[],
      };
    }

    const q = searchQuery.trim();
    const normQ = normalizeSearchText(q);

    const threads = !normQ
      ? searchIndex.threads.slice(0, 4)
      : searchIndex.threads
          .filter(
            (t) =>
              matchesSearch(t.title, normQ) ||
              matchesSearch(t.tags, normQ) ||
              matchesSearch(t.category.name, normQ) ||
              matchesSearch(t.excerpt, normQ) ||
              matchesSearch(t.author.displayName, normQ)
          )
          .slice(0, 5);

    const categories = !normQ
      ? []
      : searchIndex.categories
          .filter(
            (c) =>
              matchesSearch(c.name, normQ) ||
              matchesSearch(c.description, normQ)
          )
          .slice(0, 3);

    const tags = !normQ
      ? searchIndex.tags.slice(0, 6)
      : searchIndex.tags
          .filter((t) => matchesSearch(t.tag, normQ))
          .slice(0, 5);

    const news = !normQ
      ? []
      : searchIndex.news
          .filter(
            (n) =>
              matchesSearch(n.title, normQ) || matchesSearch(n.category, normQ)
          )
          .slice(0, 2);

    const users = !normQ
      ? []
      : searchIndex.users
          .filter(
            (u) =>
              matchesSearch(u.displayName, normQ) ||
              matchesSearch(u.username, normQ)
          )
          .slice(0, 3);

    const flatList: SuggestionItem[] = [
      ...threads.map((t) => ({
        id: `thread-${t.id}`,
        type: 'thread' as const,
        title: t.title,
        subtitle: `${t.category.name} • @${t.author.username} • ${t.commentCount} yanıt`,
        badge: t.category.name,
        badgeColor: t.category.color,
        isSolved: t.isSolved,
        href: `/konu/${t.slug}`,
        fillText: t.title,
      })),
      ...categories.map((c) => ({
        id: `cat-${c.id}`,
        type: 'category' as const,
        title: c.name,
        subtitle: `${c._count.threads} konu • Kategoriye filtrele`,
        badge: 'Kategori',
        badgeColor: c.color,
        href: `/?kategori=${c.slug}`,
        fillText: c.name,
        filterAction: { kategori: c.slug, q: '', etiket: '' },
      })),
      ...tags.map((t) => ({
        id: `tag-${t.tag}`,
        type: 'tag' as const,
        title: `#${t.tag}`,
        subtitle: `${t.count} konuda kullanıldı`,
        href: `/?etiket=${encodeURIComponent(t.tag)}`,
        fillText: t.tag,
        filterAction: { etiket: t.tag, q: '', kategori: '' },
      })),
      ...news.map((n) => ({
        id: `news-${n.id}`,
        type: 'news' as const,
        title: n.title,
        subtitle: `${n.category} • ${n.readTime}`,
        badge: n.category,
        badgeColor: n.badgeColor,
        href: `/haberler/${n.slug}`,
        fillText: n.title,
      })),
      ...users.map((u) => ({
        id: `user-${u.id}`,
        type: 'user' as const,
        title: u.displayName,
        subtitle: `@${u.username} • ${u.reputation}p itibar`,
        badgeColor: u.avatarColor,
        href: `/kullanici/${u.username}`,
        fillText: u.username,
      })),
    ];

    return { threads, categories, tags, news, users, flatList };
  }, [searchIndex, searchQuery]);

  // Satır içi otomatik tamamlama ipucu (inline ghost text / hızlı tamamlama kelimesi)
  const autoCompleteHint = useMemo(() => {
    const q = searchQuery.trim();
    if (!q || !searchIndex) return '';
    const normQ = normalizeSearchText(q);
    // Önce etiketlerde önekle başlayan var mı bak
    const tagMatch = searchIndex.tags.find((t) =>
      normalizeSearchText(t.tag).startsWith(normQ)
    );
    if (tagMatch && tagMatch.tag.toLowerCase() !== q.toLowerCase()) {
      return tagMatch.tag;
    }
    // Kategori adlarında başlayan var mı bak
    const catMatch = searchIndex.categories.find((c) =>
      normalizeSearchText(c.name).startsWith(normQ)
    );
    if (catMatch && catMatch.name.toLowerCase() !== q.toLowerCase()) {
      return catMatch.name;
    }
    return '';
  }, [searchQuery, searchIndex]);

  const handleInputChange = (val: string) => {
    setSearchQuery(val);
    setActiveIndex(-1);
    setSuggestionsOpen(true);
    ensureSearchIndex();

    // Ana sayfadaysak yazdıkça konuları anında filtrele
    if (pathname === '/') {
      window.dispatchEvent(
        new CustomEvent('novaforum:search', { detail: { q: val.trim() } })
      );
    }
  };

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setSuggestionsOpen(false);
    setMobileSearchOpen(false);

    if (item.filterAction && pathname === '/') {
      if (item.filterAction.q !== undefined) {
        setSearchQuery(item.filterAction.q);
      }
      window.dispatchEvent(
        new CustomEvent('novaforum:search', { detail: item.filterAction })
      );
      router.push(item.href);
      return;
    }

    router.push(item.href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      activeIndex >= 0 &&
      activeIndex < filteredResults.flatList.length
    ) {
      handleSelectSuggestion(filteredResults.flatList[activeIndex]);
      return;
    }

    const trimmed = searchQuery.trim();
    setSuggestionsOpen(false);
    setMobileSearchOpen(false);

    if (pathname === '/') {
      window.dispatchEvent(
        new CustomEvent('novaforum:search', { detail: { q: trimmed } })
      );
    }

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : '/');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = filteredResults.flatList.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionsOpen(true);
      if (total > 0) {
        setActiveIndex((prev) => (prev + 1) % total);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (total > 0) {
        setActiveIndex((prev) => (prev <= 0 ? total - 1 : prev - 1));
      }
    } else if (e.key === 'Tab') {
      if (activeIndex >= 0 && activeIndex < total) {
        e.preventDefault();
        const fill = filteredResults.flatList[activeIndex].fillText;
        handleInputChange(fill);
      } else if (autoCompleteHint) {
        e.preventDefault();
        handleInputChange(autoCompleteHint);
      }
    } else if (e.key === 'Escape') {
      setSuggestionsOpen(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveIndex(-1);
    if (pathname === '/') {
      window.dispatchEvent(
        new CustomEvent('novaforum:search', { detail: { q: '' } })
      );
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : '/');
    searchInputRef.current?.focus();
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('novaforum_active_tab');
    sessionStorage.removeItem('novaforum_exit_asked');
    sessionStorage.removeItem('novaforum_prompt_dismissed');
    localStorage.removeItem('novaforum_session_decided');
    localStorage.removeItem('novaforum_last_active_ts');
    await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
    setMenuOpen(false);
    setExitPromptOpen(false);
    window.location.replace('/');
  };

  const handleDismissExitPrompt = () => {
    sessionStorage.setItem('novaforum_prompt_dismissed', '1');
    setExitPromptOpen(false);
  };

  const handleSaveSessionPref = async (pref: 'ask' | 'close' | 'keep') => {
    setSessionPref(pref);
    localStorage.setItem('novaforum_session_pref', pref);
    if (pref === 'keep' || pref === 'close') {
      localStorage.setItem('novaforum_session_decided', '1');
    } else {
      localStorage.removeItem('novaforum_session_decided');
    }
    localStorage.setItem('novaforum_last_active_ts', String(Date.now()));
    sessionStorage.setItem('novaforum_active_tab', '1');
    sessionStorage.setItem('novaforum_prompt_dismissed', '1');
    setExitPromptOpen(false);
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rememberMe: pref === 'keep' }),
      });
    } catch {
      // ignore network error
    }
  };

  const renderSuggestionsDropdown = () => {
    const trimmed = searchQuery.trim();
    if (!suggestionsOpen || !trimmed) return null;

    const { flatList } = filteredResults;

    return (
      <div className="absolute left-0 right-0 sm:min-w-[440px] top-full mt-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl shadow-black/40 overflow-hidden z-50">
        {/* Varsa Kelime Tamamlama Önerisi */}
        {autoCompleteHint && (
          <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-300">
              Bunu mu demek istediniz?
            </span>
            <button
              type="button"
              onClick={() => handleInputChange(autoCompleteHint)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
            >
              {autoCompleteHint}
              <span className="text-[10px] opacity-80 font-normal">(Tab)</span>
            </button>
          </div>
        )}

        {/* Öneri Listesi */}
        {loadingIndex && !searchIndex ? (
          <div className="p-5 text-center text-xs text-slate-400">
            Aranıyor...
          </div>
        ) : flatList.length === 0 ? (
          <div className="p-5 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              &ldquo;{trimmed}&rdquo; için eşleşen sonuç bulunamadı
            </p>
            <p className="text-[11px] text-slate-400">
              Farklı bir kelime deneyebilir veya Enter tuşuna basabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70 max-h-[360px] overflow-y-auto custom-scrollbar">
            {flatList.slice(0, 7).map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelectSuggestion(item)}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/60'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {item.type === 'thread' && (
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      {item.type === 'category' && (
                        <Layers
                          className="w-3.5 h-3.5"
                          style={{ color: item.badgeColor || '#6366f1' }}
                        />
                      )}
                      {item.type === 'tag' && (
                        <Tag className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      {item.type === 'news' && (
                        <Newspaper className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      {item.type === 'user' && (
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                          style={{
                            backgroundColor: item.badgeColor || '#6366f1',
                          }}
                        >
                          {item.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </span>
                        {item.isSolved && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Alt Bar: Tüm Sonuçları Forumda Filtrele */}
        <button
          type="button"
          onClick={handleSearch}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-colors"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Search className="w-3.5 h-3.5 shrink-0" />
            &ldquo;{trimmed}&rdquo; için tüm sonuçları listele
          </span>
          <CornerDownLeft className="w-3.5 h-3.5 shrink-0 opacity-70" />
        </button>
      </div>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Sol: Dinamik Site Logosu & Başlığı */}
          <Link href="/" prefetch={true} className="shrink-0">
            <BrandLogo settings={siteSettings} size="md" showTagline={true} />
          </Link>

          {/* Orta: Geniş ve Ferah Arama Çubuğu */}
          <div
            ref={searchContainerRef}
            className="flex-1 max-w-lg hidden sm:block relative"
          >
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  autoComplete="off"
                  value={searchQuery}
                  onFocus={() => {
                    setSuggestionsOpen(true);
                    ensureSearchIndex();
                  }}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Konu, etiket veya içerik ara..."
                  className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Canlı Öneri Açılır Menüsü */}
            {renderSuggestionsDropdown()}
          </div>

          {/* Sağ Aksiyonlar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !mobileSearchOpen;
                setMobileSearchOpen(next);
                if (next) {
                  setSuggestionsOpen(true);
                  ensureSearchIndex();
                }
              }}
              title="Ara"
              className="sm:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            <Link
              href="/haberler"
              prefetch={true}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Teknoloji Gündemi</span>
            </Link>

            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setExitPromptOpen(true)}
                  title="Siteden Çıkarken Oturum Tercihi"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${
                    sessionPref === 'close'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                      : sessionPref === 'keep'
                      ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">
                    {sessionPref === 'close'
                      ? 'Çıkınca Kapat'
                      : sessionPref === 'keep'
                      ? 'Oturum Açık'
                      : 'Çıkarken Sor'}
                  </span>
                </button>

                <NotificationBell />

                <Link
                  href="/yeni-konu"
                  prefetch={true}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Yeni Konu</span>
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                  >
                    <UserAvatar
                      name={user.displayName}
                      avatar={user.avatarColor}
                      className="w-7 h-7 rounded-lg text-xs font-semibold"
                    />
                    <div className="hidden lg:flex flex-col items-start text-left">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                        {user.displayName}
                      </span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-0.5 mt-0.5">
                        <Award className="w-2.5 h-2.5" /> {user.reputation}p
                      </span>
                    </div>
                  </button>

                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-2 z-20">
                        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {user.displayName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            @{user.username}
                          </p>
                        </div>
                        <Link
                          href={`/kullanici/${user.username}`}
                          prefetch={true}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          Profilim & Rozetler
                        </Link>
                        {user.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            prefetch={true}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            Yönetim Paneli
                          </Link>
                        )}
                        <Link
                          href="/?filtre=kaydedilenler"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-slate-400" />
                          Kaydedilen Konular
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setExitPromptOpen(true);
                          }}
                          className="w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <Lock className="w-4 h-4 text-slate-400" />
                            Oturum Tercihi
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                            {sessionPref === 'keep'
                              ? 'Açık Tut'
                              : sessionPref === 'close'
                              ? 'Çıkınca Kapat'
                              : 'Çıkarken Sor'}
                          </span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Çıkış Yap
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/giris"
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Giriş
                </Link>
                <Link
                  href="/kayit"
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 transition-all"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobil Arama Çekmecesi */}
        {mobileSearchOpen && (
          <div
            ref={mobileSearchContainerRef}
            className="sm:hidden px-3 pb-3 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] relative"
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                autoComplete="off"
                value={searchQuery}
                onFocus={() => {
                  setSuggestionsOpen(true);
                  ensureSearchIndex();
                }}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Konu, etiket veya içerik ara..."
                className="w-full pl-10 pr-8 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
            {renderSuggestionsDropdown()}
          </div>
        )}
      </header>

      {/* Mobil Alt Navigasyon Çubuğu (Uygulama Deneyimi) */}
      <nav
        aria-label="Mobil Alt Menü"
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 h-15 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800/90 px-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      >
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors ${
            pathname === '/'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Forum</span>
        </Link>

        <Link
          href="/haberler"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors ${
            pathname.startsWith('/haberler')
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Gündem</span>
        </Link>

        <Link
          href={user ? '/yeni-konu' : '/giris'}
          className="flex flex-col items-center justify-center -mt-4"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 border-2 border-white dark:border-[#0b0f19]">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            Yeni Konu
          </span>
        </Link>

        <Link
          href="/kurallar"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors ${
            pathname.startsWith('/kurallar') || pathname.startsWith('/gizlilik')
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Kurallar</span>
        </Link>

        {user ? (
          <Link
            href={user.role === 'ADMIN' ? '/admin' : `/kullanici/${user.username}`}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors ${
              pathname.startsWith('/kullanici') || pathname.startsWith('/admin')
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {user.role === 'ADMIN' ? (
              <>
                <Shield className="w-4 h-4" />
                <span>Yönetim</span>
              </>
            ) : (
              <>
                <UserIcon className="w-4 h-4" />
                <span>Profilim</span>
              </>
            )}
          </Link>
        ) : (
          <Link
            href="/giris"
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors ${
              pathname.startsWith('/giris')
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Giriş</span>
          </Link>
        )}
      </nav>

      {/* Otomatik Güvenli Çıkış Ekranı ('close' modunda sekme kapatılıp tekrar girildiğinde) */}
      {autoLoggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-center space-y-2 shadow-2xl">
            <Shield className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
            <p className="text-sm font-bold text-white">
              Tercihiniz doğrultusunda önceki açık oturumunuz güvenli şekilde kapatılıyor...
            </p>
          </div>
        </div>
      )}

      {/* Siteden Ayrılırken Oturum Tercihi Modalı */}
      {user && exitPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Siteden Ayrılırken Oturum Tercihiniz
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sekmeyi veya tarayıcıyı kapattığınızda hesabınız nasıl davransın?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissExitPrompt}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleSaveSessionPref('close')}
                className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  sessionPref === 'close'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Siteden Çıktığımda Oturumu Otomatik Kapat
                    </span>
                    {sessionPref === 'close' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shrink-0">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Sekmeyi kapattığınızda oturumunuz otomatik sonlandırılır. Ortak veya okul bilgisayarları için en güvenli seçenektir.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSaveSessionPref('keep')}
                className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  sessionPref === 'keep'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Bu Cihazda Oturumu Açık Tut (Beni Hatırla)
                    </span>
                    {sessionPref === 'keep' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shrink-0">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Kendi kişisel telefonunuz veya bilgisayarınızsa 30 gün boyunca tekrar şifre girmeden hesabınız açık kalır.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSaveSessionPref('ask')}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  sessionPref === 'ask'
                    ? 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="text-xs font-semibold">
                  Siteden çıkarken bana sormaya devam et
                </span>
                {sessionPref === 'ask' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                    Varsayılan
                  </span>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Şimdi Oturumu Kapat
              </button>
              <button
                type="button"
                onClick={handleDismissExitPrompt}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Gezinmeye Devam Et
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

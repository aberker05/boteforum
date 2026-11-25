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
  Keyboard,
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
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [gChordActive, setGChordActive] = useState(false);

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

    // Sadece kullanıcı siteden çıkmak üzere fareyi sayfa dışına (tarayıcı sekme kapatma çubuğuna) götürdüğünde sor
    let armedForExit = false;
    let lastClientY = 200;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPref = localStorage.getItem('novaforum_session_pref') || 'ask';
      if (currentPref !== 'ask') return;
      if (sessionStorage.getItem('novaforum_prompt_dismissed') === '1') return;

      if (e.clientY > 100) {
        armedForExit = true;
      } else if (
        armedForExit &&
        e.clientY <= 6 &&
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
      if (sessionStorage.getItem('novaforum_prompt_dismissed') === '1') return;

      if (armedForExit && e.clientY <= 12) {
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

  // Global Klavye Kısayolları Motoru (Linear & GitHub Discussions Standardı)
  useEffect(() => {
    let chordTimer: number | undefined;
    let awaitingGoto = false;

    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
      );
    };

    const focusGlobalSearch = () => {
      ensureSearchIndex();
      setSuggestionsOpen(true);
      if (window.innerWidth < 640) {
        setMobileSearchOpen(true);
      } else {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K: Her yerden hızlı arama
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShortcutsModalOpen(false);
        focusGlobalSearch();
        return;
      }

      // Escape: Açık pencereleri kapat veya aktif input odağını kaldır
      if (e.key === 'Escape') {
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
          return;
        }
        if (suggestionsOpen) {
          setSuggestionsOpen(false);
          return;
        }
        if (menuOpen) {
          setMenuOpen(false);
          return;
        }
        if (exitPromptOpen) {
          setExitPromptOpen(false);
          return;
        }
        if (awaitingGoto) {
          awaitingGoto = false;
          setGChordActive(false);
          return;
        }
        if (document.activeElement instanceof HTMLElement && isEditable(document.activeElement)) {
          document.activeElement.blur();
        }
        return;
      }

      // Kullanıcı bir metin kutusunda yazıyorsa tek tuşlu kısayolları çalıştırma
      if (isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();

      // '?' tuşu: Kısayol rehberi modalını aç/kapat
      if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 'g' ardından ikinci tuş (Go-To Chords: g+h, g+g, g+d, g+k, g+p, g+s, g+a)
      if (awaitingGoto) {
        awaitingGoto = false;
        setGChordActive(false);
        if (chordTimer) window.clearTimeout(chordTimer);

        if (key === 'h') {
          e.preventDefault();
          router.push('/');
          return;
        }
        if (key === 'g' || key === 'n') {
          e.preventDefault();
          router.push('/haberler');
          return;
        }
        if (key === 'd') {
          e.preventDefault();
          router.push('/destek');
          return;
        }
        if (key === 'k') {
          e.preventDefault();
          router.push('/kurallar');
          return;
        }
        if (key === 's' && user) {
          e.preventDefault();
          router.push('/?filtre=kaydedilenler');
          return;
        }
        if (key === 'p' && user) {
          e.preventDefault();
          router.push(`/kullanici/${user.username}`);
          return;
        }
        if (key === 'a' && user?.role === 'ADMIN') {
          e.preventDefault();
          router.push('/admin');
          return;
        }
      }

      if (key === 'g' && !e.shiftKey) {
        awaitingGoto = true;
        setGChordActive(true);
        if (chordTimer) window.clearTimeout(chordTimer);
        chordTimer = window.setTimeout(() => {
          awaitingGoto = false;
          setGChordActive(false);
        }, 1400);
        return;
      }

      // '/' tuşu: Arama kutusuna odaklan
      if (e.key === '/') {
        e.preventDefault();
        focusGlobalSearch();
        return;
      }

      // 'c' veya 'n': Yeni Konu Başlat
      if ((key === 'c' || key === 'n') && !e.shiftKey) {
        e.preventDefault();
        router.push(user ? '/yeni-konu' : '/giris');
        return;
      }

      // 'r': Konu detay sayfasındayken yanıt kutusuna in ve odaklan
      if (key === 'r' && !e.shiftKey && pathname.startsWith('/konu/')) {
        const formEl = document.getElementById('yeni-yorum-formu');
        if (formEl) {
          e.preventDefault();
          formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const ta = formEl.querySelector('textarea');
          if (ta) {
            window.setTimeout(() => ta.focus(), 120);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (chordTimer) window.clearTimeout(chordTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    router,
    user,
    pathname,
    shortcutsModalOpen,
    suggestionsOpen,
    menuOpen,
    exitPromptOpen,
  ]);

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
      <div className="absolute left-0 right-0 sm:min-w-[440px] top-full mt-1.5 rounded-md border border-[#232730] bg-[#15181E] overflow-hidden z-50">
        {/* Varsa Kelime Tamamlama Önerisi */}
        {autoCompleteHint && (
          <div className="px-3.5 py-2 bg-[#10B981]/10 border-b border-[#232730] flex items-center justify-between gap-2 text-xs font-mono">
            <span className="text-[#8B949E]">
              Tamamla:
            </span>
            <button
              type="button"
              onClick={() => handleInputChange(autoCompleteHint)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#10B981] text-[#0D0F12] font-semibold hover:bg-[#059669] transition-colors cursor-pointer"
            >
              {autoCompleteHint}
              <span className="text-[10px] opacity-80 font-normal">[Tab]</span>
            </button>
          </div>
        )}

        {/* Öneri Listesi */}
        {loadingIndex && !searchIndex ? (
          <div className="p-4 text-center text-xs font-mono text-[#8B949E]">
            İndeks taranıyor...
          </div>
        ) : flatList.length === 0 ? (
          <div className="p-4 text-center space-y-1">
            <p className="text-xs font-mono font-semibold text-[#E6EDF3]">
              &ldquo;{trimmed}&rdquo; için eşleşen kayıt bulunamadı
            </p>
            <p className="text-[11px] text-[#8B949E]">
              Farklı bir anahtar kelime deneyin veya Enter tuşuna basın.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#232730] max-h-[360px] overflow-y-auto custom-scrollbar">
            {flatList.slice(0, 7).map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelectSuggestion(item)}
                  className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#10B981]/15'
                      : 'hover:bg-[#0D0F12]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-md bg-[#0D0F12] border border-[#232730] flex items-center justify-center shrink-0">
                      {item.type === 'thread' && (
                        <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" />
                      )}
                      {item.type === 'category' && (
                        <Layers
                          className="w-3.5 h-3.5"
                          style={{ color: item.badgeColor || '#10B981' }}
                        />
                      )}
                      {item.type === 'tag' && (
                        <Tag className="w-3.5 h-3.5 text-[#10B981]" />
                      )}
                      {item.type === 'news' && (
                        <Newspaper className="w-3.5 h-3.5 text-[#F59E0B]" />
                      )}
                      {item.type === 'user' && (
                        <div
                          className="w-5 h-5 rounded-sm flex items-center justify-center text-[#0D0F12] text-[10px] font-mono font-bold"
                          style={{
                            backgroundColor: item.badgeColor || '#10B981',
                          }}
                        >
                          {item.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-semibold text-[#E6EDF3] truncate">
                          {item.title}
                        </span>
                        {item.isSolved && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] font-mono text-[#8B949E] truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-[#8B949E] shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Alt Bar: Tüm Sonuçları Forumda Filtrele */}
        <button
          type="button"
          onClick={handleSearch}
          className="w-full px-3.5 py-2 bg-[#0D0F12] hover:bg-[#10B981]/10 border-t border-[#232730] flex items-center justify-between text-xs font-mono font-semibold text-[#10B981] transition-colors cursor-pointer"
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
      <header className="sticky top-0 z-40 w-full border-b border-[#232730] bg-[#0D0F12]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2 sm:gap-4">
          {/* Sol: Dinamik Site Logosu & Başlığı */}
          <Link href="/" prefetch={true} className="shrink-0">
            <BrandLogo settings={siteSettings} size="md" showTagline={true} />
          </Link>

          {/* Orta: Arama Çubuğu */}
          <div
            ref={searchContainerRef}
            className="flex-1 max-w-lg hidden sm:block relative"
          >
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8B949E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  placeholder="Konu, #etiket veya içerik ara... [ / ]"
                  className="w-full pl-9 pr-8 py-1.5 rounded-md text-xs sm:text-sm font-mono bg-[#15181E] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#E6EDF3]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

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
              className="sm:hidden p-2 rounded-md border border-[#232730] bg-[#15181E] text-[#8B949E] hover:text-[#E6EDF3] transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            <Link
              href="/haberler"
              prefetch={true}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-medium border border-[#232730] bg-[#15181E] text-[#E6EDF3] hover:border-[#10B981]/60 hover:text-[#10B981] transition-colors"
            >
              <Newspaper className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="hidden md:inline">Gündem</span>
            </Link>

            <button
              type="button"
              onClick={() => setShortcutsModalOpen(true)}
              title="Klavye Kısayolları Rehberi [ ? ]"
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-mono font-semibold border border-[#232730] bg-[#15181E] text-[#8B949E] hover:border-[#10B981]/60 hover:text-[#10B981] transition-colors cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="text-[11px]">?</span>
            </button>

            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setExitPromptOpen(true)}
                  title="Siteden Çıkarken Oturum Tercihi"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono font-medium border transition-colors cursor-pointer ${
                    sessionPref === 'close'
                      ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
                      : sessionPref === 'keep'
                      ? 'border-[#232730] bg-[#15181E] text-[#E6EDF3] hover:border-[#10B981]/50'
                      : 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20'
                  }`}
                >
                  <Lock className="w-3 h-3 shrink-0" />
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
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Yeni Konu</span>
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-md border border-[#232730] bg-[#15181E] hover:border-[#10B981]/50 transition-colors cursor-pointer"
                  >
                    <UserAvatar
                      name={user.displayName}
                      avatar={user.avatarColor}
                      className="w-6 h-6 rounded-sm text-xs font-semibold"
                    />
                    <div className="hidden lg:flex flex-col items-start text-left">
                      <span className="text-xs font-semibold text-[#E6EDF3] leading-none">
                        {user.displayName}
                      </span>
                      <span className="text-[10px] font-mono text-[#F59E0B] font-medium flex items-center gap-0.5 mt-0.5">
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
                      <div className="absolute right-0 mt-1.5 w-56 rounded-md border border-[#232730] bg-[#15181E] py-1.5 z-20">
                        <div className="px-3.5 py-2 border-b border-[#232730]">
                          <p className="text-xs font-bold text-[#E6EDF3] truncate">
                            {user.displayName}
                          </p>
                          <p className="text-[11px] font-mono text-[#8B949E] truncate">
                            @{user.username}
                          </p>
                        </div>
                        <Link
                          href={`/kullanici/${user.username}`}
                          prefetch={true}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-[#8B949E]" />
                          Profilim & Rozetler
                        </Link>
                        {user.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            prefetch={true}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#10B981] hover:bg-[#0D0F12] transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Yönetim Paneli
                          </Link>
                        )}
                        <Link
                          href="/?filtre=kaydedilenler"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-[#8B949E]" />
                          Kaydedilen Konular
                        </Link>
                        <Link
                          href="/destek"
                          prefetch={true}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-[#10B981]" />
                          Destek & Talep Merkezi
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setExitPromptOpen(true);
                          }}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <Lock className="w-3.5 h-3.5 text-[#8B949E]" />
                            Oturum Tercihi
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#10B981]">
                            {sessionPref === 'keep'
                              ? 'Açık Tut'
                              : sessionPref === 'close'
                              ? 'Çıkınca Kapat'
                              : 'Çıkarken Sor'}
                          </span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-400 hover:bg-[#0D0F12] transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Çıkış Yap
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/giris"
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-[#E6EDF3] border border-[#232730] bg-[#15181E] hover:border-[#10B981]/50 transition-colors"
                >
                  Giriş
                </Link>
                <Link
                  href="/kayit"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] transition-colors"
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
            className="sm:hidden px-3 pb-2.5 pt-1.5 border-t border-[#232730] bg-[#0D0F12] relative"
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="w-3.5 h-3.5 text-[#8B949E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                placeholder="Konu, #etiket veya içerik ara..."
                className="w-full pl-9 pr-8 py-1.5 rounded-md text-xs font-mono bg-[#15181E] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#E6EDF3]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
            {renderSuggestionsDropdown()}
          </div>
        )}
      </header>

      {/* Mobil Alt Navigasyon Çubuğu */}
      <nav
        aria-label="Mobil Alt Menü"
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-[#0D0F12]/95 backdrop-blur-md border-t border-[#232730] px-2 flex items-center justify-around font-mono"
      >
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-md text-[10px] font-semibold transition-colors ${
            pathname === '/' ? 'text-[#10B981]' : 'text-[#8B949E]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Forum</span>
        </Link>

        <Link
          href="/haberler"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-md text-[10px] font-semibold transition-colors ${
            pathname.startsWith('/haberler')
              ? 'text-[#10B981]'
              : 'text-[#8B949E]'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Gündem</span>
        </Link>

        <Link
          href={user ? '/yeni-konu' : '/giris'}
          className="flex flex-col items-center justify-center -mt-3"
        >
          <div className="w-10 h-10 rounded-md bg-[#10B981] text-[#0D0F12] flex items-center justify-center border border-[#232730]">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold text-[#10B981] mt-0.5">
            Yeni Konu
          </span>
        </Link>

        <Link
          href="/kurallar"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-md text-[10px] font-semibold transition-colors ${
            pathname.startsWith('/kurallar') || pathname.startsWith('/gizlilik')
              ? 'text-[#10B981]'
              : 'text-[#8B949E]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Kurallar</span>
        </Link>

        {user ? (
          <Link
            href={user.role === 'ADMIN' ? '/admin' : `/kullanici/${user.username}`}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-md text-[10px] font-semibold transition-colors ${
              pathname.startsWith('/kullanici') || pathname.startsWith('/admin')
                ? 'text-[#10B981]'
                : 'text-[#8B949E]'
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
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-md text-[10px] font-semibold transition-colors ${
              pathname.startsWith('/giris')
                ? 'text-[#10B981]'
                : 'text-[#8B949E]'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Giriş</span>
          </Link>
        )}
      </nav>

      {/* Otomatik Güvenli Çıkış Ekranı */}
      {autoLoggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0F12]/90 backdrop-blur-md">
          <div className="rounded-md border border-[#232730] bg-[#15181E] px-6 py-5 text-center space-y-2">
            <Shield className="w-8 h-8 text-[#10B981] mx-auto animate-pulse" />
            <p className="text-sm font-bold text-[#E6EDF3]">
              Tercihiniz doğrultusunda önceki açık oturumunuz güvenli şekilde kapatılıyor...
            </p>
          </div>
        </div>
      )}

      {/* Siteden Ayrılırken Oturum Tercihi Modalı */}
      {user && exitPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-md border border-[#232730] bg-[#15181E] p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#0D0F12] border border-[#232730] flex items-center justify-center text-[#10B981] shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#E6EDF3]">
                    Siteden Ayrılırken Oturum Tercihiniz
                  </h3>
                  <p className="text-xs text-[#8B949E]">
                    Sekmeyi veya tarayıcıyı kapattığınızda hesabınız nasıl davransın?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissExitPrompt}
                className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSaveSessionPref('close')}
                className={`w-full p-3 rounded-md border text-left transition-colors cursor-pointer flex items-start gap-3 ${
                  sessionPref === 'close'
                    ? 'border-[#10B981] bg-[#10B981]/10'
                    : 'border-[#232730] bg-[#0D0F12] hover:border-[#10B981]/50'
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-[#15181E] border border-[#232730] text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#E6EDF3]">
                      Siteden Çıktığımda Oturumu Otomatik Kapat
                    </span>
                    {sessionPref === 'close' && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-[#10B981] text-[#0D0F12] shrink-0">
                        AKTİF
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8B949E] mt-0.5 leading-relaxed">
                    Sekmeyi kapattığınızda oturumunuz otomatik sonlandırılır. Ortak veya okul bilgisayarları için en güvenli seçenektir.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSaveSessionPref('keep')}
                className={`w-full p-3 rounded-md border text-left transition-colors cursor-pointer flex items-start gap-3 ${
                  sessionPref === 'keep'
                    ? 'border-[#10B981] bg-[#10B981]/10'
                    : 'border-[#232730] bg-[#0D0F12] hover:border-[#10B981]/50'
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-[#15181E] border border-[#232730] text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#E6EDF3]">
                      Bu Cihazda Oturumu Açık Tut (Beni Hatırla)
                    </span>
                    {sessionPref === 'keep' && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-[#10B981] text-[#0D0F12] shrink-0">
                        AKTİF
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8B949E] mt-0.5 leading-relaxed">
                    Kendi kişisel telefonunuz veya bilgisayarınızsa 30 gün boyunca tekrar şifre girmeden hesabınız açık kalır.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSaveSessionPref('ask')}
                className={`w-full px-3 py-2 rounded-md border text-left transition-colors cursor-pointer flex items-center justify-between ${
                  sessionPref === 'ask'
                    ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]'
                    : 'border-[#232730] bg-[#0D0F12] text-[#8B949E] hover:text-[#E6EDF3]'
                }`}
              >
                <span className="text-xs font-semibold">
                  Siteden çıkarken bana sormaya devam et
                </span>
                {sessionPref === 'ask' && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-[#F59E0B] text-[#0D0F12]">
                    VARSAYILAN
                  </span>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-[#232730] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Şimdi Oturumu Kapat
              </button>
              <button
                type="button"
                onClick={handleDismissExitPrompt}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#0D0F12] border border-[#232730] text-[#E6EDF3] hover:border-[#10B981]/50 transition-colors cursor-pointer"
              >
                Gezinmeye Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 'g' Hızlı Geçiş Tuş Dizisi Göstergesi (Sağ Alt Köşe) */}
      {gChordActive && (
        <div className="fixed bottom-5 right-5 z-50 rounded-md border border-[#10B981]/60 bg-[#15181E] px-3.5 py-2.5 font-mono text-xs text-[#E6EDF3] space-y-1.5">
          <div className="flex items-center gap-2 text-[#10B981] font-bold">
            <kbd className="px-1.5 py-0.5 rounded-sm bg-[#0D0F12] border border-[#232730] text-[#10B981]">
              g
            </kbd>
            <span>+ hedef tuşa basın...</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8B949E]">
            <span><strong className="text-[#E6EDF3]">h</strong> Forum</span>
            <span>•</span>
            <span><strong className="text-[#E6EDF3]">g</strong> Gündem</span>
            <span>•</span>
            <span><strong className="text-[#E6EDF3]">d</strong> Destek</span>
            <span>•</span>
            <span><strong className="text-[#E6EDF3]">k</strong> Kurallar</span>
            {user && (
              <>
                <span>•</span>
                <span><strong className="text-[#E6EDF3]">p</strong> Profil</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Klavye Kısayolları Rehberi Modalı ('?' Tuşu veya Üst Menü Butonu) */}
      {shortcutsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={() => setShortcutsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md border border-[#232730] bg-[#15181E] p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#232730]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#0D0F12] border border-[#232730] text-[#10B981] flex items-center justify-center">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#E6EDF3]">
                    Klavye Kısayolları Rehberi
                  </h2>
                  <p className="text-[11px] font-mono text-[#8B949E]">
                    Fare kullanmadan forumda hızlı gezinme, filtreleme ve içerik üretimi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShortcutsModalOpen(false)}
                className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* 1. Genel & Sayfalar Arası Gezinme */}
              <div className="rounded-md border border-[#232730] bg-[#0D0F12] p-3.5 space-y-2.5">
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#10B981]">
                  01 // GENEL &amp; HIZLI GEZİNME
                </h3>
                <div className="space-y-2">
                  {[
                    { keys: ['Ctrl', 'K'], alt: '/', label: 'Hızlı Arama Çubuğuna Odaklan' },
                    { keys: ['c'], alt: 'n', label: 'Yeni Konu Başlat' },
                    { keys: ['?'], label: 'Kısayol Rehberini Aç / Kapat' },
                    { keys: ['Esc'], label: 'Pencereyi Kapat / Odağı Bırak' },
                    { keys: ['g', 'h'], label: 'Ana Sayfa (Forum Akışı)' },
                    { keys: ['g', 'g'], label: 'Teknoloji Gündemi & Radar' },
                    { keys: ['g', 'd'], label: 'Destek, Talep & Şikayet' },
                    { keys: ['g', 'k'], label: 'Topluluk Kuralları' },
                    ...(user
                      ? [
                          { keys: ['g', 'p'], label: 'Profilim & Rozetlerim' },
                          { keys: ['g', 's'], label: 'Kaydedilen Konular' },
                        ]
                      : []),
                    ...(user?.role === 'ADMIN'
                      ? [{ keys: ['g', 'a'], label: 'Yönetim Paneli (/admin)' }]
                      : []),
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-2 text-[#E6EDF3]"
                    >
                      <span className="text-[#8B949E]">{item.label}</span>
                      <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                        {item.keys.map((k, idx) => (
                          <React.Fragment key={k}>
                            {idx > 0 && <span className="text-[#8B949E]">+</span>}
                            <kbd className="px-1.5 py-0.5 rounded-sm bg-[#15181E] border border-[#232730] text-[#E6EDF3] font-semibold">
                              {k}
                            </kbd>
                          </React.Fragment>
                        ))}
                        {'alt' in item && item.alt && (
                          <>
                            <span className="text-[#8B949E] text-[10px]">veya</span>
                            <kbd className="px-1.5 py-0.5 rounded-sm bg-[#15181E] border border-[#232730] text-[#10B981] font-semibold">
                              {item.alt}
                            </kbd>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Akış & Editör Kısayolları */}
              <div className="space-y-4">
                <div className="rounded-md border border-[#232730] bg-[#0D0F12] p-3.5 space-y-2.5">
                  <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#F59E0B]">
                    02 // TARTIŞMA AKIŞI &amp; KONU İÇİ
                  </h3>
                  <div className="space-y-2">
                    {[
                      { keys: ['j'], alt: 'k', label: 'Sonraki / Önceki Konuya Geç' },
                      { keys: ['Enter'], alt: 'o', label: 'Seçili Konuyu Aç' },
                      { keys: ['1'], alt: '2 / 3', label: 'Tümü / Cevapsız / Çözülen' },
                      { keys: ['v'], label: 'Kart / Kompakt Tablo Görünümü' },
                      { keys: ['x'], label: 'Aktif Filtreleri Sıfırla' },
                      { keys: ['r'], label: 'Konu İçinde Yanıt Kutusuna İn' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-2 text-[#E6EDF3]"
                      >
                        <span className="text-[#8B949E]">{item.label}</span>
                        <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                          {item.keys.map((k) => (
                            <kbd
                              key={k}
                              className="px-1.5 py-0.5 rounded-sm bg-[#15181E] border border-[#232730] text-[#E6EDF3] font-semibold"
                            >
                              {k}
                            </kbd>
                          ))}
                          {item.alt && (
                            <>
                              <span className="text-[#8B949E] text-[10px]">/</span>
                              <kbd className="px-1.5 py-0.5 rounded-sm bg-[#15181E] border border-[#232730] text-[#F59E0B] font-semibold">
                                {item.alt}
                              </kbd>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-[#232730] bg-[#0D0F12] p-3.5 space-y-2.5">
                  <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#10B981]">
                    03 // MARKDOWN &amp; KOD EDİTÖRÜ
                  </h3>
                  <div className="space-y-2">
                    {[
                      { keys: ['Ctrl', 'Enter'], label: 'Konuyu / Yorumu Hemen Gönder' },
                      { keys: ['Ctrl', 'B'], label: 'Kalın Metin (**bold**)' },
                      { keys: ['Ctrl', 'I'], label: 'İtalik Metin (*italic*)' },
                      { keys: ['Ctrl', 'E'], label: 'Satır İçi Kod (`code`)' },
                      { keys: ['Ctrl', 'Shift', 'C'], label: 'Kod Bloğu Ekle (```)' },
                      { keys: ['Alt', 'P'], label: 'Düzenle / Önizleme Geçişi' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-2 text-[#E6EDF3]"
                      >
                        <span className="text-[#8B949E]">{item.label}</span>
                        <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                          {item.keys.map((k, idx) => (
                            <React.Fragment key={k}>
                              {idx > 0 && <span className="text-[#8B949E]">+</span>}
                              <kbd className="px-1.5 py-0.5 rounded-sm bg-[#15181E] border border-[#232730] text-[#E6EDF3] font-semibold">
                                {k}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

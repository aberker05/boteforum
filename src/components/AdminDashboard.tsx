'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Layers,
  MessageSquare,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Award,
  Flag,
  ExternalLink,
  AlertOctagon,
  Palette,
  Upload,
  RotateCcw,
  Ban,
  UserCheck,
} from 'lucide-react';
import {
  CategoryIcon,
  CATEGORY_ICON_OPTIONS,
  RICH_COLOR_PALETTE,
} from './CategoryIcon';
import { BrandLogo, BRAND_LOGO_ICONS, renderBrandIcon } from './BrandLogo';
import { UserAvatar } from './UserAvatar';
import {
  AdminContentManager,
  type AdminThreadRecord,
  type AdminCommentRecord,
} from './AdminContentManager';
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from '@/lib/siteSettings';
import type { ContentReportItem } from '@/lib/reports';
import {
  SUPPORT_CATEGORIES,
  type SupportTicketItem,
  type SupportTicketStatus,
} from '@/lib/support';
import type {
  TechNewsItem,
  AdminTechNewsCommentItem,
} from '@/lib/techNews';
import { formatRelativeTime } from '@/lib/utils';

const ICONS = CATEGORY_ICON_OPTIONS.map((i) => i.name);

const COLORS = RICH_COLOR_PALETTE.map((c) => c.hex);

export interface AdminUserItem {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarColor: string;
  role: string;
  reputation: number;
  createdAt: string | Date;
  _count: {
    threads: number;
    comments: number;
  };
}

export interface AdminCategoryItem {
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

interface AdminDashboardProps {
  currentAdminId: string;
  stats: {
    totalUsers: number;
    totalThreads: number;
    solvedThreads: number;
    totalComments: number;
    totalCategories: number;
  };
  users: AdminUserItem[];
  categories: AdminCategoryItem[];
  threads?: AdminThreadRecord[];
  comments?: AdminCommentRecord[];
  techNews?: TechNewsItem[];
  techNewsComments?: AdminTechNewsCommentItem[];
  reports: ContentReportItem[];
  supportTickets?: SupportTicketItem[];
  initialSiteSettings?: SiteSettings;
}

export function AdminDashboard({
  currentAdminId,
  stats,
  users: initialUsers,
  categories: initialCategories,
  threads = [],
  comments = [],
  techNews = [],
  techNewsComments = [],
  reports: initialReports,
  supportTickets: initialSupportTickets = [],
  initialSiteSettings = DEFAULT_SITE_SETTINGS,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'branding' | 'content' | 'users' | 'categories' | 'reports' | 'support'
  >('content');
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [categories, setCategories] = useState<AdminCategoryItem[]>(initialCategories);
  const [reports, setReports] = useState<ContentReportItem[]>(initialReports);
  const [tickets, setTickets] = useState<SupportTicketItem[]>(initialSupportTickets);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const pendingReportsCount = reports.filter((r) => r.status === 'PENDING').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'OPEN').length;
  const [userSearch, setUserSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Site Kimliği & Logo Ayarları State
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(initialSiteSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setError('Lütfen 1.5 MB boyutundan küçük bir logo görseli (.png, .svg, .jpg, .webp) seçin.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSiteSettings((prev) => ({
          ...prev,
          logoType: 'image',
          logoImageUrl: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Site ayarları kaydedilemedi.');
      } else {
        setSiteSettings(data.settings);
        setSuccessMsg('Site adı ve logo ayarları başarıyla güncellendi!');
        router.refresh();
        setTimeout(() => setSuccessMsg(''), 3500);
      }
    } catch {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Yeni Kullanıcı Ekleme Modal State
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('MEMBER');
  const [savingUser, setSavingUser] = useState(false);

  // Kategori Form State
  const [editingCategory, setEditingCategory] = useState<AdminCategoryItem | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('MessageSquare');
  const [catColor, setCatColor] = useState('#6366f1');
  const [catOrder, setCatOrder] = useState(categories.length + 1);
  const [savingCat, setSavingCat] = useState(false);

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newDisplayName,
          username: newUsername,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kullanıcı oluşturulamadı.');
      } else {
        if (data.user) {
          setUsers((prev) => [
            {
              ...data.user,
              avatarColor: '#6366f1',
              createdAt: new Date().toISOString(),
              _count: { threads: 0, comments: 0 },
            },
            ...prev,
          ]);
        }
        setNewUserOpen(false);
        setNewDisplayName('');
        setNewUsername('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('MEMBER');
      }
    } catch {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setError('');
    const prevUsers = users;
    // 0ms Anlık (Optimistic) rol değişimi
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsers(prevUsers);
        setError(data.error || 'Rol güncellenemedi.');
      }
    } catch {
      setUsers(prevUsers);
      setError('Bağlantı hatası oluştu.');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (
      !confirm(
        `@${username} kullanıcısını ve tüm konu/yorumlarını kalıcı olarak silmek istediğinize emin misiniz?`
      )
    )
      return;

    setError('');
    const prevUsers = users;
    // 0ms Anlık listeden kaldır
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setUsers(prevUsers);
        setError(data.error || 'Kullanıcı silinemedi.');
      }
    } catch {
      setUsers(prevUsers);
      setError('Bağlantı hatası oluştu.');
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setCatIcon('MessageSquare');
    setCatColor('#6366f1');
    setCatOrder(categories.length + 1);
  };

  const startEditCategory = (cat: AdminCategoryItem) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setCatOrder(cat.order);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catDesc.trim()) return;

    setError('');
    setSavingCat(true);
    try {
      const method = editingCategory ? 'PATCH' : 'POST';
      const payload = editingCategory
        ? {
            id: editingCategory.id,
            name: catName,
            description: catDesc,
            icon: catIcon,
            color: catColor,
            order: Number(catOrder),
          }
        : {
            name: catName,
            description: catDesc,
            icon: catIcon,
            color: catColor,
            order: Number(catOrder),
          };

      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kategori kaydedilemedi.');
      } else {
        if (editingCategory && data.category) {
          setCategories((prev) =>
            prev.map((c) =>
              c.id === editingCategory.id
                ? { ...c, ...data.category, _count: c._count }
                : c
            )
          );
        } else if (data.category) {
          setCategories((prev) => [
            ...prev,
            { ...data.category, _count: { threads: 0 } },
          ]);
        }
        resetCategoryForm();
      }
    } catch {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: AdminCategoryItem) => {
    if (
      !confirm(
        `"${cat.name}" kategorisini ve içindeki ${cat._count.threads} konuyu silmek istediğinize emin misiniz?`
      )
    )
      return;

    setError('');
    const prevCategories = categories;
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    try {
      const res = await fetch(`/api/admin/categories?id=${cat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setCategories(prevCategories);
        setError(data.error || 'Kategori silinemedi.');
      }
    } catch {
      setCategories(prevCategories);
      setError('Bağlantı hatası oluştu.');
    }
  };

  const handleReportAction = async (
    reportId: string,
    action: 'dismiss' | 'deleteContent'
  ) => {
    if (
      action === 'deleteContent' &&
      !confirm(
        'Raporlanan içeriği kalıcı olarak silmek ve şikayeti çözüldü olarak işaretlemek istediğinize emin misiniz?'
      )
    ) {
      return;
    }

    setError('');
    const prevReports = reports;
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: action === 'dismiss' ? 'DISMISSED' : 'RESOLVED' }
          : r
      )
    );
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReports(prevReports);
        setError(data.error || 'İşlem başarısız.');
      }
    } catch {
      setReports(prevReports);
      setError('Bağlantı hatası oluştu.');
    }
  };

  const handleDeleteReportRecord = async (reportId: string) => {
    setError('');
    const prevReports = reports;
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    try {
      const res = await fetch(`/api/reports?id=${reportId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setReports(prevReports);
      }
    } catch {
      setReports(prevReports);
      setError('Bağlantı hatası oluştu.');
    }
  };

  const handleUpdateTicket = async (
    ticketId: string,
    status?: SupportTicketStatus,
    adminReply?: string
  ) => {
    setError('');
    const prevTickets = tickets;
    const nowIso = new Date().toISOString();

    // 0ms Anlık (Optimistic) UI Güncellemesi
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const nextReply =
          adminReply !== undefined ? adminReply.trim() : t.adminReply;
        const nextStatus =
          status || (nextReply && t.status === 'OPEN' ? 'ANSWERED' : t.status);
        return {
          ...t,
          status: nextStatus,
          adminReply: nextReply,
          repliedAt: adminReply !== undefined ? nowIso : t.repliedAt,
        };
      })
    );
    setSuccessMsg('Destek/talep kaydı güncellendi ve kullanıcıya bildirim gönderildi.');
    setTimeout(() => setSuccessMsg(''), 3000);

    try {
      const res = await fetch('/api/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status, adminReply }),
      });
      if (!res.ok) {
        setTickets(prevTickets);
        setError('Talep güncellenemedi.');
      }
    } catch {
      setTickets(prevTickets);
      setError('Bağlantı hatası oluştu.');
    }
  };

  const handleDeleteTicketRecord = async (ticketId: string) => {
    if (!confirm('Bu destek/talep kaydını kalıcı olarak silmek istediğinize emin misiniz?')) {
      return;
    }
    setError('');
    const prevTickets = tickets;
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    try {
      const res = await fetch(`/api/support?id=${ticketId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setTickets(prevTickets);
      }
    } catch {
      setTickets(prevTickets);
      setError('Bağlantı hatası oluştu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold">
              {siteSettings.siteNamePrimary}
              {siteSettings.siteNameAccent} Yönetim Paneli
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Kullanıcı yetkilerini, kategorileri ve topluluk istatistiklerini yönetin.
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors self-start sm:self-auto"
        >
          Foruma Dön
        </Link>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Toplam Üye</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalUsers}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Toplam Konu</span>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalThreads}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Çözülen Konu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.solvedThreads}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Toplam Yorum</span>
            <MessageSquare className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalComments}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Kategori</span>
            <Layers className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalCategories}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Sekme Seçici */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'content'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          İçerik & Yorum Yönetimi ({threads.length + comments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          Site & Logo Ayarları
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Kullanıcı Yönetimi ({users.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Kategori Yönetimi ({categories.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Flag className="w-4 h-4" />
          Raporlanan İçerikler ({reports.length})
          {pendingReportsCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-rose-500 text-white">
              {pendingReportsCount} Yeni
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('support')}
          className={`shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'support'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Destek & Talepler ({tickets.length})
          {openTicketsCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-amber-500 text-slate-950">
              {openTicketsCount} Açık
            </span>
          )}
        </button>
      </div>

      {/* İÇERİK & YORUM YÖNETİMİ SEKMESİ */}
      {activeTab === 'content' && (
        <AdminContentManager
          initialThreads={threads}
          initialComments={comments}
          initialTechNews={techNews}
          initialTechNewsComments={techNewsComments}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
          }))}
        />
      )}

      {/* SİTE & LOGO AYARLARI SEKMESİ */}
      {activeTab === 'branding' && (
        <form
          onSubmit={handleSaveSiteSettings}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Sol: Düzenleme Formu */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-500" />
                  Site Kimliği, İsim ve Logo Özelleştirme
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sitenizin üst menüde, tarayıcı sekmesinde ve alt bilgi (footer) alanında görünen adını ve logosunu buradan değiştirebilirsiniz.
                </p>
              </div>
            </div>

            {/* 1. Site İsmi ve Slogan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Site Ana Adı (1. Kısım) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={siteSettings.siteNamePrimary}
                  onChange={(e) =>
                    setSiteSettings({
                      ...siteSettings,
                      siteNamePrimary: e.target.value,
                    })
                  }
                  placeholder="Örn: Nova veya Tekno"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vurgulu İsim (2. Kısım - Renkli)
                </label>
                <input
                  type="text"
                  maxLength={24}
                  value={siteSettings.siteNameAccent}
                  onChange={(e) =>
                    setSiteSettings({
                      ...siteSettings,
                      siteNameAccent: e.target.value,
                    })
                  }
                  placeholder="Örn: Forum, Hub, Meydan (boş bırakılabilir)"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Alt Başlık / Slogan (Logo Altında Görünür)
              </label>
              <input
                type="text"
                maxLength={50}
                value={siteSettings.siteTagline}
                onChange={(e) =>
                  setSiteSettings({
                    ...siteSettings,
                    siteTagline: e.target.value,
                  })
                }
                placeholder="Örn: Geliştirici & Teknoloji Forumu"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* 2. Logo Türü Seçimi */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Logo Türü Seçin
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setSiteSettings({ ...siteSettings, logoType: 'icon' })
                  }
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    siteSettings.logoType === 'icon'
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Hazır İkon Logo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSiteSettings({ ...siteSettings, logoType: 'text' })
                  }
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    siteSettings.logoType === 'text'
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Harf / Monogram
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSiteSettings({ ...siteSettings, logoType: 'image' })
                  }
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    siteSettings.logoType === 'image'
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Kendi Görselim (Resim)
                </button>
              </div>

              {/* İkon Seçici */}
              {siteSettings.logoType === 'icon' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <span className="block text-[11px] font-semibold text-slate-500">
                    Logo İkonu Seçin:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {BRAND_LOGO_ICONS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() =>
                          setSiteSettings({
                            ...siteSettings,
                            logoIcon: item.name,
                          })
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          siteSettings.logoIcon === item.name
                            ? 'border-indigo-500 bg-indigo-600 text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {renderBrandIcon(item.name, 'w-4 h-4')}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Harf / Monogram Girişi */}
              {siteSettings.logoType === 'text' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Logo Harfleri (1-3 Karakter, Örn: NF, TR, DEV)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={siteSettings.logoText}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        logoText: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="NF"
                    className="w-32 px-3.5 py-2 rounded-xl text-sm font-black uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Resim / Görsel Logo Yükleme veya URL */}
              {siteSettings.logoType === 'image' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Bilgisayardan Logo Seç (.png, .svg, .jpg)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                    </label>
                    {siteSettings.logoImageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setSiteSettings({ ...siteSettings, logoImageUrl: '' })
                        }
                        className="text-xs font-semibold text-rose-500 hover:underline"
                      >
                        Görseli Kaldır
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      veya doğrudan Logo Görsel URL&apos;si girin:
                    </label>
                    <input
                      type="text"
                      value={
                        siteSettings.logoImageUrl.startsWith('data:')
                          ? ''
                          : siteSettings.logoImageUrl
                      }
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          logoImageUrl: e.target.value,
                        })
                      }
                      placeholder="Örn: /logo.png veya https://ornek.com/logo.svg"
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Marka ve Logo Ana Rengi */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Marka ve Vurgu Rengi
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setSiteSettings({ ...siteSettings, brandColor: color })
                    }
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs transition-transform hover:scale-105"
                    style={{ backgroundColor: color }}
                  >
                    {siteSettings.brandColor === color && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
                <input
                  type="color"
                  value={siteSettings.brandColor}
                  onChange={(e) =>
                    setSiteSettings({
                      ...siteSettings,
                      brandColor: e.target.value,
                    })
                  }
                  className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                  title="Özel Renk Seç"
                />
              </div>
            </div>

            {/* 4. Footer Açıklaması ve Telif Metni */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alt Bilgi (Footer) Tanıtım Yazısı
                </label>
                <textarea
                  rows={2}
                  maxLength={350}
                  value={siteSettings.footerDescription}
                  onChange={(e) =>
                    setSiteSettings({
                      ...siteSettings,
                      footerDescription: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telif Hakkı (Copyright) Metni
                </label>
                <input
                  type="text"
                  maxLength={140}
                  value={siteSettings.copyrightText}
                  onChange={(e) =>
                    setSiteSettings({
                      ...siteSettings,
                      copyrightText: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSiteSettings(DEFAULT_SITE_SETTINGS)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Varsayılana Dön
              </button>

              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
              >
                <Check className="w-4 h-4" />
                {savingSettings ? 'Kaydediliyor...' : 'Site & Logo Ayarlarını Kaydet'}
              </button>
            </div>
          </div>

          {/* Sağ: Canlı Önizleme Kartı */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 sm:p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Canlı Görünüm Önizlemesi (Üst Menü)
              </h3>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-between">
                <BrandLogo settings={siteSettings} size="md" showTagline={true} />
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-500/10 text-indigo-500">
                  Navbar
                </span>
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">
                Alt Bilgi (Footer) Önizlemesi
              </h3>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b0f19] space-y-2.5">
                <BrandLogo settings={siteSettings} size="sm" showTagline={false} />
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {siteSettings.footerDescription}
                </p>
                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  {siteSettings.copyrightText}
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* KULLANICI YÖNETİMİ SEKMESİ */}
      {activeTab === 'users' && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Kayıtlı Kullanıcılar ve Yetkileri
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="İsim, @kullanıcı veya e-posta ara..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setNewUserOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Yeni Kullanıcı Ekle
              </button>
            </div>
          </div>

          {newUserOpen && (
            <form
              onSubmit={handleCreateUser}
              className="rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Yeni Kullanıcı Oluştur
                </h3>
                <button
                  type="button"
                  onClick={() => setNewUserOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Ad Soyad"
                  className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="kullanici_adi"
                  className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="eposta@ornek.com"
                  className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Şifre (min 6 krk)"
                  className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
                <div className="flex gap-2">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="MEMBER">ÜYE</option>
                    <option value="MODERATOR">MOD</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <button
                    type="submit"
                    disabled={savingUser}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {savingUser ? '...' : 'Ekle'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-3">Kullanıcı</th>
                  <th className="py-3 px-3">E-posta</th>
                  <th className="py-3 px-3">İstatistik</th>
                  <th className="py-3 px-3">Rol / Yetki</th>
                  <th className="py-3 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentAdminId;
                  const isBanned = u.role === 'BANNED';
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 ${
                        isBanned ? 'bg-rose-50/30 dark:bg-rose-950/15' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <Link
                          href={`/kullanici/${u.username}`}
                          className="flex items-center gap-2.5 group"
                        >
                          <UserAvatar
                            name={u.displayName}
                            avatar={u.avatarColor}
                            className={`w-8 h-8 rounded-xl text-xs ${
                              isBanned ? 'opacity-60 grayscale' : ''
                            }`}
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors flex items-center gap-1.5 flex-wrap">
                              <span className={isBanned ? 'line-through text-slate-400' : ''}>
                                {u.displayName}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500">
                                  Siz
                                </span>
                              )}
                              {isBanned && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold">
                                  ASKIYA ALINDI
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">@{u.username}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-400">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-3">
                          <span>{u._count.threads} konu</span>
                          <span>•</span>
                          <span>{u._count.comments} yorum</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600 dark:text-amber-400">
                            <Award className="w-3.5 h-3.5" /> {u.reputation}p
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <select
                          disabled={isSelf || loadingId === u.id}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border disabled:opacity-50 ${
                            isBanned
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <option value="MEMBER">ÜYE (MEMBER)</option>
                          <option value="MODERATOR">MODERATÖR</option>
                          <option value="ADMIN">YÖNETİCİ (ADMIN)</option>
                          <option value="BANNED">YASAKLI (BANNED)</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {!isSelf && (
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              disabled={loadingId === u.id}
                              onClick={() =>
                                handleRoleChange(u.id, isBanned ? 'MEMBER' : 'BANNED')
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                isBanned
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25'
                              }`}
                              title={
                                isBanned
                                  ? 'Kullanıcının yasağını kaldır ve normal üye yap'
                                  : 'Kullanıcıyı askıya al (giriş ve paylaşım yetkisini kapat)'
                              }
                            >
                              {isBanned ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Yasağı Kaldır</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Askıya Al</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={loadingId === u.id}
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="Kullanıcıyı Kalıcı Olarak Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KATEGORİ YÖNETİMİ SEKMESİ */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sol: Yeni Kategori / Düzenleme Formu */}
          <form
            onSubmit={handleCategorySubmit}
            className="lg:col-span-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingCategory ? (
                  <>
                    <Edit2 className="w-4 h-4 text-indigo-500" />
                    Kategoriyi Düzenle
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-indigo-500" />
                    Yeni Kategori Ekle
                  </>
                )}
              </h3>
              {editingCategory && (
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> İptal
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Adı
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Örn: Siber Güvenlik & DevOps"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Açıklama
              </label>
              <textarea
                rows={2}
                required
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Kategori içeriği hakkında kısa açıklama..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  İkon Seçimi ({CATEGORY_ICON_OPTIONS.length} İkon)
                </label>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {CATEGORY_ICON_OPTIONS.find((i) => i.name === catIcon)?.label || catIcon}
                </span>
              </div>
              <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 max-h-48 overflow-y-auto">
                {CATEGORY_ICON_OPTIONS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    title={`${item.label} (${item.group})`}
                    onClick={() => setCatIcon(item.name)}
                    className={`h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                      catIcon === item.name
                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm scale-105'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    <CategoryIcon name={item.name} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kategori Rengi ({RICH_COLOR_PALETTE.length} Hazır Ton + Özel Renk Seçici)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {RICH_COLOR_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => setCatColor(c.hex)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-transform hover:scale-110 cursor-pointer shadow-2xs"
                      style={{ backgroundColor: c.hex }}
                    >
                      {catColor.toLowerCase() === c.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                    title="Özel Renk Seç"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sıralama (Order)
                </label>
                <input
                  type="number"
                  value={catOrder}
                  onChange={(e) => setCatOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingCat}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm disabled:opacity-50"
            >
              {savingCat
                ? 'Kaydediliyor...'
                : editingCategory
                ? 'Kategoriyi Güncelle'
                : 'Kategori Oluştur'}
            </button>
          </form>

          {/* Sağ: Mevcut Kategoriler Listesi */}
          <div className="lg:col-span-7 space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <CategoryIcon
                      name={cat.icon}
                      className="w-5 h-5"
                      color={cat.color}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {cat._count.threads} konu
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditCategory(cat)}
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={loadingId === cat.id}
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RAPORLANAN İÇERİKLER SEKMESİ */}
      {activeTab === 'reports' && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                Kullanıcı Şikayetleri ve Raporlanan İçerikler
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Topluluk üyeleri tarafından bildirilen konu ve yorumları inceleyip tek tıkla işlem yapabilirsiniz.
              </p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Şu anda raporlanmış herhangi bir içerik bulunmuyor.
              </p>
              <p className="text-xs text-slate-500">
                Kullanıcılar konu veya yorumlardaki &quot;Rapor Et&quot; butonunu kullandığında burada listelenir.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const isPending = report.status === 'PENDING';
                return (
                  <div
                    key={report.id}
                    className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                      isPending
                        ? 'border-rose-300 dark:border-rose-900/70 bg-rose-50/30 dark:bg-rose-950/15'
                        : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            report.targetType === 'THREAD'
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {report.targetType === 'THREAD' ? 'KONU ŞİKAYETİ' : 'YORUM ŞİKAYETİ'}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            report.status === 'PENDING'
                              ? 'bg-rose-500 text-white'
                              : report.status === 'RESOLVED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {report.status === 'PENDING'
                            ? 'İnceleme Bekliyor'
                            : report.status === 'RESOLVED'
                            ? 'İçerik Silindi / Çözüldü'
                            : 'Yoksayıldı'}
                        </span>

                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          Sebep: {report.reason}
                        </span>
                      </div>

                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(report.createdAt)}
                      </span>
                    </div>

                    {/* Raporlanan İçerik Özeti */}
                    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 mb-3">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                        Raporlanan İçerik Önizlemesi:
                      </p>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 line-clamp-3">
                        {report.targetPreview}
                      </p>
                    </div>

                    {report.details && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 bg-slate-100/80 dark:bg-slate-800/60 px-3 py-2 rounded-xl">
                        <strong className="font-semibold">Raporlayan Notu:</strong> {report.details}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs text-slate-500">
                        Bildiren Üye:{' '}
                        <Link
                          href={`/kullanici/${report.reporterUsername}`}
                          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {report.reporterDisplayName} (@{report.reporterUsername})
                        </Link>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {report.threadSlug && (
                          <Link
                            href={`/konu/${report.threadSlug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Konuya Git
                          </Link>
                        )}

                        {isPending && (
                          <>
                            <button
                              type="button"
                              disabled={loadingId === report.id}
                              onClick={() => handleReportAction(report.id, 'dismiss')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Sorun Yok (Yoksay)
                            </button>

                            <button
                              type="button"
                              disabled={loadingId === report.id}
                              onClick={() => handleReportAction(report.id, 'deleteContent')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              İçeriği Sil ve Çöz
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          disabled={loadingId === report.id}
                          onClick={() => handleDeleteReportRecord(report.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Rapor Kaydını Sil"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DESTEK, TALEP & ŞİKAYET MERKEZİ SEKMESİ */}
      {activeTab === 'support' && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                Kullanıcı Destek, Talep ve Şikayet Bildirimleri
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Üyelerin `/destek` sayfasından gönderdiği teknik destek, özellik/kategori önerisi ve şikayetleri yanıtlayıp durumunu güncelleyebilirsiniz.
              </p>
            </div>
            <Link
              href="/destek"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Destek Sayfasını Gör
            </Link>
          </div>

          {tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Şu anda gönderilmiş herhangi bir destek veya talep bildirimi bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => {
                const catInfo =
                  SUPPORT_CATEGORIES.find((c) => c.id === t.category) ||
                  SUPPORT_CATEGORIES[0];
                const draftVal =
                  replyDrafts[t.id] !== undefined
                    ? replyDrafts[t.id]
                    : t.adminReply || '';
                return (
                  <div
                    key={t.id}
                    className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 transition-all ${
                      t.status === 'OPEN'
                        ? 'border-amber-400/60 dark:border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10'
                        : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                          style={{
                            backgroundColor: `${catInfo.color}20`,
                            color: catInfo.color,
                          }}
                        >
                          <CategoryIcon
                            name={catInfo.icon}
                            className="w-3.5 h-3.5"
                            color={catInfo.color}
                          />
                          {catInfo.label}
                        </span>

                        {t.priority === 'HIGH' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                            ⚡ ACİL
                          </span>
                        )}

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            t.status === 'OPEN'
                              ? 'bg-amber-500 text-slate-950'
                              : t.status === 'ANSWERED'
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                              : t.status === 'RESOLVED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {t.status === 'OPEN'
                            ? 'İnceleme Bekliyor'
                            : t.status === 'ANSWERED'
                            ? 'Yanıtlandı'
                            : t.status === 'RESOLVED'
                            ? 'Çözüldü'
                            : 'Kapatıldı'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatRelativeTime(t.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTicketRecord(t.id)}
                          title="Talebi Kalıcı Olarak Sil"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Gönderen Üye Bilgisi */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Gönderen:</span>
                      <Link
                        href={`/kullanici/${t.userUsername}`}
                        className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <UserAvatar
                          name={t.userDisplayName || 'Üye'}
                          avatar={t.userAvatarColor || '#6366f1'}
                          className="w-5 h-5 rounded-md text-[10px]"
                        />
                        {t.userDisplayName} (@{t.userUsername})
                      </Link>
                      {t.userEmail && (
                        <span className="text-slate-400">• {t.userEmail}</span>
                      )}
                    </div>

                    {/* Talep Başlığı ve Mesajı */}
                    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-1.5">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {t.subject}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {t.message}
                      </p>
                    </div>

                    {/* Yönetici Yanıtı ve Hızlı Durum Aksiyonları */}
                    <div className="space-y-2.5 pt-1">
                      <textarea
                        rows={2}
                        value={draftVal}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [t.id]: e.target.value,
                          }))
                        }
                        placeholder="Kullanıcıya iletilecek resmi yönetim yanıtınızı buraya yazın..."
                        className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateTicket(t.id, 'ANSWERED', draftVal)
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Yanıtı Kaydet & Bildir
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateTicket(
                                t.id,
                                'RESOLVED',
                                draftVal || t.adminReply
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Çözüldü İşaretle
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {t.status !== 'OPEN' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicket(t.id, 'OPEN')}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer"
                            >
                              Tekrar Aç
                            </button>
                          )}
                          {t.status !== 'CLOSED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicket(t.id, 'CLOSED')}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              Kapat
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  Shield,
  Trash2,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  SUPPORT_CATEGORIES,
  type SupportTicketCategory,
  type SupportTicketItem,
  type SupportTicketPriority,
} from '@/lib/support';
import { CategoryIcon } from './CategoryIcon';
import { formatRelativeTime } from '@/lib/utils';

interface SupportCenterClientProps {
  initialTickets: SupportTicketItem[];
  currentUser: {
    id: string;
    username: string;
    displayName: string;
    role: string;
  } | null;
}

const STATUS_META: Record<
  SupportTicketItem['status'],
  { label: string; badgeClass: string }
> = {
  OPEN: {
    label: 'İnceleniyor',
    badgeClass:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  ANSWERED: {
    label: 'Yönetici Yanıtladı',
    badgeClass:
      'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  },
  RESOLVED: {
    label: 'Çözüldü / Tamamlandı',
    badgeClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  CLOSED: {
    label: 'Kapatıldı',
    badgeClass:
      'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
  },
};

export function SupportCenterClient({
  initialTickets,
  currentUser,
}: SupportCenterClientProps) {
  const [tickets, setTickets] = useState<SupportTicketItem[]>(initialTickets);
  const [category, setCategory] = useState<SupportTicketCategory>('SUPPORT');
  const [priority, setPriority] = useState<SupportTicketPriority>('NORMAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successText, setSuccessText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Lütfen konu başlığı ve detaylı mesaj alanlarını doldurun.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessText('');

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          priority,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Talebiniz gönderilemedi.');
      } else if (data.ticket) {
        setTickets((prev) => [data.ticket, ...prev]);
        setSubject('');
        setMessage('');
        setPriority('NORMAL');
        setSuccessText(
          'Talebiniz site yönetimine başarıyla iletildi! Yanıtlandığında bildirim alacaksınız ve sağdaki listeden takip edebilirsiniz.'
        );
      }
    } catch {
      setError('Sunucu ile bağlantı kurulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm('Bu destek/talep kaydını silmek istediğinize emin misiniz?')) {
      return;
    }
    const prev = tickets;
    setTickets((list) => list.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/support?id=${id}`, { method: 'DELETE' });
      if (!res.ok) setTickets(prev);
    } catch {
      setTickets(prev);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/"
          prefetch={true}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Foruma Dön
        </Link>

        {currentUser?.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/25 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            Yönetim Panelinde Tüm Talepleri Yönet
          </Link>
        )}
      </div>

      {/* Üst Karşılama Başlığı */}
      <div className="rounded-3xl bg-gradient-to-br from-[#070b14] via-indigo-950 to-[#090d16] p-6 sm:p-8 text-white shadow-xl border border-indigo-500/25 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            Doğrudan Site Yönetimi İletişim Hattı
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Destek, Talep & Şikayet Merkezi
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Teknik sorunlarınızı, foruma eklenmesini istediğiniz yeni kategori/özellik önerilerinizi veya moderasyon şikayetlerinizi doğrudan site yönetimine iletin ve yanıtları buradan takip edin.
          </p>
        </div>
      </div>

      {!currentUser ? (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Destek veya Talep Göndermek İçin Giriş Yapın
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Site yönetiminin talebinize yanıt verebilmesi ve bildirim gönderebilmesi için hesabınızla giriş yapmanız gerekmektedir.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/giris"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all"
            >
              Giriş Yap
            </Link>
            <Link
              href="/kayit"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SOL: Yeni Destek / Talep / Şikayet Formu (6 Sütun) */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-6 rounded-3xl border border-slate-200/85 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-5 sm:p-7 space-y-5 shadow-xs"
          >
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Yeni Bildirim veya Talep Oluştur
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bildiriminiz yalnızca site yöneticileri (Admin) tarafından görüntülenir.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successText && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{successText}</span>
              </div>
            )}

            {/* 1. Bildirim Türü Seçimi */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                1. Bildirim Türünü Seçin
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUPPORT_CATEGORIES.map((cat) => {
                  const selected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        selected
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                        }}
                      >
                        <CategoryIcon
                          name={cat.icon}
                          className="w-4 h-4"
                          color={cat.color}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {cat.label}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {cat.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Öncelik Seçimi */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                2. Öncelik Durumu
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPriority('NORMAL')}
                  className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    priority === 'NORMAL'
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Normal Öncelik
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('HIGH')}
                  className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    priority === 'HIGH'
                      ? 'border-rose-500 bg-rose-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ⚡ Acil / Yüksek Öncelik
                </button>
              </div>
            </div>

            {/* 3. Başlık */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                3. Konu Başlığı *
              </label>
              <input
                type="text"
                required
                maxLength={160}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Örn: Siber Güvenlik CTF bölümü açılması talebi veya Hesap sorunu"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* 4. Detaylı Açıklama */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                4. Detaylı Açıklama / Mesajınız *
              </label>
              <textarea
                rows={5}
                required
                maxLength={5000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Talebinizi, önerinizi veya yaşadığınız sorunu tüm detaylarıyla buraya yazabilirsiniz..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Gönderiliyor...' : 'Site Yönetimine Gönder'}
            </button>
          </form>

          {/* SAĞ: Kullanıcının Gönderdiği Talepler & Yönetici Yanıtları (6 Sütun) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Gönderdiğim Talepler ve Yanıtlar ({tickets.length})
              </h2>
            </div>

            {tickets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 p-10 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Henüz gönderdiğiniz bir destek veya talep bildirimi bulunmuyor.
                </p>
                <p className="text-xs text-slate-500">
                  Soldaki formu kullanarak yönetime ilk talep, öneri veya şikayetinizi iletebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {tickets.map((t) => {
                  const catInfo =
                    SUPPORT_CATEGORIES.find((c) => c.id === t.category) ||
                    SUPPORT_CATEGORIES[0];
                  const st = STATUS_META[t.status] || STATUS_META.OPEN;
                  return (
                    <div
                      key={t.id}
                      className="rounded-3xl border border-slate-200/85 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-5 space-y-3.5 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                            style={{
                              backgroundColor: `${catInfo.color}18`,
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
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              ⚡ ACİL
                            </span>
                          )}

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${st.badgeClass}`}
                          >
                            {st.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(t.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(t.id)}
                            title="Talebi Sil"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          {t.subject}
                        </h3>
                        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {t.message}
                        </p>
                      </div>

                      {t.adminReply ? (
                        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/35 p-4 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                              <Shield className="w-3.5 h-3.5 text-indigo-500" />
                              Site Yönetimi Yanıtı
                            </span>
                            {t.repliedAt && (
                              <span className="text-[10px] text-slate-400">
                                {formatRelativeTime(t.repliedAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {t.adminReply}
                          </p>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            Talebiniz yönetici ekranına iletildi. Yanıtlandığında burada görünecek ve bildirim alacaksınız.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

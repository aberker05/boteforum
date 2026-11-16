'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  MessageSquare,
  Reply,
  AtSign,
  CheckCircle2,
  ThumbsUp,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import type { NotificationItem, NotificationType } from '@/lib/notifications';
import { UserAvatar } from './UserAvatar';
import { formatRelativeTime } from '@/lib/utils';

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Sessizce geç
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { method: 'DELETE' });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClickNotification = async (notif: NotificationItem) => {
    setOpen(false);
    if (!notif.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notif.id }),
      });
    }
    router.push(notif.link);
  };

  const renderTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'COMMENT':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />;
      case 'REPLY':
        return <Reply className="w-3.5 h-3.5 text-blue-500" />;
      case 'MENTION':
        return <AtSign className="w-3.5 h-3.5 text-amber-500" />;
      case 'SOLUTION':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'UPVOTE':
        return <ThumbsUp className="w-3.5 h-3.5 text-pink-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        title="Bildirimler"
        className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-20 overflow-hidden">
            {/* Üst Başlık */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Bildirimler
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    {unreadCount} yeni
                  </span>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleMarkAllRead}
                      title="Tümünü Okundu İşaretle"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Okundu
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleClearAll}
                    title="Bildirimleri Temizle"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Bildirim Listesi */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Henüz bildiriminiz yok
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Konularınıza yorum yapıldığında, yanıt aldığınızda veya @etiketlendiğinizde burada görünür.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClickNotification(n)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      !n.isRead
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                        : ''
                    }`}
                  >
                    {/* Gönderen Avatarı + Tip İkonu */}
                    <div className="relative shrink-0 mt-0.5">
                      <UserAvatar
                        name={n.actorDisplayName}
                        avatar={n.actorAvatarColor}
                        className="w-8 h-8 rounded-xl text-xs"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {renderTypeIcon(n.type)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                        <strong className="font-bold text-slate-900 dark:text-white">
                          {n.actorDisplayName}
                        </strong>{' '}
                        {n.message}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


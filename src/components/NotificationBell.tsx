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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

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
        return <MessageSquare className="w-3 h-3 text-[#10B981]" />;
      case 'REPLY':
        return <Reply className="w-3 h-3 text-[#10B981]" />;
      case 'MENTION':
        return <AtSign className="w-3 h-3 text-[#F59E0B]" />;
      case 'SOLUTION':
        return <CheckCircle2 className="w-3 h-3 text-[#10B981]" />;
      case 'UPVOTE':
        return <ThumbsUp className="w-3 h-3 text-[#F59E0B]" />;
      default:
        return <Bell className="w-3 h-3 text-[#10B981]" />;
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
        className="relative p-2 rounded-md border border-[#232730] bg-[#15181E] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#10B981]/50 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-sm bg-[#F59E0B] text-[#0D0F12] font-mono text-[10px] font-bold flex items-center justify-center">
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
          <div className="fixed left-3 right-3 top-15 sm:static sm:left-auto sm:right-0 sm:top-auto sm:absolute sm:mt-1.5 sm:w-96 rounded-md border border-[#232730] bg-[#15181E] z-20 overflow-hidden">
            {/* Üst Başlık */}
            <div className="px-3.5 py-2.5 border-b border-[#232730] flex items-center justify-between bg-[#0D0F12] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E6EDF3]">
                  BİLDİRİMLER
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-sm bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/35">
                    {unreadCount} YENİ
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
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold text-[#10B981] hover:bg-[#15181E] transition-colors cursor-pointer"
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
                    className="p-1 rounded-sm text-[#8B949E] hover:text-rose-400 hover:bg-[#15181E] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Bildirim Listesi */}
            <div className="max-h-96 overflow-y-auto divide-y divide-[#232730] custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-9 h-9 rounded-md bg-[#0D0F12] border border-[#232730] text-[#8B949E] flex items-center justify-center mx-auto">
                    <Bell className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-[#E6EDF3]">
                    Henüz bildiriminiz yok
                  </p>
                  <p className="text-[11px] text-[#8B949E]">
                    Konularınıza yorum yapıldığında, yanıt aldığınızda veya @etiketlendiğinizde burada görünür.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClickNotification(n)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors hover:bg-[#0D0F12] cursor-pointer ${
                      !n.isRead ? 'bg-[#10B981]/8' : ''
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <UserAvatar
                        name={n.actorDisplayName}
                        avatar={n.actorAvatarColor}
                        className="w-7 h-7 rounded-md text-xs border border-[#232730]"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-sm bg-[#0D0F12] border border-[#232730] flex items-center justify-center">
                        {renderTypeIcon(n.type)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#8B949E] leading-snug">
                        <strong className="font-bold text-[#E6EDF3]">
                          {n.actorDisplayName}
                        </strong>{' '}
                        {n.message}
                      </p>
                      <span className="text-[10px] font-mono text-[#8B949E] mt-1 block">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0 mt-2" />
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

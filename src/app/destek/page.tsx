import React from 'react';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { getSiteSettings } from '@/lib/siteSettings';
import { getUserSupportTickets } from '@/lib/support';
import { SupportCenterClient } from '@/components/SupportCenterClient';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const fullName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;
  return {
    title: `Destek, Talep & Şikayet Merkezi — ${fullName}`,
    description:
      'Site yönetimine teknik destek, yeni özellik/kategori talebi veya şikayet bildirimlerinizi doğrudan iletin.',
  };
}

export default async function SupportPage() {
  const user = await getCurrentUser();
  const tickets = user ? await getUserSupportTickets(user.id) : [];

  return (
    <SupportCenterClient
      initialTickets={tickets}
      currentUser={
        user
          ? {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              role: user.role,
            }
          : null
      }
    />
  );
}

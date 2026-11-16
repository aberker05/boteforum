import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { verifyRequestOrigin } from '@/lib/security';
import {
  clearAllNotifications,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/notifications';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const data = await getUserNotifications(user.id, 25);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Bildirimler alınamadı.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationId } = body;

    if (action === 'markAllRead') {
      await markAllNotificationsAsRead(user.id);
    } else if (notificationId) {
      await markNotificationAsRead(notificationId, user.id);
    }

    const data = await getUserNotifications(user.id, 25);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json(
      { error: 'Bildirim güncellenemedi.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 401 });
    }

    await clearAllNotifications(user.id);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  } catch (error) {
    console.error('Clear notifications error:', error);
    return NextResponse.json(
      { error: 'Bildirimler temizlenemedi.' },
      { status: 500 }
    );
  }
}


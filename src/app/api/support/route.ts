import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import {
  checkActionCooldown,
  validateContentLength,
  verifyRequestOrigin,
} from '@/lib/security';
import {
  createSupportTicket,
  deleteSupportTicket,
  getAllSupportTickets,
  getSupportTicketById,
  getUserSupportTickets,
  updateSupportTicket,
  type SupportTicketCategory,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from '@/lib/support';

const VALID_CATEGORIES: SupportTicketCategory[] = [
  'SUPPORT',
  'FEATURE',
  'COMPLAINT',
  'BUG',
  'OTHER',
];
const VALID_PRIORITIES: SupportTicketPriority[] = ['NORMAL', 'HIGH'];
const VALID_STATUSES: SupportTicketStatus[] = [
  'OPEN',
  'ANSWERED',
  'RESOLVED',
  'CLOSED',
];

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === '1';

    if (all && user.role === 'ADMIN') {
      const tickets = await getAllSupportTickets();
      return NextResponse.json({ tickets });
    }

    const tickets = await getUserSupportTickets(user.id);
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Get support tickets error:', error);
    return NextResponse.json(
      { error: 'Destek talepleri yüklenemedi.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Destek veya talep göndermek için giriş yapmalısınız.' },
        { status: 401 }
      );
    }

    const cooldown = checkActionCooldown(user.id, 'support_ticket', 15000);
    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          error: `Çok sık talep gönderiyorsunuz. Lütfen ${cooldown.waitSeconds} saniye bekleyin.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { category, priority, subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Lütfen konu başlığı ve detaylı açıklama alanlarını doldurun.' },
        { status: 400 }
      );
    }

    const subLen = validateContentLength(String(subject), 160, 'Talep başlığı');
    if (!subLen.valid) {
      return NextResponse.json({ error: subLen.error }, { status: 400 });
    }
    if (String(subject).trim().length < 4) {
      return NextResponse.json(
        { error: 'Talep başlığı en az 4 karakter olmalıdır.' },
        { status: 400 }
      );
    }

    const msgLen = validateContentLength(String(message), 5000, 'Talep açıklaması');
    if (!msgLen.valid) {
      return NextResponse.json({ error: msgLen.error }, { status: 400 });
    }
    if (String(message).trim().length < 10) {
      return NextResponse.json(
        { error: 'Lütfen talebinizi en az 10 karakter olacak şekilde açıklayın.' },
        { status: 400 }
      );
    }

    const cleanCategory: SupportTicketCategory = VALID_CATEGORIES.includes(category)
      ? category
      : 'SUPPORT';
    const cleanPriority: SupportTicketPriority = VALID_PRIORITIES.includes(priority)
      ? priority
      : 'NORMAL';

    const ticket = await createSupportTicket({
      userId: user.id,
      category: cleanCategory,
      priority: cleanPriority,
      subject: String(subject),
      message: String(message),
    });

    // Site yöneticilerine (ADMIN) arka planda anlık bildirim gönder
    void (async () => {
      try {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });
        const shortSub =
          ticket.subject.length > 45
            ? `${ticket.subject.slice(0, 45)}...`
            : ticket.subject;
        for (const admin of admins) {
          if (admin.id !== user.id) {
            await createNotification({
              userId: admin.id,
              type: 'MENTION',
              actorUsername: user.username,
              actorDisplayName: user.displayName,
              actorAvatarColor: user.avatarColor,
              message: `yeni bir destek/talep bildirimi gönderdi: "${shortSub}"`,
              link: '/admin',
            });
          }
        }
      } catch {
        // ignore notification errors
      }
    })();

    return NextResponse.json({
      ticket: {
        ...ticket,
        userUsername: user.username,
        userDisplayName: user.displayName,
        userAvatarColor: user.avatarColor,
        userEmail: user.email,
      },
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    return NextResponse.json(
      { error: 'Talebiniz gönderilirken bir hata oluştu.' },
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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bu işlem için yönetici yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ticketId, status, adminReply } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Talep ID gerekli.' }, { status: 400 });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 });
    }

    if (adminReply !== undefined) {
      const replyLen = validateContentLength(
        String(adminReply),
        4000,
        'Yönetici yanıtı'
      );
      if (!replyLen.valid) {
        return NextResponse.json({ error: replyLen.error }, { status: 400 });
      }
    }

    const updated = await updateSupportTicket({
      id: String(ticketId),
      status,
      adminReply: adminReply !== undefined ? String(adminReply) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
    }

    // Kullanıcıya talebinin yanıtlandığına / güncellendiğine dair anlık bildirim gönder
    if (updated.userId !== user.id && (adminReply || status === 'RESOLVED')) {
      const shortSub =
        updated.subject.length > 42
          ? `${updated.subject.slice(0, 42)}...`
          : updated.subject;
      void createNotification({
        userId: updated.userId,
        type: 'SOLUTION',
        actorUsername: user.username,
        actorDisplayName: user.displayName,
        actorAvatarColor: user.avatarColor,
        message: adminReply
          ? `"${shortSub}" başlıklı destek/talep bildiriminizi yanıtladı.`
          : `"${shortSub}" başlıklı talebinizi çözüldü olarak işaretledi.`,
        link: '/destek',
      }).catch(() => {});
    }

    return NextResponse.json({ ticket: updated });
  } catch (error) {
    console.error('Update support ticket error:', error);
    return NextResponse.json(
      { error: 'Talep güncellenemedi.' },
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Talep ID gerekli.' }, { status: 400 });
    }

    const existing = await getSupportTicketById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
    }

    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bu talebi silme yetkiniz yok.' },
        { status: 403 }
      );
    }

    await deleteSupportTicket(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete support ticket error:', error);
    return NextResponse.json({ error: 'Silme başarısız.' }, { status: 500 });
  }
}

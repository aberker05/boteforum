import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { invalidateHomeCache } from '@/lib/homeCache';
import { checkActionCooldown, verifyRequestOrigin } from '@/lib/security';

export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Kaydetmek için giriş yapmalısınız.' },
        { status: 401 }
      );
    }

    const cooldown = checkActionCooldown(user.id, 'bookmark', 500);
    if (!cooldown.allowed) {
      return NextResponse.json(
        { error: 'Çok hızlı işlem yapıyorsunuz.' },
        { status: 429 }
      );
    }

    const { threadId } = await request.json();
    if (!threadId) {
      return NextResponse.json({ error: 'Konu ID gerekli.' }, { status: 400 });
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_threadId: {
          userId: user.id,
          threadId,
        },
      },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      invalidateHomeCache();
      return NextResponse.json({ bookmarked: false });
    } else {
      await prisma.bookmark.create({
        data: {
          userId: user.id,
          threadId,
        },
      });
      invalidateHomeCache();
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Bookmark error:', error);
    return NextResponse.json(
      { error: 'İşlem sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}

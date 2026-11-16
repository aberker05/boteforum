import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { checkContentModeration } from '@/lib/moderation';
import {
  checkActionCooldown,
  validateContentLength,
  verifyRequestOrigin,
} from '@/lib/security';
import {
  createTechNewsComment,
  getTechNewsCommentById,
  updateTechNewsComment,
  deleteTechNewsComment,
} from '@/lib/techNews';

export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Yorum yapmak için giriş yapmalısınız.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newsId, content, parentId } = body;

    if (!newsId || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Yorum içeriği boş olamaz.' },
        { status: 400 }
      );
    }

    const lenCheck = validateContentLength(content, 5000, 'Yorum');
    if (!lenCheck.valid) {
      return NextResponse.json({ error: lenCheck.error }, { status: 400 });
    }

    const modCheck = checkContentModeration(content);
    if (!modCheck.isClean) {
      return NextResponse.json({ error: modCheck.reason }, { status: 400 });
    }

    const cooldown = checkActionCooldown(user.id, 'comment', 5000);
    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          error: `Spam koruması: Yeni bir yorum göndermeden önce lütfen ${cooldown.waitSeconds} saniye bekleyin.`,
        },
        { status: 429 }
      );
    }

    const created = await createTechNewsComment({
      newsId,
      authorId: user.id,
      content,
      parentId: parentId || null,
    });

    return NextResponse.json({
      comment: {
        id: created.id,
        newsId,
        content: content.trim(),
        parentId: parentId || null,
        createdAt: created.createdAt,
        authorId: user.id,
        author: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarColor: user.avatarColor,
          role: user.role,
          reputation: user.reputation + 2,
        },
      },
    });
  } catch (error) {
    console.error('Create tech news comment error:', error);
    return NextResponse.json(
      { error: 'Yorum gönderilirken bir hata oluştu.' },
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
    const { commentId, content } = body;

    if (!commentId || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Yorum içeriği boş olamaz.' },
        { status: 400 }
      );
    }

    const lenCheck = validateContentLength(content, 5000, 'Yorum');
    if (!lenCheck.valid) {
      return NextResponse.json({ error: lenCheck.error }, { status: 400 });
    }

    const modCheck = checkContentModeration(content);
    if (!modCheck.isClean) {
      return NextResponse.json({ error: modCheck.reason }, { status: 400 });
    }

    const existing = await getTechNewsCommentById(commentId);
    if (!existing) {
      return NextResponse.json({ error: 'Yorum bulunamadı.' }, { status: 404 });
    }

    const isModerator = user.role === 'ADMIN' || user.role === 'MODERATOR';
    if (existing.authorId !== user.id && !isModerator) {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
    }

    await updateTechNewsComment(commentId, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update tech news comment error:', error);
    return NextResponse.json({ error: 'Güncelleme başarısız.' }, { status: 500 });
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
    const commentId = searchParams.get('id');
    if (!commentId) {
      return NextResponse.json({ error: 'Yorum ID gerekli.' }, { status: 400 });
    }

    const existing = await getTechNewsCommentById(commentId);
    if (!existing) {
      return NextResponse.json({ error: 'Yorum bulunamadı.' }, { status: 404 });
    }

    const isModerator = user.role === 'ADMIN' || user.role === 'MODERATOR';
    if (existing.authorId !== user.id && !isModerator) {
      return NextResponse.json({ error: 'Bu yorumu silme yetkiniz yok.' }, { status: 403 });
    }

    await deleteTechNewsComment(commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tech news comment error:', error);
    return NextResponse.json({ error: 'Silme başarısız.' }, { status: 500 });
  }
}


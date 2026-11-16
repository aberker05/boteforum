import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkContentModeration } from '@/lib/moderation';
import {
  checkActionCooldown,
  validateMarkdownContent,
  verifyRequestOrigin,
} from '@/lib/security';
import { createNotification, extractMentions } from '@/lib/notifications';

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
    const { threadId, content, parentId } = body;

    if (!threadId || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Yorum içeriği boş olamaz.' },
        { status: 400 }
      );
    }

    const lenCheck = validateMarkdownContent(content, 5000, 2, 'Yorum');
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

    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) {
      return NextResponse.json({ error: 'Konu bulunamadı.' }, { status: 404 });
    }

    if (thread.isLocked && user.role === 'MEMBER') {
      return NextResponse.json(
        { error: 'Bu konu yeni yorumlara kapatılmıştır.' },
        { status: 403 }
      );
    }

    if (parentId) {
      const parentCheck = await prisma.comment.findUnique({
        where: { id: String(parentId) },
        select: { id: true, threadId: true },
      });
      if (!parentCheck || parentCheck.threadId !== threadId) {
        return NextResponse.json(
          { error: 'Yanıtlanmak istenen üst yorum bu konuya ait değil.' },
          { status: 400 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        threadId,
        authorId: user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarColor: true,
            role: true,
            reputation: true,
          },
        },
        votes: true,
      },
    });

    // Yanıtı kullanıcıya anında döndür; puan, konu son aktivite zamanı ve bildirim işlemlerini arka planda yürüt
    void (async () => {
      try {
        await Promise.all([
          prisma.user.update({
            where: { id: user.id },
            data: { reputation: { increment: 2 } },
          }),
          prisma.thread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() },
          }),
        ]);

        const notifiedUserIds = new Set<string>([user.id]);
        const shortTitle =
          thread.title.length > 48 ? `${thread.title.slice(0, 48)}...` : thread.title;

        // 1. Alt yanıt ise üst yorum sahibine bildirim gönder
        if (parentId) {
          const parentComment = await prisma.comment.findUnique({
            where: { id: parentId },
          });
          if (parentComment && !notifiedUserIds.has(parentComment.authorId)) {
            notifiedUserIds.add(parentComment.authorId);
            await createNotification({
              userId: parentComment.authorId,
              type: 'REPLY',
              actorUsername: user.username,
              actorDisplayName: user.displayName,
              actorAvatarColor: user.avatarColor,
              message: `"${shortTitle}" konusundaki yorumunuza yanıt verdi.`,
              link: `/konu/${thread.slug}#yorumlar`,
            });
          }
        }

        // 2. Konu sahibine bildirim gönder
        if (!notifiedUserIds.has(thread.authorId)) {
          notifiedUserIds.add(thread.authorId);
          await createNotification({
            userId: thread.authorId,
            type: 'COMMENT',
            actorUsername: user.username,
            actorDisplayName: user.displayName,
            actorAvatarColor: user.avatarColor,
            message: `"${shortTitle}" başlıklı konunuza yorum yaptı.`,
            link: `/konu/${thread.slug}#yorumlar`,
          });
        }

        // 3. @kullanici_adi etiketlemeleri için bildirim gönder
        const mentionedUsernames = extractMentions(content);
        if (mentionedUsernames.length > 0) {
          const mentionedUsers = await prisma.user.findMany({
            where: { username: { in: mentionedUsernames } },
            select: { id: true },
          });
          for (const mu of mentionedUsers) {
            if (!notifiedUserIds.has(mu.id)) {
              notifiedUserIds.add(mu.id);
              await createNotification({
                userId: mu.id,
                type: 'MENTION',
                actorUsername: user.username,
                actorDisplayName: user.displayName,
                actorAvatarColor: user.avatarColor,
                message: `"${shortTitle}" konusundaki bir yorumda sizden bahsetti (@${user.username}).`,
                link: `/konu/${thread.slug}#yorumlar`,
              });
            }
          }
        }
      } catch (bgErr) {
        console.error('Comment background task error:', bgErr);
      }
    })();

    return NextResponse.json({
      comment: {
        ...comment,
        score: 0,
        userVote: 0,
      },
    });
  } catch (error) {
    console.error('Create comment error:', error);
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
    const { commentId, action, content } = body;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { thread: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Yorum bulunamadı.' }, { status: 404 });
    }

    const isModerator = user.role === 'ADMIN' || user.role === 'MODERATOR';
    const isThreadAuthor = comment.thread.authorId === user.id;
    const isCommentAuthor = comment.authorId === user.id;

    if (action === 'edit' && (isCommentAuthor || isModerator)) {
      if (!content || !content.trim()) {
        return NextResponse.json(
          { error: 'Yorum içeriği boş olamaz.' },
          { status: 400 }
        );
      }
      const lenCheck = validateMarkdownContent(content, 5000, 2, 'Yorum');
      if (!lenCheck.valid) {
        return NextResponse.json({ error: lenCheck.error }, { status: 400 });
      }
      const modCheck = checkContentModeration(content);
      if (!modCheck.isClean) {
        return NextResponse.json({ error: modCheck.reason }, { status: 400 });
      }
      const updated = await prisma.comment.update({
        where: { id: comment.id },
        data: { content: content.trim() },
      });
      return NextResponse.json({ comment: updated });
    }

    if (action === 'toggleAccept' && (isThreadAuthor || isModerator)) {
      const newStatus = !comment.isAccepted;

      if (newStatus) {
        // Aynı konudaki diğer çözümleri kaldır
        await prisma.comment.updateMany({
          where: { threadId: comment.threadId },
          data: { isAccepted: false },
        });
      }

      await prisma.comment.update({
        where: { id: comment.id },
        data: { isAccepted: newStatus },
      });

      await prisma.thread.update({
        where: { id: comment.threadId },
        data: { isSolved: newStatus },
      });

      if (newStatus && comment.authorId !== user.id) {
        await prisma.user.update({
          where: { id: comment.authorId },
          data: { reputation: { increment: 15 } },
        });

        const shortTitle =
          comment.thread.title.length > 48
            ? `${comment.thread.title.slice(0, 48)}...`
            : comment.thread.title;

        await createNotification({
          userId: comment.authorId,
          type: 'SOLUTION',
          actorUsername: user.username,
          actorDisplayName: user.displayName,
          actorAvatarColor: user.avatarColor,
          message: `"${shortTitle}" konusundaki yanıtınızı çözüm olarak kabul etti! (+15 puan)`,
          link: `/konu/${comment.thread.slug}#yorumlar`,
        });
      }

      return NextResponse.json({ isAccepted: newStatus });
    }

    return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
  } catch (error) {
    console.error('Patch comment error:', error);
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
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

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: 'Yorum bulunamadı.' }, { status: 404 });
    }

    const isModerator = user.role === 'ADMIN' || user.role === 'MODERATOR';
    if (comment.authorId !== user.id && !isModerator) {
      return NextResponse.json({ error: 'Bu yorumu silme yetkiniz yok.' }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    // Silinen yorum kabul edilmiş çözüm ise konunun "Çözüldü" durumunu senkronize et
    if (comment.isAccepted) {
      const remainingAccepted = await prisma.comment.count({
        where: { threadId: comment.threadId, isAccepted: true },
      });
      if (remainingAccepted === 0) {
        await prisma.thread
          .update({
            where: { id: comment.threadId },
            data: { isSolved: false },
          })
          .catch(() => null);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Silme başarısız.' }, { status: 500 });
  }
}

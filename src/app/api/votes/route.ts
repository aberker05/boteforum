import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, invalidateUserCache } from '@/lib/auth';
import { invalidateHomeCache } from '@/lib/homeCache';
import { createNotification } from '@/lib/notifications';
import { checkActionCooldown, verifyRequestOrigin } from '@/lib/security';

export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Beğenmek için giriş yapmalısınız.' },
        { status: 401 }
      );
    }

    const cooldown = checkActionCooldown(user.id, 'vote', 400);
    if (!cooldown.allowed) {
      return NextResponse.json(
        { error: 'Çok hızlı işlem yapıyorsunuz, lütfen biraz bekleyin.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { threadId, commentId } = body;

    if (threadId) {
      const thread = await prisma.thread.findUnique({ where: { id: threadId } });
      if (!thread) {
        return NextResponse.json({ error: 'Konu bulunamadı.' }, { status: 404 });
      }

      if (thread.authorId === user.id) {
        return NextResponse.json(
          { error: 'Kendi açtığınız konuyu beğenemezsiniz.' },
          { status: 400 }
        );
      }

      const existing = await prisma.vote.findUnique({
        where: {
          userId_threadId: {
            userId: user.id,
            threadId,
          },
        },
      });

      if (existing && existing.value === 1) {
        // Beğeniyi geri çek
        await prisma.vote.delete({ where: { id: existing.id } });
        prisma.user
          .update({
            where: { id: thread.authorId },
            data: { reputation: { increment: -5 } },
          })
          .then(() => invalidateUserCache(thread.authorId))
          .catch(() => {});
      } else if (existing) {
        await prisma.vote.update({
          where: { id: existing.id },
          data: { value: 1 },
        });
        prisma.user
          .update({
            where: { id: thread.authorId },
            data: { reputation: { increment: 5 } },
          })
          .then(() => invalidateUserCache(thread.authorId))
          .catch(() => {});
      } else {
        await prisma.vote.create({
          data: {
            userId: user.id,
            threadId,
            value: 1,
          },
        });

        const shortTitle =
          thread.title.length > 48
            ? `${thread.title.length > 48 ? `${thread.title.slice(0, 48)}...` : thread.title}`
            : thread.title;

        Promise.all([
          prisma.user.update({
            where: { id: thread.authorId },
            data: { reputation: { increment: 5 } },
          }),
          createNotification({
            userId: thread.authorId,
            type: 'UPVOTE',
            actorUsername: user.username,
            actorDisplayName: user.displayName,
            actorAvatarColor: user.avatarColor,
            message: `"${shortTitle}" başlıklı konunuzu faydalı buldu (+5 puan).`,
            link: `/konu/${thread.slug}`,
          }),
        ])
          .then(() => invalidateUserCache(thread.authorId))
          .catch(() => {});
      }

      const votes = await prisma.vote.findMany({
        where: { threadId, value: 1 },
      });
      const score = votes.length;
      const userVote = votes.some((v) => v.userId === user.id) ? 1 : 0;

      invalidateHomeCache();
      return NextResponse.json({ score, userVote });
    }

    if (commentId) {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { thread: true },
      });
      if (!comment) {
        return NextResponse.json({ error: 'Yorum bulunamadı.' }, { status: 404 });
      }

      if (comment.authorId === user.id) {
        return NextResponse.json(
          { error: 'Kendi yorumunuzu beğenemezsiniz.' },
          { status: 400 }
        );
      }

      const existing = await prisma.vote.findUnique({
        where: {
          userId_commentId: {
            userId: user.id,
            commentId,
          },
        },
      });

      if (existing && existing.value === 1) {
        await prisma.vote.delete({ where: { id: existing.id } });
        prisma.user
          .update({
            where: { id: comment.authorId },
            data: { reputation: { increment: -5 } },
          })
          .then(() => invalidateUserCache(comment.authorId))
          .catch(() => {});
      } else if (existing) {
        await prisma.vote.update({
          where: { id: existing.id },
          data: { value: 1 },
        });
        prisma.user
          .update({
            where: { id: comment.authorId },
            data: { reputation: { increment: 5 } },
          })
          .then(() => invalidateUserCache(comment.authorId))
          .catch(() => {});
      } else {
        await prisma.vote.create({
          data: {
            userId: user.id,
            commentId,
            value: 1,
          },
        });

        const shortTitle =
          comment.thread.title.length > 48
            ? `${comment.thread.title.slice(0, 48)}...`
            : comment.thread.title;

        Promise.all([
          prisma.user.update({
            where: { id: comment.authorId },
            data: { reputation: { increment: 5 } },
          }),
          createNotification({
            userId: comment.authorId,
            type: 'UPVOTE',
            actorUsername: user.username,
            actorDisplayName: user.displayName,
            actorAvatarColor: user.avatarColor,
            message: `"${shortTitle}" konusundaki yanıtınızı faydalı buldu (+5 puan).`,
            link: `/konu/${comment.thread.slug}#yorum-${comment.id}`,
          }),
        ])
          .then(() => invalidateUserCache(comment.authorId))
          .catch(() => {});
      }

      const votes = await prisma.vote.findMany({
        where: { commentId, value: 1 },
      });
      const score = votes.length;
      const userVote = votes.some((v) => v.userId === user.id) ? 1 : 0;

      invalidateHomeCache();
      return NextResponse.json({ score, userVote });
    }

    return NextResponse.json({ error: 'Hedef belirtilmedi.' }, { status: 400 });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'İşlem sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}

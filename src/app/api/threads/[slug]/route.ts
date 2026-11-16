import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkContentModeration } from '@/lib/moderation';
import {
  validateContentLength,
  validateMarkdownContent,
  verifyRequestOrigin,
} from '@/lib/security';
import { ensurePollTables } from '@/lib/polls';
import { ensureReportTable } from '@/lib/reports';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 401 });
    }

    const { slug } = await context.params;
    const thread = await prisma.thread.findUnique({ where: { slug } });

    if (!thread) {
      return NextResponse.json({ error: 'Konu bulunamadı.' }, { status: 404 });
    }

    const body = await request.json();
    const { action, title, content, tags, categoryId } = body;

    const isModerator = user.role === 'ADMIN' || user.role === 'MODERATOR';
    const isAuthor = thread.authorId === user.id;

    if (action === 'togglePin' && isModerator) {
      const updated = await prisma.thread.update({
        where: { id: thread.id },
        data: { isPinned: !thread.isPinned },
      });
      return NextResponse.json({ thread: updated });
    }

    if (action === 'toggleLock' && isModerator) {
      const updated = await prisma.thread.update({
        where: { id: thread.id },
        data: { isLocked: !thread.isLocked },
      });
      return NextResponse.json({ thread: updated });
    }

    if (action === 'toggleSolved' && (isAuthor || isModerator)) {
      const nextSolved = !thread.isSolved;
      const updated = await prisma.thread.update({
        where: { id: thread.id },
        data: { isSolved: nextSolved },
      });
      if (!nextSolved) {
        await prisma.comment.updateMany({
          where: { threadId: thread.id, isAccepted: true },
          data: { isAccepted: false },
        });
      }
      return NextResponse.json({ thread: updated });
    }

    if (action === 'moveCategory' && (isAuthor || isModerator)) {
      if (!categoryId || typeof categoryId !== 'string') {
        return NextResponse.json({ error: 'Geçerli bir kategori seçilmelidir.' }, { status: 400 });
      }
      const targetCat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!targetCat) {
        return NextResponse.json({ error: 'Seçilen kategori bulunamadı.' }, { status: 404 });
      }
      const updated = await prisma.thread.update({
        where: { id: thread.id },
        data: { categoryId: targetCat.id },
      });
      return NextResponse.json({ thread: updated });
    }

    if (action === 'edit' && (isAuthor || isModerator)) {
      const nextTitle = title ? title.trim() : thread.title;
      const nextContent = content ? content.trim() : thread.content;

      if (nextTitle.length < 5) {
        return NextResponse.json(
          { error: 'Konu başlığı en az 5 karakter olmalıdır.' },
          { status: 400 }
        );
      }

      const titleLen = validateContentLength(nextTitle, 160, 'Konu başlığı');
      if (!titleLen.valid) {
        return NextResponse.json({ error: titleLen.error }, { status: 400 });
      }

      const contentLen = validateMarkdownContent(nextContent, 25000, 4, 'Konu içeriği');
      if (!contentLen.valid) {
        return NextResponse.json({ error: contentLen.error }, { status: 400 });
      }

      let nextCategoryId = thread.categoryId;
      if (categoryId && typeof categoryId === 'string' && categoryId !== thread.categoryId) {
        const targetCat = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!targetCat) {
          return NextResponse.json({ error: 'Seçilen kategori bulunamadı.' }, { status: 400 });
        }
        nextCategoryId = targetCat.id;
      }

      const modCheck = checkContentModeration(`${nextTitle} ${nextContent} ${tags || ''}`);
      if (!modCheck.isClean) {
        return NextResponse.json({ error: modCheck.reason }, { status: 400 });
      }

      const cleanTags =
        typeof tags === 'string'
          ? tags
              .split(',')
              .map((t: string) => t.trim().toLowerCase())
              .filter(Boolean)
              .slice(0, 5)
              .join(',')
          : thread.tags;

      const updated = await prisma.thread.update({
        where: { id: thread.id },
        data: {
          title: nextTitle,
          content: nextContent,
          tags: cleanTags,
          categoryId: nextCategoryId,
        },
      });
      return NextResponse.json({ thread: updated });
    }

    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
  } catch (error) {
    console.error('Update thread error:', error);
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 401 });
    }

    const { slug } = await context.params;
    const thread = await prisma.thread.findUnique({ where: { slug } });

    if (!thread) {
      return NextResponse.json({ error: 'Konu bulunamadı.' }, { status: 404 });
    }

    const isModerator = user.role === 'ADMIN' || user.role === 'MODERATOR';
    if (thread.authorId !== user.id && !isModerator) {
      return NextResponse.json({ error: 'Bu konuyu silme yetkiniz yok.' }, { status: 403 });
    }

    await prisma.thread.delete({ where: { id: thread.id } });

    // İlişkili anket ve rapor kayıtlarını da temizle
    try {
      await ensurePollTables();
      const polls = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "ThreadPoll" WHERE "threadId" = ${thread.id}
      `;
      for (const p of polls) {
        await prisma.$executeRaw`DELETE FROM "ThreadPollVote" WHERE "pollId" = ${p.id}`;
        await prisma.$executeRaw`DELETE FROM "ThreadPollOption" WHERE "pollId" = ${p.id}`;
      }
      await prisma.$executeRaw`DELETE FROM "ThreadPoll" WHERE "threadId" = ${thread.id}`;

      await ensureReportTable();
      await prisma.$executeRaw`
        DELETE FROM "ContentReport" WHERE "targetType" = 'THREAD' AND "targetId" = ${thread.id}
      `;
    } catch {
      // Ek tablo temizleme hatası ana silme işlemini engellemez
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete thread error:', error);
    return NextResponse.json({ error: 'Silme işlemi başarısız.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { invalidateHomeCache } from '@/lib/homeCache';
import {
  checkActionCooldown,
  validateContentLength,
  verifyRequestOrigin,
} from '@/lib/security';
import {
  getAllReports,
  createContentReport,
  getReportById,
  updateReportStatus,
  deleteReportById,
} from '@/lib/reports';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
    }

    const reports = await getAllReports();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ error: 'Raporlar yüklenemedi.' }, { status: 500 });
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
        { error: 'İçerik raporlamak için giriş yapmalısınız.' },
        { status: 401 }
      );
    }

    const cooldown = checkActionCooldown(user.id, 'report', 10000);
    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          error: `Çok sık rapor gönderiyorsunuz. Lütfen ${cooldown.waitSeconds} saniye bekleyin.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { targetType, targetId, reason, details } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: 'Rapor türü, hedef ve sebep zorunludur.' },
        { status: 400 }
      );
    }

    const reasonLen = validateContentLength(String(reason), 200, 'Rapor sebebi');
    if (!reasonLen.valid) {
      return NextResponse.json({ error: reasonLen.error }, { status: 400 });
    }

    if (details) {
      const detailsLen = validateContentLength(String(details), 1000, 'Rapor açıklaması');
      if (!detailsLen.valid) {
        return NextResponse.json({ error: detailsLen.error }, { status: 400 });
      }
    }

    let threadSlug = '';
    let targetSummary = '';

    if (targetType === 'THREAD') {
      const thread = await prisma.thread.findUnique({
        where: { id: targetId },
        select: { slug: true, title: true },
      });
      if (!thread) {
        return NextResponse.json({ error: 'Konu bulunamadı.' }, { status: 404 });
      }
      threadSlug = thread.slug;
      targetSummary = `Konu: ${thread.title}`;
    } else if (targetType === 'COMMENT') {
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
        include: { thread: { select: { slug: true } } },
      });
      if (!comment) {
        return NextResponse.json({ error: 'Yorum bulunamadı.' }, { status: 404 });
      }
      threadSlug = comment.thread.slug;
      targetSummary = `Yorum: ${comment.content}`;
    } else {
      return NextResponse.json({ error: 'Geçersiz rapor türü.' }, { status: 400 });
    }

    const report = await createContentReport({
      reporterId: user.id,
      targetType,
      targetId,
      threadSlug,
      targetSummary,
      reason,
      details,
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: 'Rapor gönderilirken bir hata oluştu.' },
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
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
    }

    const body = await request.json();
    const { reportId, action } = body;

    const report = await getReportById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 });
    }

    if (action === 'dismiss') {
      await updateReportStatus(reportId, 'DISMISSED');
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteContent') {
      if (report.targetType === 'THREAD') {
        await prisma.thread
          .delete({ where: { id: report.targetId } })
          .catch(() => null);
      } else if (report.targetType === 'COMMENT') {
        const deletedComment = await prisma.comment
          .delete({ where: { id: report.targetId } })
          .catch(() => null);
        if (deletedComment?.isAccepted) {
          await prisma.thread
            .update({
              where: { id: deletedComment.threadId },
              data: { isSolved: false },
            })
            .catch(() => null);
        }
      }
      await updateReportStatus(reportId, 'RESOLVED');
      invalidateHomeCache();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error) {
    console.error('Patch report error:', error);
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Rapor ID gerekli.' }, { status: 400 });
    }

    await deleteReportById(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json({ error: 'Silme başarısız.' }, { status: 500 });
  }
}


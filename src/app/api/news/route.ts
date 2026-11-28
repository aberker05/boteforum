import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  validateContentLength,
  validateMarkdownContent,
  verifyRequestOrigin,
} from '@/lib/security';
import { isSafeLogoUrl } from '@/lib/siteSettings';
import { isSafeVideoUrl } from '@/lib/videoUtils';
import {
  getAllTechNews,
  createTechNews,
  updateTechNews,
  deleteTechNews,
} from '@/lib/techNews';

export async function GET() {
  try {
    const news = await getAllTechNews();
    return NextResponse.json({ news });
  } catch (error) {
    console.error('Get tech news error:', error);
    return NextResponse.json(
      { error: 'Teknoloji gelişmeleri yüklenemedi.' },
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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Teknolojik gelişme ekleme yetkisi yalnızca yöneticilere (ADMIN) aittir.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      summary,
      content,
      category,
      badgeColor,
      source,
      readTime,
      isFeatured,
      imageUrl,
      videoUrl,
    } = body;

    if (!title || !summary || !content || !category) {
      return NextResponse.json(
        { error: 'Başlık, özet, kategori ve detaylı içerik zorunludur.' },
        { status: 400 }
      );
    }

    if (imageUrl && imageUrl !== 'none' && !isSafeLogoUrl(String(imageUrl))) {
      return NextResponse.json(
        { error: 'Geçersiz kapak görseli formatı veya adresi.' },
        { status: 400 }
      );
    }

    if (videoUrl && videoUrl !== 'none' && !isSafeVideoUrl(String(videoUrl))) {
      return NextResponse.json(
        {
          error:
            'Geçersiz video bağlantısı. Lütfen YouTube, Vimeo, Loom veya MP4/WebM adresi girin.',
        },
        { status: 400 }
      );
    }

    const titleCheck = validateContentLength(String(title), 180, 'Başlık');
    if (!titleCheck.valid) {
      return NextResponse.json({ error: titleCheck.error }, { status: 400 });
    }

    const summaryCheck = validateContentLength(String(summary), 600, 'Özet');
    if (!summaryCheck.valid) {
      return NextResponse.json({ error: summaryCheck.error }, { status: 400 });
    }

    const contentCheck = validateMarkdownContent(String(content), 30000, 4, 'Haber içeriği');
    if (!contentCheck.valid) {
      return NextResponse.json({ error: contentCheck.error }, { status: 400 });
    }

    const item = await createTechNews({
      title,
      summary,
      content,
      category,
      badgeColor: typeof badgeColor === 'string' ? badgeColor : undefined,
      source: source || `@${user.username} • Teknoloji Radarı`,
      readTime: readTime || '3 dk okuma',
      isFeatured: Boolean(isFeatured),
      imageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
      videoUrl: typeof videoUrl === 'string' ? videoUrl : undefined,
    });

    return NextResponse.json({ news: item });
  } catch (error) {
    console.error('Create tech news error:', error);
    return NextResponse.json(
      { error: 'Teknolojik gelişme eklenirken bir hata oluştu.' },
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
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Düzenleme işlemi için yönetici veya moderatör yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      id,
      title,
      summary,
      content,
      category,
      badgeColor,
      source,
      readTime,
      isFeatured,
      imageUrl,
      videoUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Haber ID gerekli.' }, { status: 400 });
    }

    if (
      imageUrl !== undefined &&
      imageUrl !== '' &&
      imageUrl !== 'none' &&
      !isSafeLogoUrl(String(imageUrl))
    ) {
      return NextResponse.json(
        { error: 'Geçersiz kapak görseli formatı veya adresi.' },
        { status: 400 }
      );
    }

    if (
      videoUrl !== undefined &&
      videoUrl !== '' &&
      videoUrl !== 'none' &&
      !isSafeVideoUrl(String(videoUrl))
    ) {
      return NextResponse.json(
        {
          error:
            'Geçersiz video bağlantısı. Lütfen YouTube, Vimeo, Loom veya MP4/WebM adresi girin.',
        },
        { status: 400 }
      );
    }

    if (title !== undefined) {
      const titleCheck = validateContentLength(String(title), 180, 'Başlık');
      if (!titleCheck.valid) {
        return NextResponse.json({ error: titleCheck.error }, { status: 400 });
      }
    }

    if (summary !== undefined) {
      const summaryCheck = validateContentLength(String(summary), 600, 'Özet');
      if (!summaryCheck.valid) {
        return NextResponse.json({ error: summaryCheck.error }, { status: 400 });
      }
    }

    if (content !== undefined) {
      const contentCheck = validateMarkdownContent(
        String(content),
        30000,
        4,
        'Haber içeriği'
      );
      if (!contentCheck.valid) {
        return NextResponse.json({ error: contentCheck.error }, { status: 400 });
      }
    }

    const updated = await updateTechNews({
      id: String(id),
      title,
      summary,
      content,
      category,
      badgeColor: typeof badgeColor === 'string' ? badgeColor : undefined,
      source,
      readTime,
      isFeatured:
        typeof isFeatured === 'boolean' ? isFeatured : undefined,
      imageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
      videoUrl: typeof videoUrl === 'string' ? videoUrl : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Haber bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ news: updated });
  } catch (error) {
    console.error('Update tech news error:', error);
    return NextResponse.json(
      { error: 'Güncelleme işlemi başarısız.' },
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
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Silme işlemi için yönetici veya moderatör yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Haber ID gerekli.' }, { status: 400 });
    }

    await deleteTechNews(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tech news error:', error);
    return NextResponse.json(
      { error: 'Silme işlemi başarısız.' },
      { status: 500 }
    );
  }
}

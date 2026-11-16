import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getSiteSettings,
  isSafeLogoUrl,
  updateSiteSettings,
} from '@/lib/siteSettings';
import { verifyRequestOrigin } from '@/lib/security';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get site settings error:', error);
    return NextResponse.json(
      { error: 'Site ayarları yüklenemedi.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json(
        { error: 'Geçersiz istek kaynağı.' },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Site ayarlarını değiştirme yetkisi yalnızca yöneticilere aittir.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (
      body.siteNamePrimary !== undefined &&
      String(body.siteNamePrimary).trim().length < 2
    ) {
      return NextResponse.json(
        { error: 'Site ana adı en az 2 karakter olmalıdır.' },
        { status: 400 }
      );
    }

    // Yüklenen base64 görsel veya URL boyut ve güvenlik kontrolü (maks ~1.5MB)
    if (body.logoImageUrl) {
      if (String(body.logoImageUrl).length > 2_000_000) {
        return NextResponse.json(
          { error: 'Logo görseli çok büyük. Lütfen 1.5 MB altında bir görsel seçin.' },
          { status: 400 }
        );
      }
      if (!isSafeLogoUrl(String(body.logoImageUrl))) {
        return NextResponse.json(
          {
            error:
              'Güvenlik nedeniyle yalnızca PNG, JPG, WEBP, GIF görselleri veya güvenli HTTPS/yerel bağlantılar kullanılabilir.',
          },
          { status: 400 }
        );
      }
    }

    const settings = await updateSiteSettings({
      siteNamePrimary: body.siteNamePrimary,
      siteNameAccent: body.siteNameAccent,
      siteTagline: body.siteTagline,
      logoType: body.logoType,
      logoIcon: body.logoIcon,
      logoText: body.logoText,
      logoImageUrl: body.logoImageUrl,
      brandColor: body.brandColor,
      footerDescription: body.footerDescription,
      copyrightText: body.copyrightText,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update site settings error:', error);
    return NextResponse.json(
      { error: 'Site ayarları kaydedilirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}


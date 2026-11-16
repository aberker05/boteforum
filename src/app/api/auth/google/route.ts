import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  signToken,
  COOKIE_NAME,
  OAUTH_STATE_COOKIE,
  findOrCreateGoogleUser,
} from '@/lib/auth';
import { checkContentModeration } from '@/lib/moderation';
import {
  checkRateLimit,
  getClientIp,
  validateContentLength,
  verifyRequestOrigin,
} from '@/lib/security';

// GET /api/auth/google -> Gerçek GOOGLE_CLIENT_ID tanımlıysa CSRF state çerezi ile Google OAuth ekranına yönlendirir
export async function GET(request: Request) {
  const url = new URL(request.url);
  const isCheckOnly = url.searchParams.get('check') === '1';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const isConfigured = Boolean(clientId && clientSecret);

  if (isCheckOnly || !isConfigured || !clientId) {
    return NextResponse.json({
      oauthConfigured: isConfigured,
      authUrl: isConfigured ? '/api/auth/google' : null,
      message: isConfigured
        ? 'Google OAuth 2.0 aktif.'
        : 'GOOGLE_CLIENT_ID tanımlı değil; yerel Google OAuth hızlı giriş ekranı kullanılıyor.',
    });
  }

  const origin = url.origin;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  const state = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 dakika
  });

  return response;
}

// POST /api/auth/google -> Geliştirme / Demo modunda Google hızlı giriş simülatörü
export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    // Gerçek Google OAuth yapılandırılmışsa doğrulamasız POST simülatörünü kapat
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Lütfen resmi Google OAuth yönlendirmesini kullanın.' },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const rate = checkRateLimit(`google_demo:${ip}`, 15, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla deneme yapıldı. Lütfen biraz bekleyin.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, displayName } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Lütfen geçerli bir Google e-posta adresi girin (örn: ad.soyad@gmail.com).' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const rawName = typeof displayName === 'string' ? displayName.trim() : '';

    if (rawName) {
      const lenCheck = validateContentLength(rawName, 40, 'Ad Soyad');
      if (!lenCheck.valid) {
        return NextResponse.json({ error: lenCheck.error }, { status: 400 });
      }
    }

    const modCheck = checkContentModeration(`${cleanEmail} ${rawName}`);
    if (!modCheck.isClean) {
      return NextResponse.json(
        { error: 'Görünen ad veya e-posta adresi uygunsuz ifadeler içeremez.' },
        { status: 400 }
      );
    }

    // KRİTİK GÜVENLİK KONTROLÜ: Yönetici, Moderatör veya şifreyle kayıtlı hesaplara simülatörle şifresiz girilemez!
    const existingAccount = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingAccount && existingAccount.role === 'BANNED') {
      return NextResponse.json(
        {
          error:
            'Bu hesap topluluk kuralları ihlali nedeniyle askıya alınmıştır (yasaklanmıştır).',
        },
        { status: 403 }
      );
    }

    if (
      existingAccount &&
      (existingAccount.role === 'ADMIN' ||
        existingAccount.role === 'MODERATOR' ||
        !existingAccount.bio?.includes('Google hesabı ile katıldı.'))
    ) {
      return NextResponse.json(
        {
          error:
            'Bu e-posta adresi şifreli bir hesap olarak kayıtlıdır. Güvenlik nedeniyle lütfen kullanıcı adı ve şifrenizle giriş yapın.',
        },
        { status: 403 }
      );
    }

    const nameFromEmail = cleanEmail
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const user = await findOrCreateGoogleUser(
      cleanEmail,
      rawName || nameFromEmail
    );

    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarColor: user.avatarColor,
        role: user.role,
        reputation: user.reputation,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Google ile giriş yapılırken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

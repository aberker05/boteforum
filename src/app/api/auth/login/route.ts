import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  checkRateLimit,
  getClientIp,
  verifyRequestOrigin,
} from '@/lib/security';

export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json(
        { error: 'Geçersiz istek kaynağı (CSRF koruması).' },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const ipRate = checkRateLimit(`login_ip:${ip}`, 15, 10 * 60 * 1000);
    if (!ipRate.allowed) {
      return NextResponse.json(
        {
          error: `Ağınızdan çok fazla giriş denemesi yapıldı. Lütfen ${ipRate.retryAfterSeconds} saniye bekleyin.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { identifier, password, rememberMe } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Kullanıcı adı/e-posta ve şifre gereklidir.' },
        { status: 400 }
      );
    }

    const normalizedIdentifier = String(identifier).trim().toLowerCase();

    const rateCheck = checkLoginRateLimit(normalizedIdentifier);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.retryAfterSeconds || 60) / 60);
      return NextResponse.json(
        {
          error: `Çok fazla başarısız giriş denemesi yaptınız. Güvenliğiniz için bu hesap ${minutes} dakika boyunca geçici olarak kilitlendi.`,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { username: normalizedIdentifier },
        ],
      },
    });

    if (!user) {
      const fail = recordFailedLogin(normalizedIdentifier);
      return NextResponse.json(
        {
          error: fail.locked
            ? '5 başarısız deneme sonucu giriş 15 dakika kilitlendi.'
            : `Geçersiz kullanıcı adı veya şifre. (Kalan deneme hakkı: ${fail.remainingAttempts})`,
        },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) {
      const fail = recordFailedLogin(normalizedIdentifier);
      return NextResponse.json(
        {
          error: fail.locked
            ? '5 başarısız deneme sonucu giriş 15 dakika kilitlendi.'
            : `Geçersiz kullanıcı adı veya şifre. (Kalan deneme hakkı: ${fail.remainingAttempts})`,
        },
        { status: 401 }
      );
    }

    if (user.role === 'BANNED') {
      return NextResponse.json(
        {
          error:
            'Hesabınız topluluk kuralları ihlali nedeniyle yönetici tarafından askıya alınmıştır (yasaklanmıştır).',
        },
        { status: 403 }
      );
    }

    clearLoginAttempts(normalizedIdentifier);

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
      ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Giriş yapılırken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

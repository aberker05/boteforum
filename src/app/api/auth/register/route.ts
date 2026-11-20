import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import { checkContentModeration } from '@/lib/moderation';
import {
  checkRateLimit,
  getClientIp,
  validateContentLength,
  validatePasswordStrength,
  verifyRequestOrigin,
} from '@/lib/security';

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e'
];

export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const ip = getClientIp(request);
    const rate = checkRateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Çok fazla kayıt denemesi. Lütfen ${rate.retryAfterSeconds} saniye sonra tekrar deneyin.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, email, password, displayName } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Kullanıcı adı, e-posta ve şifre zorunludur.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return NextResponse.json(
        { error: 'Lütfen geçerli bir e-posta adresi girin.' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3 || cleanUsername.length > 24) {
      return NextResponse.json(
        { error: 'Kullanıcı adı 3 ile 24 karakter arasında olmalıdır (harf, rakam ve alt çizgi).' },
        { status: 400 }
      );
    }

    const cleanDisplayName = String(displayName || cleanUsername).trim();
    const nameLen = validateContentLength(cleanDisplayName, 40, 'Görünen ad');
    if (!nameLen.valid) {
      return NextResponse.json({ error: nameLen.error }, { status: 400 });
    }

    const modCheck = checkContentModeration(`${cleanUsername} ${cleanDisplayName}`);
    if (!modCheck.isClean) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya görünen ad uygunsuz ifadeler içeremez.' },
        { status: 400 }
      );
    }

    const pwCheck = validatePasswordStrength(String(password));
    if (!pwCheck.valid) {
      return NextResponse.json(
        { error: pwCheck.error },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanUsername }, { email: email.trim().toLowerCase() }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Bu kullanıcı adı veya e-posta adresi zaten kullanımda.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    // Yeni kurulan boş bir veritabanında kayıt olan ilk kullanıcıyı otomatik ADMIN yap
    const totalUsers = await prisma.user.count();
    const isFirstUser = totalUsers === 0;

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        displayName: (displayName || cleanUsername).trim(),
        avatarColor: randomColor,
        role: isFirstUser ? 'ADMIN' : 'MEMBER',
        reputation: isFirstUser ? 600 : 0,
      },
    });

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
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Kayıt olurken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

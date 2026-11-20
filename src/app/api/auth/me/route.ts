import { NextResponse } from 'next/server';
import { getCurrentUser, signToken, COOKIE_NAME } from '@/lib/auth';
import { verifyRequestOrigin } from '@/lib/security';

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

// Kullanıcının aktif oturum tercihini (Kalıcı 30 Gün vs Sekme Kapanınca Sonlanan Oturum) günceller
export async function PATCH(request: Request) {
  if (!verifyRequestOrigin(request)) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rememberMe = Boolean(body?.rememberMe);

  const token = await signToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  const response = NextResponse.json({
    success: true,
    rememberMe,
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });

  return response;
}

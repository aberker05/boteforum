import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { OAUTH_STATE_COOKIE } from '@/lib/auth';

// GET /api/auth/google -> Resmi Google OAuth 2.0 yetkilendirme akışı (Kriptografik CSRF State korumalı)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const isCheckOnly = url.searchParams.get('check') === '1';
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const isConfigured = Boolean(clientId && clientSecret);

  if (isCheckOnly) {
    return NextResponse.json({
      oauthConfigured: isConfigured,
    });
  }

  if (!isConfigured || !clientId) {
    return NextResponse.redirect(
      `${url.origin}/giris?error=google_yapilandirma_eksik`
    );
  }

  const origin = url.origin;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${origin}/api/auth/google/callback`;

  // Kriptografik olarak güvenli 256-bit CSRF State anahtarı
  const state = randomBytes(32).toString('hex');

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
    maxAge: 60 * 10, // 10 dakika geçerli
  });

  return response;
}

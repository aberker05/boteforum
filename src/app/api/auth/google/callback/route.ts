import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  signToken,
  COOKIE_NAME,
  OAUTH_STATE_COOKIE,
  findOrCreateGoogleUser,
} from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const origin = url.origin;

    if (!code) {
      return NextResponse.redirect(`${origin}/giris?error=google_iptal`);
    }

    // OAuth CSRF State Doğrulaması
    const cookieStore = await cookies();
    const savedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
    if (!state || !savedState || state !== savedState) {
      return NextResponse.redirect(`${origin}/giris?error=google_guvenlik_dogrulamasi_basarisiz`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${origin}/giris?error=google_yapilandirma_eksik`);
    }

    // 1. Yetki kodunu (code) Google Access Token ile değiştir
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(`${origin}/giris?error=google_token_hatasi`);
    }

    // 2. Google kullanıcı profil bilgilerini al
    const profileRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email || profile.verified_email === false) {
      return NextResponse.redirect(`${origin}/giris?error=google_profil_hatasi`);
    }

    // 3. Veritabanında kullanıcıyı bul veya oluştur
    const user = await findOrCreateGoogleUser(
      profile.email,
      profile.name || profile.given_name || profile.email.split('@')[0]
    );

    if (user.role === 'BANNED') {
      return NextResponse.redirect(`${origin}/giris?error=hesap_askiya_alindi`);
    }

    const jwt = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.redirect(`${origin}/`);
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/giris?error=google_beklenmeyen_hata`);
  }
}

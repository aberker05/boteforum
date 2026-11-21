import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, invalidateUserCache } from '@/lib/auth';
import { verifyRequestOrigin } from '@/lib/security';

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
  }

  invalidateUserCache();

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  const response = NextResponse.json(
    { success: true },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

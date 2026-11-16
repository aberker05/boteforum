import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'novaforum_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-forum-jwt-key-2026-modern-discourse'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');
  const isNewThreadPage = pathname.startsWith('/yeni-konu');

  if (!isAdminPage && !isAdminApi && !isNewThreadPage) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/giris', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if ((isAdminPage || isAdminApi) && payload.role !== 'ADMIN') {
      if (isAdminApi) {
        return NextResponse.json(
          { error: 'Yönetici yetkisi gereklidir.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/giris', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/yeni-konu/:path*'],
};


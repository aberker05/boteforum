import { cache } from 'react';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-forum-jwt-key-2026-modern-discourse'
);

export const COOKIE_NAME = 'novaforum_session';
export const OAUTH_STATE_COOKIE = 'novaforum_oauth_state';

const GOOGLE_AVATAR_COLORS = [
  '#6366f1',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#14b8a6',
  '#f43f5e',
];

function sanitizeUsernameFromEmail(email: string): string {
  const trMap: Record<string, string> = {
    ç: 'c',
    ğ: 'g',
    ı: 'i',
    ö: 'o',
    ş: 's',
    ü: 'u',
  };
  const prefix = email
    .split('@')[0]
    .toLowerCase()
    .split('')
    .map((ch) => trMap[ch] || ch)
    .join('')
    .replace(/[.\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 18);

  return prefix.length >= 3 ? prefix : `google_${prefix || 'user'}`;
}

export async function findOrCreateGoogleUser(email: string, displayName: string) {
  const cleanEmail = email.trim().toLowerCase();

  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    const baseUsername = sanitizeUsernameFromEmail(cleanEmail);
    let finalUsername = baseUsername;

    for (let attempt = 0; attempt < 5; attempt++) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: finalUsername },
      });
      if (!existingUsername) break;
      finalUsername = `${baseUsername.slice(0, 18)}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const randomPassword = await bcrypt.hash(
      `google_oauth_${Date.now()}_${Math.random()}`,
      10
    );
    const randomColor =
      GOOGLE_AVATAR_COLORS[Math.floor(Math.random() * GOOGLE_AVATAR_COLORS.length)];

    const formattedName =
      displayName.trim().slice(0, 40) ||
      baseUsername
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    const totalUsers = await prisma.user.count();
    const isFirstUser = totalUsers === 0;

    user = await prisma.user.create({
      data: {
        username: finalUsername,
        email: cleanEmail,
        password: randomPassword,
        displayName: formattedName,
        bio: 'Google hesabı ile katıldı.',
        avatarColor: randomColor,
        role: isFirstUser ? 'ADMIN' : 'MEMBER',
        reputation: isFirstUser ? 600 : 0,
      },
    });
  }

  return user;
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: string;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

const globalForAuthCache = globalThis as unknown as {
  userSessionCache?: Map<
    string,
    {
      data: {
        id: string;
        username: string;
        email: string;
        displayName: string;
        bio: string | null;
        avatarColor: string;
        role: string;
        reputation: number;
        createdAt: Date;
      } | null;
      expiresAt: number;
    }
  >;
};

const USER_SESSION_TTL_MS = 15_000;

export function invalidateUserCache(userId?: string) {
  if (!globalForAuthCache.userSessionCache) return;
  if (userId) {
    globalForAuthCache.userSessionCache.delete(userId);
  } else {
    globalForAuthCache.userSessionCache.clear();
  }
}

export const getCurrentUser = cache(async function getCurrentUserImpl() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload?.userId) return null;

    if (!globalForAuthCache.userSessionCache) {
      globalForAuthCache.userSessionCache = new Map();
    }

    const now = Date.now();
    const cached = globalForAuthCache.userSessionCache.get(payload.userId);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarColor: true,
        role: true,
        reputation: true,
        createdAt: true,
      },
    });

    if (!user || user.role === 'BANNED') {
      globalForAuthCache.userSessionCache.set(payload.userId, {
        data: null,
        expiresAt: now + USER_SESSION_TTL_MS,
      });
      return null;
    }

    globalForAuthCache.userSessionCache.set(payload.userId, {
      data: user,
      expiresAt: now + USER_SESSION_TTL_MS,
    });

    return user;
  } catch {
    return null;
  }
});

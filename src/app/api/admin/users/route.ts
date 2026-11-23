import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, invalidateUserCache } from '@/lib/auth';
import { invalidateHomeCache } from '@/lib/homeCache';
import { invalidateTechNewsCache } from '@/lib/techNews';
import { validatePasswordStrength, verifyRequestOrigin } from '@/lib/security';

const VALID_ROLES = ['MEMBER', 'MODERATOR', 'ADMIN', 'BANNED'];
const AVATAR_COLORS = [
  '#6366f1',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#14b8a6',
  '#f43f5e',
];

export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bu işlem için yönetici yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, password, displayName, role } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Kullanıcı adı, e-posta ve şifre zorunludur.' },
        { status: 400 }
      );
    }

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Kullanıcı adı en az 3 karakter olmalıdır.' },
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
    const randomColor =
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const userRole = VALID_ROLES.includes(role) ? role : 'MEMBER';

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        displayName: (displayName || cleanUsername).trim(),
        avatarColor: randomColor,
        role: userRole,
        reputation: 0,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        reputation: true,
      },
    });

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Admin create user error:', error);
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulamadı.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, reputation } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı ID gerekli.' }, { status: 400 });
    }

    if (userId === currentUser.id && role && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Kendi yönetici yetkinizi kaldıramazsınız.' },
        { status: 400 }
      );
    }

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Geçersiz rol.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role ? { role } : {}),
        ...(typeof reputation === 'number' ? { reputation } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        reputation: true,
      },
    });

    invalidateUserCache(userId);
    invalidateHomeCache();
    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Kullanıcı güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı ID gerekli.' }, { status: 400 });
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Kendi yönetici hesabınızı silemezsiniz.' },
        { status: 400 }
      );
    }

    // İlişkili raw-SQL tablo kayıtlarını da güvenli şekilde temizle
    await Promise.all([
      prisma.$executeRaw`DELETE FROM "TechNewsComment" WHERE "authorId" = ${userId}`.catch(() => {}),
      prisma.$executeRaw`DELETE FROM "ThreadPollVote" WHERE "userId" = ${userId}`.catch(() => {}),
      prisma.$executeRaw`DELETE FROM "Notification" WHERE "userId" = ${userId}`.catch(() => {}),
      prisma.$executeRaw`DELETE FROM "PasswordReset" WHERE "userId" = ${userId}`.catch(() => {}),
      prisma.$executeRaw`DELETE FROM "SupportTicket" WHERE "userId" = ${userId}`.catch(() => {}),
    ]);

    await prisma.user.delete({ where: { id: userId } });
    invalidateUserCache(userId);
    invalidateHomeCache();
    invalidateTechNewsCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Kullanıcı silinemedi.' }, { status: 500 });
  }
}


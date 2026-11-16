import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkContentModeration } from '@/lib/moderation';
import { validateContentLength, verifyRequestOrigin } from '@/lib/security';

export async function PATCH(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      displayName,
      bio,
      avatarColor,
      email,
      currentPassword,
      newPassword,
    } = body;

    if (displayName !== undefined) {
      const nameLen = validateContentLength(String(displayName), 40, 'Görünen ad');
      if (!nameLen.valid) {
        return NextResponse.json({ error: nameLen.error }, { status: 400 });
      }
      const modName = checkContentModeration(String(displayName));
      if (!modName.isClean) {
        return NextResponse.json({ error: modName.reason }, { status: 400 });
      }
    }

    if (bio !== undefined && String(bio).trim().length > 0) {
      const bioLen = validateContentLength(String(bio), 300, 'Biyografi');
      if (!bioLen.valid) {
        return NextResponse.json({ error: bioLen.error }, { status: 400 });
      }
      const modBio = checkContentModeration(String(bio));
      if (!modBio.isClean) {
        return NextResponse.json({ error: modBio.reason }, { status: 400 });
      }
    }

    if (avatarColor && !/^#[0-9a-fA-F]{6}$/.test(String(avatarColor))) {
      return NextResponse.json(
        { error: 'Geçersiz profil renk formatı.' },
        { status: 400 }
      );
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Şifre güncelleme isteği varsa doğrula
    let hashedNewPassword: string | undefined;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Şifre değiştirmek için mevcut şifrenizi girmelisiniz.' },
          { status: 400 }
        );
      }

      const validPassword = await bcrypt.compare(currentPassword, fullUser.password);
      if (!validPassword) {
        return NextResponse.json(
          { error: 'Mevcut şifreniz hatalı.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Yeni şifre en az 6 karakter olmalıdır.' },
          { status: 400 }
        );
      }

      hashedNewPassword = await bcrypt.hash(newPassword, 10);
    }

    // E-posta güncelleme isteği varsa format ve benzersizlik kontrolü yap
    let cleanEmail = fullUser.email;
    if (email && email.trim().toLowerCase() !== fullUser.email) {
      cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json(
          { error: 'Lütfen geçerli bir e-posta adresi girin.' },
          { status: 400 }
        );
      }
      const emailExists = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Bu e-posta adresi başka bir hesap tarafından kullanılıyor.' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: displayName ? displayName.trim() : user.displayName,
        bio: bio !== undefined ? bio.trim() : user.bio,
        avatarColor: avatarColor || user.avatarColor,
        email: cleanEmail,
        ...(hashedNewPassword ? { password: hashedNewPassword } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarColor: true,
        role: true,
        reputation: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Profil güncellenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

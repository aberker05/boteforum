import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  checkRateLimit,
  getClientIp,
  verifyRequestOrigin,
} from '@/lib/security';

async function ensurePasswordResetTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "PasswordReset" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "expiresAt" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL
    )
  `;
}

// 1. Adım: Kullanıcı adı + E-posta doğrulaması ve 6 haneli sıfırlama kodu üretimi
export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const ip = getClientIp(request);
    const rate = checkRateLimit(`forgot_post:${ip}`, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Çok fazla sıfırlama talebi gönderdiniz. Lütfen ${rate.retryAfterSeconds} saniye sonra tekrar deneyin.`,
        },
        { status: 429 }
      );
    }

    await ensurePasswordResetTable();

    const body = await request.json();
    const { username, email } = body;

    if (!username || !email) {
      return NextResponse.json(
        { error: 'Lütfen kullanıcı adınızı ve kayıtlı e-posta adresinizi girin.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        username: String(username).trim().toLowerCase(),
        email: String(email).trim().toLowerCase(),
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Bu kullanıcı adı ve e-posta adresiyle eşleşen bir hesap bulunamadı.' },
        { status: 404 }
      );
    }

    if (user.role === 'BANNED') {
      return NextResponse.json(
        { error: 'Askıya alınmış hesaplar için şifre sıfırlama işlemi yapılamaz.' },
        { status: 403 }
      );
    }

    // KRİTİK YÖNETİCİ GÜVENLİĞİ: Gerçek SMTP e-posta doğrulaması olmadan ADMIN veya MODERATOR şifresi sıfırlanamaz!
    const isPrivileged = user.role === 'ADMIN' || user.role === 'MODERATOR';
    const isSmtpConfigured = Boolean(process.env.SMTP_HOST);

    if (isPrivileged && !isSmtpConfigured) {
      return NextResponse.json(
        {
          error:
            'Güvenlik politikası gereği Yönetici (ADMIN) ve Moderatör hesaplarının şifresi doğrulanmış e-posta sunucusu (SMTP) olmadan sıfırlanamaz. Lütfen şifrenizi giriş yaptıktan sonra Profil Ayarları menüsünden güncelleyin.',
        },
        { status: 403 }
      );
    }

    // Kriptografik olarak güvenli 6 haneli doğrulama kodu üret
    const code = String(randomInt(100000, 1000000));
    const id = `rst_${Date.now()}_${randomInt(1000, 9999)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 dakika geçerli

    // Bu kullanıcının eski kodlarını temizle
    await prisma.$executeRaw`
      DELETE FROM "PasswordReset" WHERE "userId" = ${user.id}
    `;

    const nowIso = now.toISOString();
    await prisma.$executeRaw`
      INSERT INTO "PasswordReset" ("id", "userId", "email", "code", "expiresAt", "createdAt")
      VALUES (${id}, ${user.id}, ${user.email}, ${code}, ${expiresAt}, ${nowIso})
    `;

    const isDevDemoMode =
      process.env.NODE_ENV !== 'production' && !isSmtpConfigured && !isPrivileged;

    return NextResponse.json({
      success: true,
      message: 'Doğrulama kodu oluşturuldu.',
      // Yalnızca yerel geliştirme ortamında ve standart üyeler için döner; canlıda (production) asla dönmez
      resetCode: isDevDemoMode ? code : undefined,
    });
  } catch (error) {
    console.error('Forgot password POST error:', error);
    return NextResponse.json(
      { error: 'İşlem sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// 2. Adım: Sıfırlama kodunu doğrula ve yeni şifreyi kaydet
export async function PATCH(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const ip = getClientIp(request);
    const ipRate = checkRateLimit(`forgot_patch:${ip}`, 10, 15 * 60 * 1000);
    if (!ipRate.allowed) {
      return NextResponse.json(
        {
          error: `Çok fazla deneme yapıldı. Lütfen ${ipRate.retryAfterSeconds} saniye bekleyin.`,
        },
        { status: 429 }
      );
    }

    await ensurePasswordResetTable();

    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'E-posta, doğrulama kodu ve yeni şifre alanları zorunludur.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const attemptKey = `reset_verify:${cleanEmail}`;

    // 6 haneli kodun kaba kuvvetle (Brute-Force) tahmin edilmesini engelle
    const rateCheck = checkLoginRateLimit(attemptKey);
    if (!rateCheck.allowed) {
      await prisma.$executeRaw`
        DELETE FROM "PasswordReset" WHERE "email" = ${cleanEmail}
      `;
      return NextResponse.json(
        {
          error:
            'Çok fazla hatalı kod denemesi yapıldı. Güvenliğiniz için mevcut kod iptal edildi, lütfen yeni kod talep edin.',
        },
        { status: 429 }
      );
    }

    if (String(newPassword).length < 6 || String(newPassword).length > 128) {
      return NextResponse.json(
        { error: 'Yeni şifre en az 6 karakter olmalıdır.' },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim();
    const rows = await prisma.$queryRaw<
      { id: string; userId: string; code: string; expiresAt: string }[]
    >`
      SELECT * FROM "PasswordReset" WHERE "email" = ${cleanEmail} AND "code" = ${cleanCode} LIMIT 1
    `;

    const resetRecord = rows[0];
    if (!resetRecord) {
      const fail = recordFailedLogin(attemptKey);
      if (fail.locked) {
        await prisma.$executeRaw`
          DELETE FROM "PasswordReset" WHERE "email" = ${cleanEmail}
        `;
      }
      return NextResponse.json(
        {
          error: fail.locked
            ? '5 hatalı deneme nedeniyle sıfırlama kodunuz güvenlik amacıyla iptal edildi.'
            : `Geçersiz doğrulama kodu. (Kalan deneme hakkı: ${fail.remainingAttempts})`,
        },
        { status: 400 }
      );
    }

    if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
      await prisma.$executeRaw`
        DELETE FROM "PasswordReset" WHERE "id" = ${resetRecord.id}
      `;
      return NextResponse.json(
        { error: 'Doğrulama kodunun süresi dolmuş. Lütfen yeni kod talep edin.' },
        { status: 400 }
      );
    }

    clearLoginAttempts(attemptKey);

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    await prisma.$executeRaw`
      DELETE FROM "PasswordReset" WHERE "userId" = ${resetRecord.userId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla sıfırlandı.',
    });
  } catch (error) {
    console.error('Forgot password PATCH error:', error);
    return NextResponse.json(
      { error: 'Şifre güncellenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

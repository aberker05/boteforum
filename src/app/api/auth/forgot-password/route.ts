import { NextResponse } from 'next/server';
import { randomInt, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { invalidateUserCache } from '@/lib/auth';
import { getSiteSettings } from '@/lib/siteSettings';
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/email';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  checkRateLimit,
  getClientIp,
  validatePasswordStrength,
  verifyRequestOrigin,
} from '@/lib/security';

function hashResetCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

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

// 1. Adım: Kullanıcı adı + E-posta doğrulaması ve 6 haneli sıfırlama kodunun gerçek e-postaya gönderimi
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

    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          error:
            'Güvenlik politikası gereği şifre sıfırlama kodları yalnızca doğrulanmış e-posta adresine gönderilir. E-posta sunucusu (SMTP_USER & SMTP_PASS) henüz yapılandırılmamıştır.',
        },
        { status: 503 }
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

    // Kriptografik olarak güvenli 6 haneli doğrulama kodu üret ve SHA-256 ile özetleyerek kaydet
    const rawCode = String(randomInt(100000, 1000000));
    const hashedCode = hashResetCode(rawCode);
    const id = `rst_${Date.now()}_${randomInt(1000, 9999)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 dakika geçerli

    await prisma.$executeRaw`
      DELETE FROM "PasswordReset" WHERE "userId" = ${user.id}
    `;

    const nowIso = now.toISOString();
    await prisma.$executeRaw`
      INSERT INTO "PasswordReset" ("id", "userId", "email", "code", "expiresAt", "createdAt")
      VALUES (${id}, ${user.id}, ${user.email}, ${hashedCode}, ${expiresAt}, ${nowIso})
    `;

    const settings = await getSiteSettings();
    const siteName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;
    const mailResult = await sendPasswordResetEmail({
      to: user.email,
      displayName: user.displayName,
      username: user.username,
      code: rawCode,
      siteName,
    });

    if (!mailResult.sent) {
      await prisma.$executeRaw`
        DELETE FROM "PasswordReset" WHERE "id" = ${id}
      `;
      return NextResponse.json(
        {
          error:
            'Doğrulama e-postası gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        },
        { status: 500 }
      );
    }

    // Güvenlik: Kod asla API yanıtında dönmez, yalnızca kullanıcının e-posta kutusuna gider!
    return NextResponse.json({
      success: true,
      deliveryMethod: 'email',
      message: '6 haneli doğrulama kodu kayıtlı e-posta adresinize gönderildi.',
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

    // 6 haneli kodun kaba kuvvetle (Brute-Force) tahmin edilmesini engelle (5 hatalı denemede kod imha edilir)
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

    const pwCheck = validatePasswordStrength(String(newPassword));
    if (!pwCheck.valid) {
      return NextResponse.json(
        { error: pwCheck.error },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim();
    const hashedIncoming = hashResetCode(cleanCode);

    const rows = await prisma.$queryRaw<
      { id: string; userId: string; code: string; expiresAt: string }[]
    >`
      SELECT * FROM "PasswordReset"
      WHERE "email" = ${cleanEmail} AND ("code" = ${hashedIncoming} OR "code" = ${cleanCode})
      LIMIT 1
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
    invalidateUserCache(resetRecord.userId);

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

// Giriş deneme sınırı (Brute-Force / Rate Limiting), Genel IP Hız Sınırı ve CSRF Origin doğrulaması

interface RateLimitEntry {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 dakika
const WINDOW_MS = 15 * 60 * 1000;

const loginAttempts = new Map<string, RateLimitEntry>();
const generalRateLimits = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'local-ip';
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = generalRateLimits.get(key);

  if (!existing || now > existing.resetAt) {
    generalRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  generalRateLimits.set(key, existing);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const normalizedKey = key.trim().toLowerCase();
  const now = Date.now();
  const entry = loginAttempts.get(normalizedKey);

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Kilit süresi devam ediyorsa reddet
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // Pencere süresi geçtiyse sıfırla
  if (now - entry.lastAttempt > WINDOW_MS) {
    loginAttempts.delete(normalizedKey);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - entry.attempts),
  };
}

export function recordFailedLogin(key: string): {
  locked: boolean;
  remainingAttempts: number;
} {
  const normalizedKey = key.trim().toLowerCase();
  const now = Date.now();
  const existing = loginAttempts.get(normalizedKey);

  const attempts =
    existing && now - existing.lastAttempt <= WINDOW_MS
      ? existing.attempts + 1
      : 1;

  const locked = attempts >= MAX_ATTEMPTS;
  const lockedUntil = locked ? now + LOCK_DURATION_MS : null;

  loginAttempts.set(normalizedKey, {
    attempts,
    lockedUntil,
    lastAttempt: now,
  });

  return {
    locked,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempts),
  };
}

export function clearLoginAttempts(key: string): void {
  loginAttempts.delete(key.trim().toLowerCase());
}

// CSRF Koruması: İstek farklı bir dış siteden (Origin) geliyorsa engelle
export function verifyRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // Aynı origin içinden veya doğrudan sunucu/test çağrılarından geliyorsa izin ver
  if (!origin || !host) return true;

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

// Spam & Flood Koruması: Ardışık konu, yorum, oy ve rapor gönderim hızını sınırlar
const userActionTimestamps = new Map<string, number>();

export function checkActionCooldown(
  userId: string,
  actionType: string,
  cooldownMs: number
): { allowed: boolean; waitSeconds?: number } {
  const key = `${userId}:${actionType}`;
  const now = Date.now();
  const lastTime = userActionTimestamps.get(key);

  if (lastTime && now - lastTime < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - (now - lastTime)) / 1000);
    return { allowed: false, waitSeconds };
  }

  userActionTimestamps.set(key, now);
  return { allowed: true };
}

// Aşırı büyük veri (Payload) kontrolü
export function validateContentLength(
  text: string,
  maxLength: number,
  fieldName: string
): { valid: boolean; error?: string } {
  if (text.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} en fazla ${maxLength} karakter olabilir.`,
    };
  }
  return { valid: true };
}

// Güçlü Parola Politikası: En az 8 karakter, en az 1 harf ve en az 1 rakam
export function validatePasswordStrength(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!password || password.length < 8) {
    return {
      valid: false,
      error: 'Güvenliğiniz için şifreniz en az 8 karakter uzunluğunda olmalıdır.',
    };
  }
  if (password.length > 128) {
    return {
      valid: false,
      error: 'Şifre en fazla 128 karakter olabilir.',
    };
  }
  if (!/[a-zA-ZğüşöçıİĞÜŞÖÇ]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Şifreniz en az bir harf ve en az bir rakam içermelidir.',
    };
  }
  return { valid: true };
}

const SAFE_DATA_IMAGE_GLOBAL_REGEX =
  /data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+/gi;

// Markdown içeriklerinde hem metin uzunluğunu hem de gömülü görsellerin güvenliğini/sayısını denetler
export function validateMarkdownContent(
  content: string,
  maxTextLength: number,
  maxImages: number,
  fieldName: string
): { valid: boolean; error?: string } {
  // 1. İzin verilmeyen data: URI protokollerini engelle (örn. data:image/svg+xml, data:text/html)
  const allDataUris = content.match(/data:[^\s)"']+/gi) || [];
  for (const uri of allDataUris) {
    if (!/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+$/i.test(uri)) {
      return {
        valid: false,
        error: `${fieldName} içinde güvenlik nedeniyle yalnızca PNG, JPG, WEBP ve GIF formatında görseller desteklenir (SVG veya diğer veri tipleri kullanılamaz).`,
      };
    }
  }

  // 2. Gömülü görsel sayısı ve toplam boyut sınırı
  const safeImages = content.match(SAFE_DATA_IMAGE_REGEX_FOR_COUNT()) || [];
  if (safeImages.length > maxImages) {
    return {
      valid: false,
      error: `${fieldName} içerisine en fazla ${maxImages} adet görsel yükleyebilirsiniz.`,
    };
  }

  const maxTotalPayload = maxTextLength + maxImages * 180000;
  if (content.length > maxTotalPayload) {
    return {
      valid: false,
      error: `${fieldName} içindeki görsel boyutu çok yüksek. Lütfen daha küçük boyutlu görsel kullanın.`,
    };
  }

  // 3. Görseller çıkarıldıktan sonraki saf metin uzunluğu kontrolü
  const plainText = content.replace(SAFE_DATA_IMAGE_GLOBAL_REGEX, '');
  if (plainText.length > maxTextLength) {
    return {
      valid: false,
      error: `${fieldName} metni en fazla ${maxTextLength} karakter olabilir.`,
    };
  }

  return { valid: true };
}

function SAFE_DATA_IMAGE_REGEX_FOR_COUNT(): RegExp {
  return /data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+/gi;
}

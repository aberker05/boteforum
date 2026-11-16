import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  const trMap: Record<string, string> = {
    ç: 'c', Ç: 'c',
    ğ: 'g', Ğ: 'g',
    ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o',
    ş: 's', Ş: 's',
    ü: 'u', Ü: 'u',
  };
  const normalized = text
    .split('')
    .map((char) => trMap[char] || char)
    .join('');

  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return 'Az önce';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} gün önce`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} ay önce`;
  return `${Math.floor(diffMonths / 12)} yıl önce`;
}

/**
 * Türkçe karakter duyarlı ve aksansız arama normalizasyonu.
 * Örn: "Yazılım Çözümleri" -> "yazilim cozumleri"
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  const trMap: Record<string, string> = {
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ı: 'i',
    I: 'i',
    İ: 'i',
    i: 'i',
    ö: 'o',
    Ö: 'o',
    ş: 's',
    Ş: 's',
    ü: 'u',
    Ü: 'u',
  };
  return text
    .split('')
    .map((ch) => trMap[ch] || ch)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sorgudaki tüm kelimelerin hedef metinde geçip geçmediğini kontrol eder.
 * Noktalama işaretlerini (. / - _) esnek eşleştirir (örn: "nextjs" <-> "Next.js", "ui ux" <-> "UI/UX").
 */
export function matchesSearch(target: string, query: string): boolean {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return true;
  const normTarget = normalizeSearchText(target);
  const compactTarget = normTarget.replace(/[.\-/_]/g, '');
  const spacedTarget = normTarget.replace(/[.\-/_]/g, ' ');
  const tokens = normQuery
    .replace(/[/]/g, ' ')
    .split(' ')
    .filter(Boolean);

  return tokens.every((token) => {
    const compactToken = token.replace(/[.\-/_]/g, '');
    return (
      normTarget.includes(token) ||
      spacedTarget.includes(token) ||
      (compactToken.length > 0 && compactTarget.includes(compactToken))
    );
  });
}

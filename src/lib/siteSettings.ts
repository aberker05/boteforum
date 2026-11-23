import { cache } from 'react';
import { prisma } from './prisma';
import { invalidateHomeCache, getHomeSidebarData } from './homeCache';

export interface SiteSettings {
  siteNamePrimary: string;
  siteNameAccent: string;
  siteTagline: string;
  logoType: 'icon' | 'text' | 'image';
  logoIcon: string;
  logoText: string;
  logoImageUrl: string;
  brandColor: string;
  footerDescription: string;
  copyrightText: string;
}

/**
 * Varsayılan Site Kimliği ve Logo Ayarları.
 * İsterseniz doğrudan buradaki varsayılan değerleri değiştirebilir
 * veya Yönetim Paneli (/admin -> Site & Logo Ayarları) üzerinden canlı olarak güncelleyebilirsiniz.
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteNamePrimary: 'Nova',
  siteNameAccent: 'Forum',
  siteTagline: 'Geliştirici & Teknoloji Forumu',
  logoType: 'icon',
  logoIcon: 'Sparkles',
  logoText: 'NF',
  logoImageUrl: '',
  brandColor: '#6366f1',
  footerDescription:
    "Yazılım mühendisliği, yapay zeka araştırmaları, sistem mimarisi ve modern web teknolojileri üzerine Türkiye'nin yeni nesil teknik tartışma ve bilgi paylaşım forumu.",
  copyrightText:
    '© 2026 NovaForum — Geliştirici ve Teknoloji Topluluğu. Tüm hakları saklıdır.',
};

const globalForSiteSettings = globalThis as unknown as {
  siteSettingsTableReady?: boolean;
  siteSettingsCache?: { data: SiteSettings; expiresAt: number };
  footerCategoriesCache?: {
    data: Array<{ id: string; name: string; slug: string }>;
    expiresAt: number;
  };
};

const SITE_SETTINGS_TTL_MS = 300_000;
const FOOTER_CATEGORIES_TTL_MS = 300_000;

export function invalidateCategoryCache() {
  globalForSiteSettings.footerCategoriesCache = undefined;
  invalidateHomeCache();
}

export const getFooterCategories = cache(async function getFooterCategoriesImpl(): Promise<
  Array<{ id: string; name: string; slug: string }>
> {
  const now = Date.now();
  if (
    globalForSiteSettings.footerCategoriesCache &&
    globalForSiteSettings.footerCategoriesCache.expiresAt > now
  ) {
    return globalForSiteSettings.footerCategoriesCache.data;
  }

  try {
    const sidebar = await getHomeSidebarData();
    const data = sidebar.categories.slice(0, 3).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));
    globalForSiteSettings.footerCategoriesCache = {
      data,
      expiresAt: now + FOOTER_CATEGORIES_TTL_MS,
    };
    return data;
  } catch {
    return [];
  }
});

export function isSafeLogoUrl(url?: string): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/') ||
    lower.startsWith('data:image/svg')
  ) {
    return false;
  }
  if (lower.startsWith('data:')) {
    return /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=\s]+$/i.test(
      trimmed
    );
  }
  return (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('/')
  );
}

export async function ensureSiteSettingsTable() {
  if (globalForSiteSettings.siteSettingsTableReady) return;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SiteSettings" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "siteNamePrimary" TEXT NOT NULL,
      "siteNameAccent" TEXT NOT NULL,
      "siteTagline" TEXT NOT NULL,
      "logoType" TEXT NOT NULL DEFAULT 'icon',
      "logoIcon" TEXT NOT NULL DEFAULT 'Sparkles',
      "logoText" TEXT NOT NULL DEFAULT 'NF',
      "logoImageUrl" TEXT NOT NULL DEFAULT '',
      "brandColor" TEXT NOT NULL DEFAULT '#6366f1',
      "footerDescription" TEXT NOT NULL,
      "copyrightText" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    )
  `;

  globalForSiteSettings.siteSettingsTableReady = true;
}

export const getSiteSettings = cache(async function getSiteSettingsImpl(): Promise<SiteSettings> {
  const now = Date.now();
  if (
    globalForSiteSettings.siteSettingsCache &&
    globalForSiteSettings.siteSettingsCache.expiresAt > now
  ) {
    return globalForSiteSettings.siteSettingsCache.data;
  }

  try {
    let rows: Array<{
      siteNamePrimary: string;
      siteNameAccent: string;
      siteTagline: string;
      logoType: string;
      logoIcon: string;
      logoText: string;
      logoImageUrl: string;
      brandColor: string;
      footerDescription: string;
      copyrightText: string;
    }>;

    try {
      rows = await prisma.$queryRaw`SELECT * FROM "SiteSettings" WHERE "id" = 'default' LIMIT 1`;
    } catch {
      await ensureSiteSettingsTable();
      rows = await prisma.$queryRaw`SELECT * FROM "SiteSettings" WHERE "id" = 'default' LIMIT 1`;
    }

    if (!rows[0]) {
      globalForSiteSettings.siteSettingsCache = {
        data: DEFAULT_SITE_SETTINGS,
        expiresAt: now + SITE_SETTINGS_TTL_MS,
      };
      return DEFAULT_SITE_SETTINGS;
    }

    const r = rows[0];
    const primary = r.siteNamePrimary || DEFAULT_SITE_SETTINGS.siteNamePrimary;
    const accent = r.siteNameAccent ?? DEFAULT_SITE_SETTINGS.siteNameAccent;
    const fullName = `${primary}${accent}`;
    const rawCopyright = r.copyrightText || DEFAULT_SITE_SETTINGS.copyrightText;
    const resolvedCopyright =
      rawCopyright === DEFAULT_SITE_SETTINGS.copyrightText && fullName !== 'NovaForum'
        ? rawCopyright.replace('NovaForum', fullName)
        : rawCopyright;

    const resolved: SiteSettings = {
      siteNamePrimary: primary,
      siteNameAccent: accent,
      siteTagline: r.siteTagline ?? DEFAULT_SITE_SETTINGS.siteTagline,
      logoType:
        r.logoType === 'image' || r.logoType === 'text' ? r.logoType : 'icon',
      logoIcon: r.logoIcon || DEFAULT_SITE_SETTINGS.logoIcon,
      logoText: r.logoText || DEFAULT_SITE_SETTINGS.logoText,
      logoImageUrl: r.logoImageUrl || '',
      brandColor: r.brandColor || DEFAULT_SITE_SETTINGS.brandColor,
      footerDescription:
        r.footerDescription || DEFAULT_SITE_SETTINGS.footerDescription,
      copyrightText: resolvedCopyright,
    };

    globalForSiteSettings.siteSettingsCache = {
      data: resolved,
      expiresAt: now + SITE_SETTINGS_TTL_MS,
    };

    return resolved;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
});

export async function updateSiteSettings(
  input: Partial<SiteSettings>
): Promise<SiteSettings> {
  await ensureSiteSettingsTable();

  const current = await getSiteSettings();
  const next: SiteSettings = {
    siteNamePrimary:
      input.siteNamePrimary !== undefined
        ? input.siteNamePrimary.trim() || current.siteNamePrimary
        : current.siteNamePrimary,
    siteNameAccent:
      input.siteNameAccent !== undefined
        ? input.siteNameAccent.trim()
        : current.siteNameAccent,
    siteTagline:
      input.siteTagline !== undefined
        ? input.siteTagline.trim()
        : current.siteTagline,
    logoType:
      input.logoType === 'image' ||
        input.logoType === 'text' ||
        input.logoType === 'icon'
        ? input.logoType
        : current.logoType,
    logoIcon:
      input.logoIcon !== undefined
        ? input.logoIcon.trim() || 'Sparkles'
        : current.logoIcon,
    logoText:
      input.logoText !== undefined
        ? input.logoText.trim().slice(0, 3).toUpperCase() || 'NF'
        : current.logoText,
    logoImageUrl:
      input.logoImageUrl !== undefined
        ? isSafeLogoUrl(input.logoImageUrl)
          ? input.logoImageUrl.trim()
          : current.logoImageUrl
        : current.logoImageUrl,
    brandColor:
      input.brandColor && /^#[0-9a-fA-F]{6}$/.test(input.brandColor)
        ? input.brandColor
        : current.brandColor,
    footerDescription:
      input.footerDescription !== undefined
        ? input.footerDescription.trim() || current.footerDescription
        : current.footerDescription,
    copyrightText:
      input.copyrightText !== undefined
        ? input.copyrightText.trim() || current.copyrightText
        : current.copyrightText,
  };

  const nowIso = new Date().toISOString();

  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "SiteSettings" WHERE "id" = 'default' LIMIT 1
  `;

  if (existing.length > 0) {
    await prisma.$executeRaw`
      UPDATE "SiteSettings"
      SET
        "siteNamePrimary" = ${next.siteNamePrimary},
        "siteNameAccent" = ${next.siteNameAccent},
        "siteTagline" = ${next.siteTagline},
        "logoType" = ${next.logoType},
        "logoIcon" = ${next.logoIcon},
        "logoText" = ${next.logoText},
        "logoImageUrl" = ${next.logoImageUrl},
        "brandColor" = ${next.brandColor},
        "footerDescription" = ${next.footerDescription},
        "copyrightText" = ${next.copyrightText},
        "updatedAt" = ${nowIso}
      WHERE "id" = 'default'
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO "SiteSettings" (
        "id",
        "siteNamePrimary",
        "siteNameAccent",
        "siteTagline",
        "logoType",
        "logoIcon",
        "logoText",
        "logoImageUrl",
        "brandColor",
        "footerDescription",
        "copyrightText",
        "updatedAt"
      ) VALUES (
        'default',
        ${next.siteNamePrimary},
        ${next.siteNameAccent},
        ${next.siteTagline},
        ${next.logoType},
        ${next.logoIcon},
        ${next.logoText},
        ${next.logoImageUrl},
        ${next.brandColor},
        ${next.footerDescription},
        ${next.copyrightText},
        ${nowIso}
      )
    `;
  }

  globalForSiteSettings.siteSettingsCache = {
    data: next,
    expiresAt: Date.now() + SITE_SETTINGS_TTL_MS,
  };

  return next;
}


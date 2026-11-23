import type { MetadataRoute } from 'next';

function getProductionBaseUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (explicit && !explicit.includes('localhost')) {
    return explicit.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'https://boteforum.vercel.app';
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getProductionBaseUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

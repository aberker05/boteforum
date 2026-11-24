import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import { Suspense } from 'react';
import { ShieldCheck, Activity, Terminal } from 'lucide-react';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { BrandLogo } from '@/components/BrandLogo';
import { NavigationProgress } from '@/components/NavigationProgress';
import { getCurrentUser } from '@/lib/auth';
import { getSiteSettings, getFooterCategories } from '@/lib/siteSettings';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const fullName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;
  const tagline = settings.siteTagline || 'Teknoloji, Yazılım ve BÖTE Topluluk Forumu';
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://boteforum.vercel.app');

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${fullName} — ${tagline}`,
      template: `%s | ${fullName}`,
    },
    description: settings.footerDescription,
    keywords: [
      fullName,
      'BÖTE',
      'BÖTE Forum',
      'Bilgisayar ve Öğretim Teknolojileri Eğitimi',
      'Teknoloji Forumu',
      'Yazılım Forumu',
      'Siber Güvenlik',
      'Yapay Zeka',
      'Eğitim Teknolojileri',
      'Geliştirici Topluluğu',
    ],
    alternates: {
      canonical: '/',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      url: siteUrl,
      siteName: fullName,
      title: `${fullName} — ${tagline}`,
      description: settings.footerDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${fullName} — ${tagline}`,
      description: settings.footerDescription,
    },
    verification: {
      google:
        process.env.GOOGLE_SITE_VERIFICATION ||
        'Bs8mfIItxaUWHoWZGH28aPJX-xPvwEeV3jXtLVZlwIU',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, siteSettings, footerCategories] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getFooterCategories(),
  ]);

  return (
    <html
      lang="tr"
      className={`dark ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col font-sans bg-[#0D0F12] text-[#E6EDF3] antialiased selection:bg-[#10B981]/30 selection:text-[#10B981] pb-16 sm:pb-0">
        <ThemeProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <Suspense fallback={<div className="h-14 border-b border-[#232730] bg-[#0D0F12]" />}>
            <Navbar user={user} siteSettings={siteSettings} />
          </Suspense>
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            {children}
          </main>
          <footer className="border-t border-[#232730] bg-[#0D0F12] mt-10 sm:mt-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
              <div className="grid grid-cols-2 md:grid-cols-12 gap-6 sm:gap-8 pb-8 border-b border-[#232730]">
                <div className="col-span-2 md:col-span-5 space-y-3">
                  <Link href="/" className="inline-flex items-center">
                    <BrandLogo
                      settings={siteSettings}
                      size="sm"
                      showTagline={false}
                    />
                  </Link>
                  <p className="text-xs text-[#8B949E] leading-relaxed max-w-md">
                    {siteSettings.footerDescription}
                  </p>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#15181E] border border-[#232730] text-[11px] font-mono font-medium text-[#10B981]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <Activity className="w-3 h-3" />
                    SYS:ONLINE • TÜM SERVİSLER AKTİF
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2.5 text-xs">
                  <p className="font-mono font-semibold uppercase tracking-wider text-[#E6EDF3] text-[11px]">
                    Forum Akışı
                  </p>
                  <ul className="space-y-2 text-[#8B949E]">
                    <li>
                      <Link href="/" className="hover:text-[#10B981] transition-colors">
                        Tüm Konular
                      </Link>
                    </li>
                    <li>
                      <Link href="/?filtre=cevapsiz" className="hover:text-[#F59E0B] transition-colors">
                        Cevapsız Sorular
                      </Link>
                    </li>
                    <li>
                      <Link href="/?filtre=cozuldu" className="hover:text-[#10B981] transition-colors">
                        Çözülen Konular
                      </Link>
                    </li>
                    <li>
                      <Link href="/yeni-konu" className="hover:text-[#10B981] transition-colors">
                        Yeni Konu Başlat
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="md:col-span-3 space-y-2.5 text-xs">
                  <p className="font-mono font-semibold uppercase tracking-wider text-[#E6EDF3] text-[11px]">
                    Bölümler & Gündem
                  </p>
                  <ul className="space-y-2 text-[#8B949E]">
                    <li>
                      <Link href="/haberler" className="hover:text-[#10B981] transition-colors">
                        Teknoloji Gündemi & Radar
                      </Link>
                    </li>
                    {footerCategories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={`/?kategori=${cat.slug}`}
                          className="hover:text-[#10B981] transition-colors"
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-2 space-y-2.5 text-xs">
                  <p className="font-mono font-semibold uppercase tracking-wider text-[#E6EDF3] text-[11px]">
                    Kurallar & Gizlilik
                  </p>
                  <ul className="space-y-2 text-[#8B949E]">
                    <li>
                      <Link href="/kurallar" className="hover:text-[#10B981] transition-colors">
                        Forum Kuralları
                      </Link>
                    </li>
                    <li>
                      <Link href="/gizlilik" className="hover:text-[#10B981] transition-colors">
                        Gizlilik & KVKK Politikası
                      </Link>
                    </li>
                    <li>
                      <Link href="/destek" className="font-mono font-medium text-[#10B981] hover:underline transition-colors">
                        Destek, Talep & Şikayet
                      </Link>
                    </li>
                    <li>
                      <Link href="/gizlilik#veri-tablosu" className="hover:text-[#10B981] transition-colors">
                        Veriler Neden İsteniyor?
                      </Link>
                    </li>
                    <li>
                      <Link href="/sitemap.xml" className="font-mono hover:text-[#10B981] transition-colors">
                        sitemap.xml
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8B949E] font-mono">
                <p>{siteSettings.copyrightText}</p>
                <div className="flex items-center gap-2 text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-[#10B981]" />
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>MODERATION:ACTIVE • ZERO-TRUST SECURITY</span>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

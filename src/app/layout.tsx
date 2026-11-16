import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ShieldCheck, Activity } from 'lucide-react';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { BrandLogo } from '@/components/BrandLogo';
import { getCurrentUser } from '@/lib/auth';
import { getSiteSettings, getFooterCategories } from '@/lib/siteSettings';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const fullName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;
  return {
    title: `${fullName} — ${settings.siteTagline || 'Topluluk Forumu'}`,
    description: settings.footerDescription,
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
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <ThemeProvider>
          <Suspense fallback={<div className="h-16 border-b border-slate-800" />}>
            <Navbar user={user} siteSettings={siteSettings} />
          </Suspense>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
          <footer className="border-t border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/60 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-200/70 dark:border-slate-800/70">
                <div className="md:col-span-5 space-y-3">
                  <Link href="/" className="inline-flex items-center">
                    <BrandLogo
                      settings={siteSettings}
                      size="sm"
                      showTagline={false}
                    />
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                    {siteSettings.footerDescription}
                  </p>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <Activity className="w-3 h-3" />
                    Tüm Forum Servisleri Aktif
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2.5 text-xs">
                  <p className="font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                    Forum Akışı
                  </p>
                  <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                    <li>
                      <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Tüm Konular
                      </Link>
                    </li>
                    <li>
                      <Link href="/?filtre=cevapsiz" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Cevapsız Sorular
                      </Link>
                    </li>
                    <li>
                      <Link href="/?filtre=cozuldu" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Çözülen Konular
                      </Link>
                    </li>
                    <li>
                      <Link href="/yeni-konu" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Yeni Konu Başlat
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="md:col-span-3 space-y-2.5 text-xs">
                  <p className="font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                    Bölümler & Gündem
                  </p>
                  <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                    <li>
                      <Link href="/haberler" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Teknoloji Gündemi & Radar
                      </Link>
                    </li>
                    {footerCategories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={`/?kategori=${cat.slug}`}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-2 space-y-2.5 text-xs">
                  <p className="font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                    Kurallar & Gizlilik
                  </p>
                  <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                    <li>
                      <Link href="/kurallar" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Forum Kuralları
                      </Link>
                    </li>
                    <li>
                      <Link href="/gizlilik" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Gizlilik & KVKK Politikası
                      </Link>
                    </li>
                    <li>
                      <Link href="/gizlilik#veri-tablosu" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Veriler Neden İsteniyor?
                      </Link>
                    </li>
                    <li>
                      <Link href="/sitemap.xml" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Site Haritası (XML)
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <p>{siteSettings.copyrightText}</p>
                <div className="flex items-center gap-2 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Otomatik İçerik Moderasyonu & Topluluk Güvenliği Aktif</span>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

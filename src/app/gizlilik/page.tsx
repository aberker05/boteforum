import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Database,
  Cookie,
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  Server,
  FileText,
  KeyRound,
  Scale,
} from 'lucide-react';
import { getSiteSettings } from '@/lib/siteSettings';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const fullName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;
  return {
    title: `Gizlilik Politikası, KVKK ve Veri Şeffaflığı — ${fullName}`,
    description: `${fullName} üzerinde hangi verilerin hangi amaçla istendiği, nasıl şifrelendiği, çerez politikası ve KVKK kapsamındaki kullanıcı haklarınız.`,
  };
}

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  const fullName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;

  const dataItems = [
    {
      field: 'Ad Soyad / Görünen İsim',
      purpose:
        'Açtığınız konularda, yazdığınız yorumlarda ve topluluk liderlik tablosunda yazar kimliğinizin görünmesi için istenir. Gerçek adınız yerine dilediğiniz bir rumuz da kullanabilirsiniz.',
      visibility: 'Herkese Açık (Profil & Paylaşımlar)',
      isPublic: true,
      storage: 'Profil ayarlarından her zaman değiştirilebilir.',
    },
    {
      field: 'Kullanıcı Adı (@username)',
      purpose:
        'Size özel profil adresinizin (/kullanici/kullanici_adi) oluşturulması ve tartışmalarda @kullanici_adi şeklinde etiketlendiğinizde anlık bildirim alabilmeniz için kullanılır.',
      visibility: 'Herkese Açık (Tekil Kimlik)',
      isPublic: true,
      storage: '3–24 karakter arası küçük harf, rakam ve alt çizgi.',
    },
    {
      field: 'E-posta Adresi',
      purpose:
        'Hesabınızın size ait olduğunu doğrulamak, mükerrer (sahte) kayıtları önlemek, Google OAuth girişlerini eşleştirmek ve şifrenizi unuttuğunuzda sıfırlama kodu göndermek için istenir.',
      visibility: 'Tamamen Gizli (Kimseye Gösterilmez)',
      isPublic: false,
      storage:
        'Diğer üyelere asla gösterilmez; reklam veya üçüncü taraflarla paylaşılmaz.',
    },
    {
      field: 'Hesap Şifresi',
      purpose:
        'Hesabınıza yalnızca sizin erişebilmenizi sağlamak için istenir.',
      visibility: 'Şifrelenmiş (Yöneticiler Dahil Kimse Göremez)',
      isPublic: false,
      storage:
        'Açık metin olarak kaydedilmez; Bcrypt (Salt + Hash) algoritmasıyla tek yönlü özetlenir.',
    },
    {
      field: 'Biyografi (Hakkımda) & Profil Rengi',
      purpose:
        'Tamamen isteğe bağlıdır. Uzmanlık alanlarınızı, ilgi duyduğunuz teknolojileri ve görsel profil temanızı topluluğa tanıtmanız için sunulur.',
      visibility: 'Herkese Açık (İsteğe Bağlı)',
      isPublic: true,
      storage: 'Boş bırakılabilir veya istenildiği zaman silinebilir.',
    },
    {
      field: 'Konular, Yorumlar, Beğeniler ve Anket Oyları',
      purpose:
        'Topluluk içi bilgi paylaşımı, doğru çözümlerin (+15 puan) işaretlenmesi ve katkılarınızın İtibar Puanı / Rozet olarak ödüllendirilmesi için işlenir.',
      visibility: 'Konu/Yorumlar Açık • Anket Tercihi Anonim',
      isPublic: true,
      storage:
        'Anketlerde hangi şıkka oy verdiğiniz diğer kullanıcılara gösterilmez; yalnızca toplam yüzdelik sonuç yansıtılır.',
    },
    {
      field: 'IP Adresi & İstek Kaynağı (Origin)',
      purpose:
        'Kaba kuvvet (Brute-Force) şifre denemelerini, otomatik bot saldırılarını, spam/flood gönderimlerini ve CSRF (Siteler Arası İstek Sahtekarlığı) saldırılarını önlemek için kontrol edilir.',
      visibility: 'Yalnızca Güvenlik Katmanı (Gizli)',
      isPublic: false,
      storage:
        'Hız sınırı (Rate Limiting) kontrolü için sunucu belleğinde (RAM) geçici olarak tutulur; reklam takibi için kullanılmaz.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Foruma Dön
        </Link>

        <Link
          href="/kurallar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <FileText className="w-3.5 h-3.5" />
          Topluluk Kuralları & Rozet Rehberi
        </Link>
      </div>

      {/* Üst Hero Banner */}
      <div className="rounded-md bg-[#15181E] p-5 sm:p-7 text-[#E6EDF3] border border-[#232730]">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm font-mono text-[11px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40">
            <ShieldCheck className="w-3.5 h-3.5" /> PRIVACY // %100 VERİ ŞEFFAFLIĞI &amp; GİZLİLİK TAAHHÜDÜ
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#E6EDF3]">
            Gizlilik Politikası, KVKK Aydınlatma Metni ve Veri Rehberi
          </h1>
          <p className="text-xs sm:text-sm text-[#8B949E] max-w-2xl leading-relaxed">
            {fullName} olarak kullanıcılarımızın gizliliğine en üst düzeyde saygı duyuyoruz. Sitemizde hangi bilginin ne amaçla istendiğini, nasıl korunduğunu ve verileriniz üzerindeki tüm haklarınızı hiçbir soru işareti kalmayacak şekilde aşağıda inceleyebilirsiniz.
          </p>

          {/* Hızlı Bölüm Bağlantıları */}
          <div className="pt-2 flex flex-wrap gap-2 font-mono">
            <a
              href="#veri-tablosu"
              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#0D0F12] hover:border-[#10B981]/60 text-[#E6EDF3] border border-[#232730] transition-colors"
            >
              01. Veri Envanteri
            </a>
            <a
              href="#cerezler"
              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#0D0F12] hover:border-[#10B981]/60 text-[#E6EDF3] border border-[#232730] transition-colors"
            >
              02. Çerez Politikası
            </a>
            <a
              href="#guvenlik"
              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#0D0F12] hover:border-[#10B981]/60 text-[#E6EDF3] border border-[#232730] transition-colors"
            >
              03. Güvenlik Mimarisi
            </a>
            <a
              href="#kvkk"
              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#0D0F12] hover:border-[#10B981]/60 text-[#E6EDF3] border border-[#232730] transition-colors"
            >
              04. KVKK Hakları
            </a>
          </div>
        </div>
      </div>

      {/* BÖLÜM 1: HANGİ VERİYİ NEDEN İSTİYORUZ? */}
      <section
        id="veri-tablosu"
        className="scroll-mt-24 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 space-y-5"
      >
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            1. Hangi Veriyi Neden İstiyoruz? (Açık Veri Envanteri)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {fullName}, veri minimizasyonu ilkesini benimser; yalnızca forumun çalışması için zorunlu olan verileri talep eder. Telefon numarası, T.C. kimlik numarası veya ev adresi gibi hassas kişisel veriler <strong>asla talep edilmez</strong>.
          </p>
        </div>

        <div className="space-y-3">
          {dataItems.map((item) => (
            <div
              key={item.field}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {item.field}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    item.isPublic
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {item.isPublic ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  {item.visibility}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>İstenme Amacı:</strong> {item.purpose}
              </p>

              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  <strong>Saklama & Kontrol:</strong> {item.storage}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BÖLÜM 2: ÇEREZ (COOKIE) VE YEREL DEPOLAMA POLİTİKASI */}
      <section
        id="cerezler"
        className="scroll-mt-24 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 space-y-4"
      >
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Cookie className="w-5 h-5 text-amber-500" />
          2. Çerez (Cookie) ve Tarayıcı Depolama Politikası
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Sitemizde <strong>üçüncü taraf reklam, davranışsal profilleme veya çapraz site takip çerezleri (Tracking Cookies) KULLANILMAMAKTADIR</strong>. Yalnızca sitenin temel işlevselliği için zorunlu olan aşağıdaki 2 teknik kayıt kullanılır:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                novaforum_session
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Zorunlu Oturum Çerezi
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Giriş yaptığınızda her sayfa geçişinde tekrar şifre girmemeniz için kullanılır. <code>HttpOnly</code>, <code>SameSite=Lax</code> ve <code>Secure</code> bayraklarıyla korunur; çıkış yaptığınızda (<code>Çıkış Yap</code>) anında silinir.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                theme (localStorage)
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Görünüm Tercihi
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Üst menüden seçtiğiniz <strong>Karanlık (Dark)</strong> veya <strong>Aydınlık (Light)</strong> mod tercihini yalnızca kendi tarayıcınızda hatırlar; sunucuya gönderilmez.
            </p>
          </div>
        </div>
      </section>

      {/* BÖLÜM 3: TEKNİK VERİ GÜVENLİĞİ MİMARİSİ */}
      <section
        id="guvenlik"
        className="scroll-mt-24 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 space-y-4"
      >
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-500" />
          3. Verilerinizi Nasıl Koruyoruz? (Teknik Güvenlik Mimarisi)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              Bcrypt Kriptografik Şifreleme
            </h3>
            <p>
              Parolalarınız veritabanına kaydedilmeden önce tuzlama (salting) ve 10 turlu <strong>bcrypt</strong> özetleme işleminden geçer. Veritabanı yöneticileri dahi şifrenizi göremez.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-500" />
              Satır Düzeyinde Güvenlik (RLS) & SQL Koruması
            </h3>
            <p>
              Tüm veritabanı sorguları parametreli <strong>Prisma ORM</strong> katmanından geçer (SQL Injection koruması) ve <strong>Row Level Security (RLS)</strong> ile dış erişime kapatılmıştır.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              XSS, SVG ve Zararlı Kod Filtresi
            </h3>
            <p>
              Markdown içeriklerinde ve görsel yüklemelerinde çalıştırılabilir <code>javascript:</code> bağlantıları ve <code>image/svg+xml</code> vektör betikleri otomatik olarak reddedilir.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-rose-500" />
              Brute-Force (Kaba Kuvvet) Kilidi
            </h3>
            <p>
              Hesabınıza üst üste 5 kez hatalı şifre girildiğinde ilgili hesap otomatik olarak 15 dakika boyunca korumaya alınır.
            </p>
          </div>
        </div>
      </section>

      {/* BÖLÜM 4: KVKK KAPSAMINDA KULLANICI HAKLARI */}
      <section
        id="kvkk"
        className="scroll-mt-24 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 space-y-4"
      >
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Scale className="w-5 h-5 text-violet-500" />
          4. KVKK Kapsamında Haklarınız ve Veri Kontrolü
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve genel veri koruma ilkeleri uyarınca topluluk üyelerimiz aşağıdaki haklara sahiptir:
        </p>

        <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Bilgilerinizi Anında Güncelleme Hakkı:</strong> Profil sayfanızda yer alan <em>&ldquo;Profili & Şifreyi Düzenle&rdquo;</em> butonu üzerinden görünen adınızı, e-posta adresinizi, biyografinizi ve şifrenizi dilediğiniz an değiştirebilirsiniz.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Paylaşımlarınızı Düzenleme ve Silme Hakkı:</strong> Açtığınız konuları ve yazdığınız tüm yorumları kendi profilinizden veya ilgili konu sayfasından doğrudan düzenleyebilir ya da kalıcı olarak silebilirsiniz.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Üçüncü Taraflarla Paylaşılmama Garantisi:</strong> Kayıtlı e-posta adresiniz ve hesap bilgileriniz hiçbir koşulda reklam ağlarına veya üçüncü taraf veri simsarlarına satılmaz, kiralanmaz ve aktarılmaz.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Unutulma ve Hesap Silme Hakkı:</strong> Hesabınızın ve ilişkili tüm verilerinizin sistemden tamamen kaldırılmasını talep etmek için yönetim ekibine ulaşabilirsiniz; talebiniz doğrultusunda tüm kayıtlarınız kalıcı olarak silinir.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}


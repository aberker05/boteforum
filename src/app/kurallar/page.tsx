import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { getSiteSettings } from '@/lib/siteSettings';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const fullName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;
  return {
    title: `Topluluk Kuralları, Rozetler ve Gizlilik — ${fullName}`,
    description: `${fullName} topluluk ilkeleri, itibar puanı ve rozet sistemi rehberi ile gizlilik ve güvenlik politikası.`,
  };
}

export default async function RulesPage() {
  const settings = await getSiteSettings();
  const fullName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Foruma Dön
      </Link>

      {/* Üst Başlık */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 mb-3">
          <ShieldCheck className="w-4 h-4" /> Resmi Topluluk Rehberi
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">
          Topluluk Kuralları, Puan Sistemi ve Gizlilik
        </h1>
        <p className="text-xs sm:text-sm text-indigo-100 mt-2 max-w-2xl">
          {fullName}&apos;un herkes için güvenli, üretken ve kaliteli bir bilgi paylaşım ortamı olarak kalması için uyguladığımız temel ilkeler.
        </p>
      </div>

      {/* 1. Topluluk İlkeleri */}
      <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-rose-500" />
          1. Topluluk ve Tartışma Kuralları
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Saygılı ve Yapıcı İletişim
            </h3>
            <p>
              Küfür, hakaret, kişisel saldırı, ayrımcılık ve nefret söylemi kesinlikle yasaktır. Otomatik moderasyon filtremiz bu tür içerikleri anında engeller.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Nitelikli Soru ve Kod Paylaşımı
            </h3>
            <p>
              Teknik sorularınızda aldığınız hatayı ve ilgili kod parçasını Markdown kod bloğu (<code>```</code>) içine alarak anlaşılır şekilde paylaşın.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Spam ve Zararlı Bağlantı Yasağı
            </h3>
            <p>
              İzinsiz ticari reklamlar, tekrarlayan spam mesajlar ve oltalama (phishing) bağlantıları paylaşan hesaplar kalıcı olarak uzaklaştırılır.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Raporlama ve Çözüm İşaretleme
            </h3>
            <p>
              Kurallara aykırı gördüğünüz içerikleri <strong>Rapor Et</strong> butonuyla yönetime bildirebilir, çözülen konularınızda doğru yanıtı <strong>Çözüm Seç</strong> ile işaretleyebilirsiniz.
            </p>
          </div>
        </div>
      </section>

      {/* 2. İtibar Puanı ve Seviye Sistemi */}
      <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          2. İtibar Puanı, Seviyeler ve Rozetler Nasıl Kazanılır?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
              +5 Puan
            </span>
            <p className="font-bold text-slate-900 dark:text-white mt-1">
              Yeni Konu Açmak
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Toplulukta yeni bir tartışma veya soru başlattığınızda kazanılır.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              +15 Puan
            </span>
            <p className="font-bold text-slate-900 dark:text-white mt-1">
              Kabul Edilen Çözüm
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Yanıtınız konu sahibi tarafından doğru çözüm olarak seçildiğinde kazanılır.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
              +2 / +3 Puan
            </span>
            <p className="font-bold text-slate-900 dark:text-white mt-1">
              Yorum ve Artı Oy
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Yaptığınız her yorum için +2, konunuzun aldığı her beğeni için +3 puan verilir.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Güvenlik ve Gizlilik */}
      <section
        id="gizlilik"
        className="scroll-mt-24 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            3. Veri Güvenliği, Şeffaflık ve Gizlilik İlkeleri
          </h2>
          <Link
            href="/gizlilik"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors"
          >
            Detaylı Gizlilik & KVKK Politikası →
          </Link>
        </div>

        <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Hangi Veriyi Neden İstiyoruz?:</strong> Görünen adınız ve kullanıcı adınız yalnızca forum paylaşımlarınızda yazar kimliğinizin görünmesi ve <code>@etiketleme</code> bildirimleri için kullanılır. Telefon numarası veya ev adresi gibi kişisel veriler asla talep edilmez.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>E-posta Gizliliği:</strong> E-posta adresiniz diğer kullanıcılara veya profil sayfanızda <strong>kesinlikle gösterilmez</strong>; yalnızca giriş, şifre sıfırlama ve hesap güvenliği için kullanılır, üçüncü taraflarla paylaşılmaz.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Bcrypt Şifreleme & HttpOnly Çerezler:</strong> Şifreleriniz veritabanında açık metin olarak tutulmaz; <strong>bcrypt</strong> kriptografik özetleme ile korunur. Oturum anahtarları (JWT) yalnızca sunucu tarafından okunabilen <strong>HttpOnly</strong> güvenli çerezlerde saklanır ve reklam/takip çerezi kullanılmaz.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showDataInfo, setShowDataInfo] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = (val: string) => {
    const normalized = val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
    setUsername(normalized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptedPolicy) {
      setError('Devam etmek için Topluluk Kuralları ve Gizlilik Politikasını onaylamanız gerekmektedir.');
      return;
    }

    if (username.length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }

    if (password.length < 8) {
      setError('Güvenliğiniz için şifreniz en az 8 karakter olmalıdır.');
      return;
    }

    if (!/[a-zA-ZğüşöçıİĞÜŞÖÇ]/.test(password) || !/[0-9]/.test(password)) {
      setError('Şifreniz en az bir harf ve en az bir rakam içermelidir.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          username,
          email: email.trim().toLowerCase(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kayıt işlemi başarısız oldu.');
        setLoading(false);
      } else {
        try {
          sessionStorage.setItem('novaforum_active_tab', '1');
          sessionStorage.removeItem('novaforum_prompt_dismissed');
          localStorage.setItem(
            'novaforum_session_pref',
            rememberMe ? 'keep' : 'ask'
          );
          if (rememberMe) {
            localStorage.setItem('novaforum_session_decided', '1');
          } else {
            localStorage.removeItem('novaforum_session_decided');
          }
        } catch {
          // ignore
        }
        window.location.href = '/';
      }
    } catch {
      setError('Sunucu ile bağlantı kurulamadı.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="rounded-md border border-[#232730] bg-[#15181E] overflow-hidden">
        <div className="p-6 sm:p-7 pb-5 border-b border-[#232730] bg-gradient-to-b from-[#10B981]/[0.06] to-transparent text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] font-mono text-[10px] font-semibold tracking-wider mb-3">
            <Sparkles className="w-3 h-3" />
            <span>ARAMIZA HOŞ GELDİNİZ</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#E6EDF3] tracking-tight">
            Topluluğa Katılın
          </h1>
          <p className="text-xs sm:text-[13px] text-[#8B949E] mt-1.5 leading-relaxed">
            Sizi aramızda görmekten mutluluk duyarız! Birkaç saniye içinde ücretsiz hesabınızı oluşturup sorular sorabilir ve bilgi paylaşabilirsiniz.
          </p>
        </div>

        <div className="p-6 sm:p-7 pt-5">
          {/* Açılır-Kapanır Veri Şeffaflığı Kutusu */}
          <div className="mb-5 rounded-md border border-[#232730] bg-[#0D0F12] p-3">
            <button
              type="button"
              onClick={() => setShowDataInfo(!showDataInfo)}
              className="w-full flex items-center justify-between gap-2 text-left text-xs font-mono font-semibold text-[#10B981] cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 shrink-0" />
                Bu bilgiler neden isteniyor ve nasıl korunuyor?
              </span>
              {showDataInfo ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </button>

            {showDataInfo && (
              <div className="mt-2.5 pt-2.5 border-t border-[#232730] space-y-1.5 text-[11px] text-[#8B949E] leading-relaxed">
                <p>
                  • <strong className="text-[#E6EDF3]">Görünen İsim &amp; Kullanıcı Adı:</strong> Konu ve yorumlarınızda yazar kimliğinizin görünmesi ve <code className="font-mono text-[#E6EDF3]">@etiketleme</code> bildirimleri için kullanılır. Gerçek adınız yerine rumuz da kullanabilirsiniz.
                </p>
                <p>
                  • <strong className="text-[#E6EDF3]">E-posta Adresi:</strong> Yalnızca hesap güvenliği, giriş ve şifre sıfırlama içindir. <strong className="text-[#E6EDF3]">Diğer üyelere asla gösterilmez</strong> ve üçüncü taraflarla paylaşılmaz.
                </p>
                <p>
                  • <strong className="text-[#E6EDF3]">Şifreniz:</strong> Veritabanında açık metin olarak tutulmaz; <strong className="text-[#E6EDF3]">bcrypt</strong> kriptografik özetleme ile şifrelenir (yöneticiler dahil kimse göremez).
                </p>
                <p className="pt-1">
                  <Link
                    href="/gizlilik"
                    className="font-mono font-semibold text-[#10B981] hover:underline"
                  >
                    Tüm Veri Şeffaflığı Tablosunu ve KVKK Metnini İncele →
                  </Link>
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-[#E6EDF3] mb-1.5">
                Ad Soyad / Görünen İsim
              </label>
              <input
                type="text"
                required
                maxLength={40}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Örn: Caner Aydın (veya rumuz)"
                className="w-full px-3 py-2 rounded-md text-sm bg-[#0D0F12] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981]"
              />
              <p className="mt-1 text-[11px] text-[#8B949E]">
                Paylaşımlarınızda görünür. Dilediğiniz zaman profil ayarlarından değiştirebilirsiniz.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-[#E6EDF3] mb-1.5">
                Kullanıcı Adı (Harf, rakam ve alt çizgi)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-[#8B949E] font-semibold">
                  @
                </span>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={24}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="caner_dev"
                  className="w-full pl-7 pr-3 py-2 rounded-md text-sm font-mono bg-[#0D0F12] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981]"
                />
              </div>
              <p className="mt-1 text-[11px] text-[#8B949E]">
                Profil adresiniz (<code className="font-mono text-[#E6EDF3]">/kullanici/{username || 'kullanici_adi'}</code>) ve @etiketleme bildirimleri için kullanılır.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-[#E6EDF3] mb-1.5">
                E-posta Adresi
              </label>
              <input
                type="email"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@eposta.com"
                className="w-full px-3 py-2 rounded-md text-sm font-mono bg-[#0D0F12] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981]"
              />
              <p className="mt-1 text-[11px] text-[#10B981] flex items-center gap-1">
                <Lock className="w-3 h-3 shrink-0" />
                Gizlidir; diğer üyelere asla gösterilmez, yalnızca giriş ve şifre sıfırlama için kullanılır.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-semibold text-[#E6EDF3] mb-1.5">
                  Şifre (En az 8 krk)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-9 py-2 rounded-md text-sm font-mono bg-[#0D0F12] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#E6EDF3]"
                    title={showPassword ? 'Gizle' : 'Göster'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#E6EDF3] mb-1.5">
                  Şifre (Tekrar)
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-md text-sm font-mono bg-[#0D0F12] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>
            <p className="-mt-2 text-[11px] text-[#8B949E] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              En az 1 harf ve 1 rakam içermelidir; <strong className="text-[#E6EDF3]">bcrypt</strong> ile şifrelenerek korunur.
            </p>

            <label className="flex items-start gap-2.5 text-xs text-[#8B949E] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mt-0.5 rounded-sm border-[#232730] bg-[#0D0F12] text-[#10B981] focus:ring-[#10B981]"
              />
              <span className="leading-snug">
                <strong className="text-[#E6EDF3]">
                  Oturumu bu cihazda açık tut (Beni Hatırla)
                </strong>
                <span className="block text-[11px] text-[#8B949E]">
                  İşaretlenmezse siteden ayrılırken oturum tercihiniz sorulur.
                </span>
              </span>
            </label>

            {/* Gizlilik ve Kurallar Onayı */}
            <label className="flex items-start gap-2.5 pt-1 text-xs text-[#8B949E] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                className="mt-0.5 rounded-sm border-[#232730] bg-[#0D0F12] text-[#10B981] focus:ring-[#10B981]"
              />
              <span className="leading-relaxed">
                <Link
                  href="/kurallar"
                  className="font-mono font-semibold text-[#10B981] hover:underline"
                >
                  Topluluk Kurallarını
                </Link>{' '}
                ve verilerimin hangi amaçla işlendiğini açıklayan{' '}
                <Link
                  href="/gizlilik"
                  className="font-mono font-semibold text-[#10B981] hover:underline"
                >
                  Gizlilik &amp; KVKK Politikasını
                </Link>{' '}
                okudum, kabul ediyorum.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs sm:text-sm font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Hesap Oluşturuluyor...' : 'Aramıza Katıl & Kayıt Ol'}
            </button>
          </form>

          <GoogleSignInButton label="Google ile Hızlı Kayıt Ol" />

          <p className="mt-5 text-center text-xs text-[#8B949E]">
            Zaten bir hesabınız var mı?{' '}
            <Link
              href="/giris"
              className="font-mono font-semibold text-[#10B981] hover:underline"
            >
              Oturum Açın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

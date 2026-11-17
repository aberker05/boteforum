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

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kayıt işlemi başarısız oldu.');
        setLoading(false);
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Sunucu ile bağlantı kurulamadı.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-6 sm:p-8 shadow-lg">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Topluluğa Katılın
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Birkaç saniye içinde ücretsiz topluluk hesabınızı oluşturun
          </p>
        </div>

        {/* Açılır-Kapanır Veri Şeffaflığı Kutusu */}
        <div className="mb-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3">
          <button
            type="button"
            onClick={() => setShowDataInfo(!showDataInfo)}
            className="w-full flex items-center justify-between gap-2 text-left text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer"
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
            <div className="mt-2.5 pt-2.5 border-t border-indigo-500/15 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                • <strong>Görünen İsim & Kullanıcı Adı:</strong> Konu ve yorumlarınızda yazar kimliğinizin görünmesi ve <code>@etiketleme</code> bildirimleri için kullanılır. Gerçek adınız yerine rumuz da kullanabilirsiniz.
              </p>
              <p>
                • <strong>E-posta Adresi:</strong> Yalnızca hesap güvenliği, giriş ve şifre sıfırlama içindir. <strong>Diğer üyelere asla gösterilmez</strong> ve üçüncü taraflarla paylaşılmaz.
              </p>
              <p>
                • <strong>Şifreniz:</strong> Veritabanında açık metin olarak tutulmaz; <strong>bcrypt</strong> kriptografik özetleme ile şifrelenir (yöneticiler dahil kimse göremez).
              </p>
              <p className="pt-1">
                <Link
                  href="/gizlilik"
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Tüm Veri Şeffaflığı Tablosunu ve KVKK Metnini İncele →
                </Link>
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ad Soyad / Görünen İsim
            </label>
            <input
              type="text"
              required
              maxLength={40}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Örn: Caner Aydın (veya rumuz)"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Paylaşımlarınızda görünür. Dilediğiniz zaman profil ayarlarından değiştirebilirsiniz.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kullanıcı Adı (Harf, rakam ve alt çizgi)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">
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
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Profil adresiniz (<code>/kullanici/{username || 'kullanici_adi'}</code>) ve @etiketleme bildirimleri için kullanılır.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Lock className="w-3 h-3 shrink-0" />
              Gizlidir; diğer üyelere asla gösterilmez, yalnızca giriş ve şifre sıfırlama için kullanılır.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Şifre (En az 6 krk)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title={showPassword ? 'Gizle' : 'Göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Şifre (Tekrar)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>
          <p className="-mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            Şifreniz açık metin olarak kaydedilmez; <strong>bcrypt</strong> ile şifrelenerek korunur.
          </p>

          {/* Gizlilik ve Kurallar Onayı */}
          <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acceptedPolicy}
              onChange={(e) => setAcceptedPolicy(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="leading-relaxed">
              <Link
                href="/kurallar"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Topluluk Kurallarını
              </Link>{' '}
              ve verilerimin hangi amaçla işlendiğini açıklayan{' '}
              <Link
                href="/gizlilik"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Gizlilik & KVKK Politikasını
              </Link>{' '}
              okudum, kabul ediyorum.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            veya
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <GoogleSignInButton label="Google ile Hızlı Kayıt Ol" />

        <p className="mt-6 text-center text-xs text-slate-500">
          Zaten bir hesabınız var mı?{' '}
          <Link
            href="/giris"
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Giriş Yapın
          </Link>
        </p>
      </div>
    </div>
  );
}

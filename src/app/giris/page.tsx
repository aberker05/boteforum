'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogIn, Sparkles, Eye, EyeOff } from 'lucide-react';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_iptal: 'Google ile giriş işlemi iptal edildi.',
  google_guvenlik_dogrulamasi_basarisiz:
    'Google OAuth güvenlik doğrulaması (CSRF State) başarısız oldu. Lütfen tekrar deneyin.',
  google_yapilandirma_eksik:
    'Google OAuth yapılandırması eksik. Lütfen yöneticinizle iletişime geçin.',
  google_token_hatasi:
    'Google oturum anahtarı alınamadı. Lütfen tekrar deneyin.',
  google_profil_hatasi:
    'Google profil veya doğrulanmış e-posta bilgisi alınamadı.',
  google_beklenmeyen_hata:
    'Google ile giriş sırasında beklenmeyen bir hata oluştu.',
  hesap_askiya_alindi:
    'Bu hesap topluluk kuralları ihlali nedeniyle yönetici tarafından askıya alınmıştır.',
};

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const errCode = params.get('error');
      if (errCode && OAUTH_ERROR_MESSAGES[errCode]) {
        setError(OAUTH_ERROR_MESSAGES[errCode]);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Lütfen kullanıcı adı/e-posta ve şifrenizi girin.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Giriş yapılamadı.');
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
      setError('Bağlantı hatası oluştu.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-6 sm:p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Tekrar Hoş Geldiniz
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Topluluk hesabınıza giriş yaparak tartışmalara katılın
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Kullanıcı Adı veya E-posta
            </label>
            <input
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="kullanici_adi veya ornek@eposta.com"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Şifre
              </label>
              <Link
                href="/sifremi-unuttum"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Şifremi Unuttum?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="leading-snug">
              <strong className="text-slate-800 dark:text-slate-200">
                Oturumu bu cihazda açık tut (Beni Hatırla)
              </strong>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                İşaretlenmezse siteden çıkarken oturum tercihiniz sorulur veya sekme kapandığında oturum kapatılır.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <GoogleSignInButton label="Google ile Giriş Yap" />

        <div className="mt-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-center">
          🔒 Oturumunuz <strong>HttpOnly</strong> güvenli çerezlerle korunur, reklam veya takip çerezi kullanılmaz.{' '}
          <Link
            href="/gizlilik"
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Gizlilik & Veri Şeffaflığı Politikası
          </Link>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Henüz hesabınız yok mu?{' '}
          <Link
            href="/kayit"
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Hemen Kayıt Olun
          </Link>
        </p>
      </div>
    </div>
  );
}

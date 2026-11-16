'use client';

import React, { useState } from 'react';
import { X, UserCheck, ChevronRight } from 'lucide-react';

function GoogleLogo() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.275c0-.85-.075-1.665-.215-2.45H12v4.635h6.445c-.28 1.495-1.125 2.76-2.395 3.61v3h3.875c2.265-2.085 3.565-5.155 3.565-8.795z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.955-1.075 7.94-2.91l-3.875-3c-1.075.72-2.45 1.145-4.065 1.145-3.125 0-5.77-2.11-6.715-4.945H1.28v3.095C3.255 21.305 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.285 14.29c-.24-.72-.375-1.49-.375-2.29s.135-1.57.375-2.29V6.615H1.28C.465 8.24 0 10.065 0 12s.465 3.76 1.28 5.385l4.005-3.095z"
      />
      <path
        fill="#EA4335"
        d="M12 4.765c1.76 0 3.34.605 4.585 1.795l3.44-3.44C17.95 1.19 15.235 0 12 0 7.31 0 3.255 2.695 1.28 6.615l4.005 3.095c.945-2.835 3.59-4.945 6.715-4.945z"
      />
    </svg>
  );
}

const QUICK_GOOGLE_ACCOUNTS = [
  {
    email: 'burak.yilmaz@gmail.com',
    displayName: 'Burak Yılmaz',
    color: '#3b82f6',
  },
  {
    email: 'selin.kaya@gmail.com',
    displayName: 'Selin Kaya',
    color: '#10b981',
  },
];

export function GoogleSignInButton({
  label = 'Google ile Devam Et',
}: {
  label?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleButtonClick = async () => {
    setError('');
    try {
      const res = await fetch('/api/auth/google?check=1', { method: 'GET' });
      const data = await res.json().catch(() => null);

      // Eğer gerçek GOOGLE_CLIENT_ID & SECRET tanımlıysa doğrudan Google OAuth adresine yönlendir
      if (data?.oauthConfigured) {
        window.location.href = '/api/auth/google';
        return;
      }

      // GOOGLE_CLIENT_ID tanımlı değilse etkileşimli Google Hesap Seçici penceresini aç
      setModalOpen(true);
    } catch {
      setModalOpen(true);
    }
  };

  const signInWithGoogleAccount = async (targetEmail: string, targetName: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!targetEmail.trim() || !emailRegex.test(targetEmail.trim())) {
      setError('Lütfen geçerli bir Google e-posta adresi girin.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail.trim(),
          displayName: targetName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Google ile giriş yapılamadı.');
        setLoading(false);
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Sunucu ile bağlantı kurulamadı.');
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithGoogleAccount(email, displayName);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        className="w-full inline-flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs transition-all cursor-pointer"
      >
        <GoogleLogo />
        <span>{label}</span>
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <GoogleLogo />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Google ile Oturum Açın
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Bir Google hesabı seçin
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Foruma devam etmek için hazır bir hesap seçin veya kendi Gmail adresinizi girin.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Hızlı Google Hesap Seçici */}
            <div className="space-y-2 mb-4">
              {QUICK_GOOGLE_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => signInWithGoogleAccount(acc.email, acc.displayName)}
                  className="w-full flex items-center justify-between gap-3 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/40 hover:bg-blue-50/40 dark:hover:bg-slate-800/70 transition-all text-left group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ backgroundColor: acc.color }}
                    >
                      {acc.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        {acc.displayName}
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {acc.email}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>

            <div className="my-3.5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                veya başka bir hesap kullanın
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <form onSubmit={handleGoogleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google E-posta Adresi (Gmail) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ad Soyad (Yeni hesaplar için)
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Örn: Burak Yılmaz"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm disabled:opacity-50 transition-all"
                >
                  {loading ? 'Oturum Açılıyor...' : 'Google ile Devam Et'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

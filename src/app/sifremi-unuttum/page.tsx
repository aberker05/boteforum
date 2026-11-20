'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Send,
  Copy,
  Check,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'verify' | 'done'>('request');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Hesap doğrulanamadı.');
      } else {
        setGeneratedCode(data.resetCode || '');
        setStep('verify');
      }
    } catch {
      setError('Sunucu ile bağlantı kurulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Güvenliğiniz için yeni şifreniz en az 8 karakter olmalıdır.');
      return;
    }

    if (!/[a-zA-ZğüşöçıİĞÜŞÖÇ]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Yeni şifreniz en az bir harf ve en az bir rakam içermelidir.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Şifre sıfırlanamadı.');
      } else {
        setStep('done');
      }
    } catch {
      setError('Sunucu ile bağlantı kurulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const copyAndFillCode = () => {
    if (!generatedCode) return;
    setCode(generatedCode);
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="mb-4">
        <Link
          href="/giris"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Giriş Ekranına Dön
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-6 sm:p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Şifremi Unuttum
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {step === 'request' &&
              'Hesabınızı doğrulayarak yeni şifre belirleme kodu alın'}
            {step === 'verify' &&
              '6 haneli doğrulama kodunu ve yeni şifrenizi girin'}
            {step === 'done' && 'Şifreniz güvenli bir şekilde güncellendi'}
          </p>
        </div>

        {/* Adım Göstergesi */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div
            className={`h-1.5 rounded-full transition-colors ${
              step === 'request' || step === 'verify' || step === 'done'
                ? 'bg-indigo-600'
                : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-colors ${
              step === 'verify' || step === 'done'
                ? 'bg-indigo-600'
                : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {step === 'request' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kullanıcı Adınız
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Örn: mert_ai"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kayıtlı E-posta Adresiniz
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mert@novatek.forum"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                Başka kişilerin hesabınıza izinsiz sıfırlama talebi göndermesini önlemek amacıyla kullanıcı adınız ve kayıtlı e-posta adresiniz birlikte doğrulanır.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Kontrol Ediliyor...' : 'Doğrulama Kodu Oluştur'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {generatedCode ? (
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Tek Kullanımlık Sıfırlama Kodunuz
                  </span>
                  <button
                    type="button"
                    onClick={copyAndFillCode}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:underline"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Aktarıldı
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Kodu Otomatik Doldur
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xl font-extrabold tracking-widest text-slate-900 dark:text-white font-mono">
                  {generatedCode}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kod 15 dakika boyunca geçerlidir.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                📧 6 haneli doğrulama kodunuz <strong>{email}</strong> adresine e-posta olarak gönderildi. Lütfen gelen kutunuzu (ve gerekirse Spam/Gereksiz klasörünü) kontrol edin.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                6 Haneli Doğrulama Kodu
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Yeni Şifre (En az 8 karakter, harf ve rakam)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Yeni Şifre (Tekrar)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setError('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Geri
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                {loading ? 'Güncelleniyor...' : 'Şifremi Sıfırla'}
              </button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4 py-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Şifreniz Başarıyla Değiştirildi!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Artık yeni şifrenizle hesabınıza giriş yapabilirsiniz.
              </p>
            </div>
            <Link
              href="/giris"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
            >
              Giriş Sayfasına Git
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, X, CheckCircle2 } from 'lucide-react';

const REPORT_REASONS = [
  'Küfür, Hakaret veya Nefret Söylemi',
  'Spam veya Reklam İçeriği',
  'Zararlı Bağlantı / Güvenlik Tehdidi',
  'Yanlış Kategori / Konu Dışı',
  'Diğer (Açıklama ekleyin)',
];

interface ReportModalButtonProps {
  targetType: 'THREAD' | 'COMMENT';
  targetId: string;
  isLoggedIn: boolean;
  compact?: boolean;
}

export function ReportModalButton({
  targetType,
  targetId,
  isLoggedIn,
  compact = false,
}: ReportModalButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = () => {
    if (!isLoggedIn) {
      router.push('/giris');
      return;
    }
    setError('');
    setSubmitted(false);
    setDetails('');
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Rapor gönderilemedi.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title={targetType === 'THREAD' ? 'Konuyu Rapor Et' : 'Yorumu Rapor Et'}
        className={
          compact
            ? 'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors'
            : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600 hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors'
        }
      >
        <Flag className="w-3.5 h-3.5" />
        <span>Rapor Et</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-500" />
                {targetType === 'THREAD' ? 'Konuyu Rapor Et' : 'Yorumu Rapor Et'}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bildiriminiz Yönetime İletildi
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Topluluk kurallarını korumamıza yardımcı olduğunuz için teşekkür ederiz. Yöneticiler en kısa sürede inceleyecektir.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Tamam
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Raporlama Nedeni Seçin
                  </label>
                  <div className="space-y-1.5">
                    {REPORT_REASONS.map((r) => (
                      <label
                        key={r}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                          reason === r
                            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ek Açıklama (İsteğe Bağlı)
                  </label>
                  <textarea
                    rows={2}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Yöneticiler için kısa bir not ekleyebilirsiniz..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
                  >
                    {loading ? 'Gönderiliyor...' : 'Raporu Gönder'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}


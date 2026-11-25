'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-md border border-[#232730] bg-[#15181E] p-7 text-center space-y-4">
        <div className="w-12 h-12 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-block px-2 py-0.5 rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
            ERR // RUNTIME_EXCEPTION
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-[#E6EDF3] pt-1">
            Beklenmeyen Bir Hata Oluştu
          </h1>
          <p className="text-xs sm:text-sm text-[#8B949E] leading-relaxed">
            Sayfa yüklenirken geçici bir sorun meydana geldi. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold border border-[#232730] bg-[#0D0F12] text-[#E6EDF3] hover:border-[#10B981]/50 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}

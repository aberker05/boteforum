import React from 'react';
import Link from 'next/link';
import { Compass, Home, Newspaper } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-md border border-[#232730] bg-[#15181E] p-7 text-center space-y-4">
        <div className="w-12 h-12 rounded-md bg-[#0D0F12] border border-[#232730] text-[#F59E0B] flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-block px-2.5 py-0.5 rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/35">
            404 // KAYNAK BULUNAMADI
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-[#E6EDF3] pt-1">
            Aradığınız içerik taşınmış veya silinmiş olabilir
          </h1>
          <p className="text-xs sm:text-sm text-[#8B949E] leading-relaxed">
            Ulaşmaya çalıştığınız konu, kullanıcı profili veya sayfa mevcut değil. Ana sayfaya dönerek güncel tartışmalara göz atabilirsiniz.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0D0F12] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/haberler"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold border border-[#232730] bg-[#0D0F12] text-[#E6EDF3] hover:border-[#10B981]/50 transition-colors"
          >
            <Newspaper className="w-3.5 h-3.5 text-[#10B981]" />
            Teknoloji Gündemi
          </Link>
        </div>
      </div>
    </div>
  );
}

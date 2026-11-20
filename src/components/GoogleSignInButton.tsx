'use client';

import React, { useEffect, useState } from 'react';

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

export function GoogleSignInButton({
  label = 'Google ile Devam Et',
}: {
  label?: string;
}) {
  const [oauthConfigured, setOauthConfigured] = useState<boolean | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/google?check=1')
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setOauthConfigured(Boolean(data?.oauthConfigured));
        }
      })
      .catch(() => {
        if (active) setOauthConfigured(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Yalnızca gerçek Google OAuth 2.0 (GOOGLE_CLIENT_ID & SECRET) yapılandırıldığında gösterilir;
  // şifresiz sahte/demo girişe kesinlikle izin verilmez.
  if (!oauthConfigured) {
    return null;
  }

  return (
    <div>
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          veya
        </span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <button
        type="button"
        disabled={redirecting}
        onClick={() => {
          setRedirecting(true);
          window.location.href = '/api/auth/google';
        }}
        className="w-full inline-flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs transition-all cursor-pointer disabled:opacity-60"
      >
        <GoogleLogo />
        <span>{redirecting ? 'Google Hesabına Yönlendiriliyor...' : label}</span>
      </button>
    </div>
  );
}

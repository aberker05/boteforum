import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Üst İnce Yükleme Çubuğu */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-indigo-500/20 overflow-hidden">
        <div className="h-full w-1/3 bg-indigo-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
      </div>

      {/* Üst Başlık / Breadcrumb İskeleti */}
      <div className="h-11 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 w-full" />

      {/* Ana İçerik Izgarası İskeleti */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="h-44 rounded-3xl bg-slate-200/70 dark:bg-slate-800/60" />
          <div className="h-32 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50" />
          <div className="h-32 rounded-2xl bg-slate-200/50 dark:bg-slate-800/40" />
        </div>
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="h-56 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50" />
          <div className="h-40 rounded-2xl bg-slate-200/50 dark:bg-slate-800/40" />
        </div>
      </div>
    </div>
  );
}

import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Üst Bento Komuta Merkezi İskeleti (Anında Ekrana Gelir) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-7 h-72 rounded-3xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-6 w-48 rounded-full bg-slate-300/70 dark:bg-slate-800" />
              <div className="h-6 w-40 rounded-full bg-slate-300/50 dark:bg-slate-800/70" />
            </div>
            <div className="h-9 w-4/5 rounded-xl bg-slate-300/80 dark:bg-slate-800" />
            <div className="h-4 w-3/5 rounded-lg bg-slate-300/60 dark:bg-slate-800/70" />
            <div className="h-11 w-full max-w-xl rounded-2xl bg-slate-300/60 dark:bg-slate-800/80" />
          </div>
          <div className="flex gap-3 pt-4">
            <div className="h-10 w-36 rounded-xl bg-indigo-500/30" />
            <div className="h-10 w-36 rounded-xl bg-emerald-500/20" />
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="h-48 rounded-3xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 rounded-2xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80" />
            <div className="h-16 rounded-2xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80" />
          </div>
        </div>
      </div>

      {/* Kategori Şeridi İskeleti */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-16 rounded-2xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80"
          />
        ))}
      </div>

      {/* 3 Sütunlu Forum Akışı İskeleti */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <div className="h-56 rounded-2xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80" />
          <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80" />
        </div>
        <div className="lg:col-span-6 space-y-3.5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 rounded-2xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80"
            />
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <div className="h-44 rounded-2xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80" />
          <div className="h-60 rounded-2xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80" />
        </div>
      </div>
    </div>
  );
}

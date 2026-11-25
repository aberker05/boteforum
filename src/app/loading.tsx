import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Üst Komuta Paneli İskeleti */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-7 h-64 rounded-md bg-[#15181E] border border-[#232730] p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex gap-2">
              <div className="h-5 w-44 rounded-sm bg-[#232730]" />
              <div className="h-5 w-36 rounded-sm bg-[#232730]/70" />
            </div>
            <div className="h-8 w-4/5 rounded-md bg-[#232730]" />
            <div className="h-4 w-3/5 rounded-sm bg-[#232730]/70" />
            <div className="h-10 w-full max-w-xl rounded-md bg-[#0D0F12] border border-[#232730]" />
          </div>
          <div className="flex gap-2.5 pt-3 border-t border-[#232730]">
            <div className="h-9 w-36 rounded-md bg-[#10B981]/25" />
            <div className="h-9 w-36 rounded-md bg-[#0D0F12] border border-[#232730]" />
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          <div className="h-44 rounded-md bg-[#15181E] border border-[#232730]" />
          <div className="grid grid-cols-2 gap-2.5">
            <div className="h-14 rounded-md bg-[#15181E] border border-[#232730]" />
            <div className="h-14 rounded-md bg-[#15181E] border border-[#232730]" />
          </div>
        </div>
      </div>

      {/* Kalıcı Kategori Rayı İskeleti */}
      <div className="h-12 rounded-md bg-[#15181E] border border-[#232730] px-3 flex items-center gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div
            key={idx}
            className="h-7 w-28 shrink-0 rounded-md bg-[#0D0F12] border border-[#232730]"
          />
        ))}
      </div>

      {/* 3 Sütunlu Forum Akışı İskeleti */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="hidden lg:block lg:col-span-3 space-y-3.5">
          <div className="h-52 rounded-md bg-[#15181E] border border-[#232730]" />
          <div className="h-64 rounded-md bg-[#15181E] border border-[#232730]" />
        </div>
        <div className="lg:col-span-6 space-y-2.5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 rounded-md bg-[#15181E] border border-[#232730]"
            />
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-3 space-y-3.5">
          <div className="h-40 rounded-md bg-[#15181E] border border-[#232730]" />
          <div className="h-56 rounded-md bg-[#15181E] border border-[#232730]" />
        </div>
      </div>
    </div>
  );
}

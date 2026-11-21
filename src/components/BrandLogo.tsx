'use client';

import React from 'react';
import type { SiteSettings } from '@/lib/siteSettings';
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from './CategoryIcon';

export const BRAND_LOGO_ICONS = CATEGORY_ICON_OPTIONS.map((item) => ({
  name: item.name,
  label: item.label.split(' (')[0],
}));

export function renderBrandIcon(name: string, className = 'w-5 h-5') {
  return <CategoryIcon name={name || 'Sparkles'} className={className} />;
}

export function BrandLogo({
  settings,
  size = 'md',
  showTagline = true,
}: {
  settings: SiteSettings;
  size?: 'sm' | 'md';
  showTagline?: boolean;
}) {
  const boxSize =
    size === 'sm'
      ? 'w-8 h-8 rounded-xl'
      : 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5';
  const titleSize =
    size === 'sm' ? 'text-base' : 'text-base sm:text-lg';

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
      {settings.logoType === 'image' && settings.logoImageUrl ? (
        <div
          className={`${boxSize} overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs shrink-0 group-hover:scale-105 transition-transform`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.logoImageUrl}
            alt={`${settings.siteNamePrimary}${settings.siteNameAccent} Logo`}
            className="w-full h-full object-contain"
          />
        </div>
      ) : settings.logoType === 'text' ? (
        <div
          className={`${boxSize} flex items-center justify-center text-white font-black tracking-tighter text-xs shadow-md group-hover:scale-105 transition-transform shrink-0`}
          style={{ backgroundColor: settings.brandColor }}
        >
          {settings.logoText || 'NF'}
        </div>
      ) : (
        <div
          className={`${boxSize} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0`}
          style={{ backgroundColor: settings.brandColor }}
        >
          {renderBrandIcon(settings.logoIcon, iconSize)}
        </div>
      )}

      <div className="flex flex-col">
        <span
          className={`font-extrabold ${titleSize} tracking-tight leading-none text-slate-900 dark:text-white`}
        >
          {settings.siteNamePrimary}
          {settings.siteNameAccent && (
            <span style={{ color: settings.brandColor }}>
              {settings.siteNameAccent}
            </span>
          )}
        </span>
        {showTagline && settings.siteTagline && (
          <span className="hidden sm:block text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5 truncate max-w-[180px] lg:max-w-none">
            {settings.siteTagline}
          </span>
        )}
      </div>
    </div>
  );
}


'use client';

import React from 'react';
import type { SiteSettings } from '@/lib/siteSettings';
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from './CategoryIcon';

export const BRAND_LOGO_ICONS = CATEGORY_ICON_OPTIONS.map((item) => ({
  name: item.name,
  label: item.label.split(' (')[0],
}));

export function renderBrandIcon(name: string, className = 'w-4 h-4') {
  return <CategoryIcon name={name || 'Terminal'} className={className} />;
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
      ? 'w-7 h-7 rounded-md'
      : 'w-8 h-8 rounded-md';
  const iconSize = 'w-4 h-4';
  const titleSize =
    size === 'sm' ? 'text-sm' : 'text-sm sm:text-base';
  const accentColor =
    settings.brandColor && settings.brandColor.toLowerCase() !== '#6366f1'
      ? settings.brandColor
      : '#10B981';

  return (
    <div className="flex items-center gap-2.5 shrink-0 group">
      {settings.logoType === 'image' && settings.logoImageUrl ? (
        <div
          className={`${boxSize} overflow-hidden flex items-center justify-center bg-[#15181E] border border-[#232730] shrink-0`}
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
          className={`${boxSize} flex items-center justify-center font-mono font-bold tracking-tight text-xs border border-[#232730] bg-[#15181E] shrink-0`}
          style={{ color: accentColor }}
        >
          {settings.logoText || 'NF'}
        </div>
      ) : (
        <div
          className={`${boxSize} flex items-center justify-center border border-[#232730] bg-[#15181E] group-hover:border-[#10B981]/60 transition-colors shrink-0`}
          style={{ color: accentColor }}
        >
          {renderBrandIcon(settings.logoIcon, iconSize)}
        </div>
      )}

      <div className="flex flex-col">
        <span
          className={`font-bold ${titleSize} tracking-tight leading-none text-[#E6EDF3]`}
        >
          {settings.siteNamePrimary}
          {settings.siteNameAccent && (
            <span style={{ color: accentColor }}>
              {settings.siteNameAccent}
            </span>
          )}
        </span>
        {showTagline && settings.siteTagline && (
          <span className="hidden sm:block font-mono text-[10px] font-medium text-[#8B949E] tracking-wider uppercase mt-0.5 truncate max-w-[180px] lg:max-w-none">
            {settings.siteTagline}
          </span>
        )}
      </div>
    </div>
  );
}

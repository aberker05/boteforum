'use client';

import React from 'react';
import {
  Sparkles,
  Code2,
  Rocket,
  MessageSquare,
  Shield,
  Layers,
  Cpu,
  Globe,
  Zap,
  Terminal,
} from 'lucide-react';
import type { SiteSettings } from '@/lib/siteSettings';

export const BRAND_LOGO_ICONS = [
  { name: 'Sparkles', label: 'Parıltı' },
  { name: 'Code2', label: 'Kod' },
  { name: 'Rocket', label: 'Roket' },
  { name: 'MessageSquare', label: 'Sohbet' },
  { name: 'Terminal', label: 'Terminal' },
  { name: 'Cpu', label: 'Çip / Donanım' },
  { name: 'Globe', label: 'Küresel' },
  { name: 'Zap', label: 'Enerji' },
  { name: 'Layers', label: 'Katmanlar' },
  { name: 'Shield', label: 'Kalkan' },
];

export function renderBrandIcon(name: string, className = 'w-5 h-5') {
  switch (name) {
    case 'Code2':
      return <Code2 className={className} />;
    case 'Rocket':
      return <Rocket className={className} />;
    case 'MessageSquare':
      return <MessageSquare className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Cpu':
      return <Cpu className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Terminal':
      return <Terminal className={className} />;
    default:
      return <Sparkles className={className} />;
  }
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
  const boxSize = size === 'sm' ? 'w-8 h-8 rounded-xl' : 'w-9 h-9 rounded-xl';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const titleSize = size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <div className="flex items-center gap-2.5 shrink-0 group">
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
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
            {settings.siteTagline}
          </span>
        )}
      </div>
    </div>
  );
}


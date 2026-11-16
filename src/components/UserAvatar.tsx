'use client';

import React, { useState } from 'react';

export function parseAvatarValue(raw?: string): {
  color: string;
  imageUrl: string;
} {
  if (!raw) return { color: '#6366f1', imageUrl: '' };
  const trimmed = raw.trim();
  if (trimmed.includes('|')) {
    const [c, ...rest] = trimmed.split('|');
    const color = /^#[0-9a-fA-F]{6}$/.test(c) ? c : '#6366f1';
    const imageUrl = rest.join('|').trim();
    return { color, imageUrl };
  }
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return { color: trimmed, imageUrl: '' };
  }
  return { color: '#6366f1', imageUrl: trimmed };
}

export function formatAvatarValue(color: string, imageUrl?: string): string {
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#6366f1';
  const cleanImg = (imageUrl || '').trim();
  if (!cleanImg) return safeColor;
  return `${safeColor}|${cleanImg}`;
}

export async function compressAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Lütfen geçerli bir resim dosyası (PNG, JPG, WEBP) seçin.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel işlenemedi.'));
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Görsel kırpıcı başlatılamadı.'));
          return;
        }

        // Merkezden kare (1:1) kırpma (Center Crop)
        const minSide = Math.min(img.width, img.height);
        const sx = Math.round((img.width - minSide) / 2);
        const sy = Math.round((img.height - minSide) / 2);

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/webp', 0.84);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

interface UserAvatarProps {
  name: string;
  avatar?: string;
  className?: string;
}

export function UserAvatar({
  name,
  avatar,
  className = 'w-9 h-9 rounded-xl text-xs',
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const { color, imageUrl } = parseAvatarValue(avatar);
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center text-white font-bold select-none shrink-0 ${className}`}
      style={{ backgroundColor: color }}
    >
      {imageUrl && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

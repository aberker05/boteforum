'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  Check,
  Palette,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import {
  resolveNewsImageUrl,
  TECH_NEWS_PRESET_COVERS,
  TECH_NEWS_CATEGORIES,
} from '@/lib/techNews';
import { CategoryIcon, RICH_COLOR_PALETTE } from './CategoryIcon';

interface TechNewsCoverProps {
  title: string;
  category: string;
  badgeColor: string;
  imageUrl?: string;
  slug?: string;
  className?: string;
  overlayVariant?: 'card' | 'hero' | 'detail' | 'none';
}

export function getCategoryIcon(category: string, className = 'w-5 h-5') {
  const matched = TECH_NEWS_CATEGORIES.find((c) => c.name === category);
  if (matched?.icon) {
    return <CategoryIcon name={matched.icon} className={className} />;
  }
  switch (category) {
    case 'Yapay Zeka':
      return <CategoryIcon name="Sparkles" className={className} />;
    case 'Siber Güvenlik':
      return <CategoryIcon name="Shield" className={className} />;
    case 'Donanım & Çip':
      return <CategoryIcon name="Cpu" className={className} />;
    case 'Web & Yazılım':
      return <CategoryIcon name="Code2" className={className} />;
    case 'Uzay & Bilim':
      return <CategoryIcon name="Rocket" className={className} />;
    case 'Mobil & Bulut':
      return <CategoryIcon name="Cloud" className={className} />;
    default:
      return <CategoryIcon name="Sparkles" className={className} />;
  }
}

export default function TechNewsCover({
  title,
  category,
  badgeColor,
  imageUrl,
  slug,
  className = 'h-48 w-full',
  overlayVariant = 'card',
}: TechNewsCoverProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = resolveNewsImageUrl({ imageUrl, slug, category });

  return (
    <div
      className={`relative overflow-hidden bg-slate-950 select-none ${className}`}
    >
      {/* Katman 1: Kategoriye Özel Siber/Teknoloji Vektör Arka Planı (Yedek & Atmosfer) */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${badgeColor}35 0%, transparent 55%), linear-gradient(135deg, #0D0F12 0%, #15181E 100%)`,
        }}
      >
        {/* Siber Izgara Deseni */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id={`grid-${slug || category}`}
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 28 0 L 0 0 0 28"
                fill="none"
                stroke={badgeColor}
                strokeWidth="0.6"
                strokeOpacity="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${slug || category})`} />
        </svg>

        {/* Merkez İkon İllüstrasyonu (Görsel yüklenemezse veya kaldırılmışsa öne çıkar) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-md flex items-center justify-center border transition-transform duration-500 group-hover:scale-105"
            style={{
              backgroundColor: '#0D0F12',
              borderColor: `${badgeColor}55`,
              color: badgeColor,
            }}
          >
            {getCategoryIcon(category, 'w-7 h-7')}
          </div>
        </div>
      </div>

      {/* Katman 2: Yüksek Çözünürlüklü, Net ve Canlı Kapak Fotoğrafı */}
      {!imgError && resolvedUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedUrl}
          alt={title}
          loading="lazy"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center contrast-[1.04] saturate-[1.06] transition-transform duration-500 ease-out group-hover:scale-105"
        />
      )}

      {/* Katman 3: İnce Kenar Vinyeti (Görseli karartmadan yalnızca rozet okunabilirliğini destekler) */}
      {overlayVariant === 'hero' && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0D0F12]/80 via-[#0D0F12]/20 to-transparent" />
      )}

      {overlayVariant === 'card' && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0D0F12]/45 via-transparent to-[#0D0F12]/20" />
      )}

      {overlayVariant === 'detail' && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0D0F12]/65 via-transparent to-[#0D0F12]/20" />
      )}
    </div>
  );
}

export async function compressCoverImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Lütfen geçerli bir resim dosyası seçin.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel işlenemedi.'));
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 675;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas başlatılamadı.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', 0.82);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

interface TechNewsCoverPickerProps {
  imageUrl: string;
  category: string;
  onChange: (newUrl: string) => void;
  badgeColor?: string;
  onBadgeColorChange?: (newColor: string) => void;
}

export function TechNewsCoverPicker({
  imageUrl,
  category,
  onChange,
  badgeColor,
  onBadgeColorChange,
}: TechNewsCoverPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const defaultCatColor =
    TECH_NEWS_CATEGORIES.find((c) => c.name === category)?.color || '#10b981';
  const activeColor = badgeColor || defaultCatColor;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const compressed = await compressCoverImageFile(file);
      onChange(compressed);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Görsel yüklenirken hata oluştu.'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-[#232730] bg-[#0D0F12] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-mono font-semibold text-[#E6EDF3] flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#10B981]" />
          Haber Kapak Görseli
        </label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            {uploading ? 'İşleniyor...' : 'Bilgisayardan Yükle'}
          </button>
          {imageUrl !== 'none' && (
            <button
              type="button"
              onClick={() => onChange('none')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
              title="Fotoğrafı tamamen kaldır ve sadece ikonlu siber kapağı kullan"
            >
              <Trash2 className="w-3 h-3" />
              Resmi Kaldır
            </button>
          )}
          {imageUrl && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#15181E] hover:bg-[#1C212B] border border-[#232730] text-[#E6EDF3] text-[11px] transition-colors cursor-pointer"
              title="Varsayılan kategori görseline döndür"
            >
              <RotateCcw className="w-3 h-3" />
              Varsayılan Görsel
            </button>
          )}
        </div>
      </div>

      {/* Canlı Önizleme ve URL Girişi */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-4 rounded-md overflow-hidden border border-[#232730] h-24 relative group">
          <TechNewsCover
            title="Kapak Önizleme"
            category={category}
            badgeColor={activeColor}
            imageUrl={imageUrl}
            className="w-full h-full"
            overlayVariant="card"
          />
          <span className="absolute bottom-1.5 left-2 text-[10px] font-mono font-medium text-[#E6EDF3] bg-[#0D0F12]/90 px-1.5 py-0.5 rounded-sm border border-[#232730]">
            Canlı Önizleme
          </span>
        </div>

        <div className="sm:col-span-8 space-y-2">
          <input
            type="text"
            value={
              imageUrl.startsWith('data:image/') || imageUrl === 'none'
                ? ''
                : imageUrl
            }
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              imageUrl === 'none'
                ? 'Resim kaldırıldı — Yalnızca ikonlu siber kapak kullanılıyor'
                : imageUrl.startsWith('data:image/')
                ? 'Bilgisayardan özel görsel yüklendi (Kaldırmak için üstteki "Resmi Kaldır" butonuna basın)'
                : 'https://... görsel bağlantısı yapıştırın veya aşağıdan hazır kapak seçin'
            }
            className="w-full bg-[#15181E] border border-[#232730] rounded-md px-3 py-2 text-xs font-mono text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981]"
          />

          {/* Hazır Teknoloji Kapakları */}
          <div>
            <span className="block text-[10px] font-mono text-[#8B949E] mb-1">
              Veya tek tıkla hazır teknoloji kapaklarından seçin:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {TECH_NEWS_PRESET_COVERS.map((preset) => {
                const isSelected = imageUrl === preset.url;
                return (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => onChange(preset.url)}
                    className={`relative shrink-0 w-14 h-9 rounded-sm overflow-hidden border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#10B981] ring-1 ring-[#10B981]'
                        : 'border-[#232730] opacity-75 hover:opacity-100'
                    }`}
                    title={preset.label}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {onBadgeColorChange && (
        <div className="pt-2 border-t border-[#232730] space-y-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#E6EDF3]">
            <Palette className="w-3.5 h-3.5 text-[#10B981]" />
            İçerik Rozet &amp; Atmosfer Rengi Seçin:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {RICH_COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => onBadgeColorChange(c.hex)}
                title={c.label}
                className="w-6 h-6 rounded-sm flex items-center justify-center text-white transition-transform hover:scale-105 cursor-pointer border border-[#232730]"
                style={{ backgroundColor: c.hex }}
              >
                {activeColor.toLowerCase() === c.hex.toLowerCase() && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            ))}
            <input
              type="color"
              value={activeColor}
              onChange={(e) => onBadgeColorChange(e.target.value)}
              title="Özel Renk Seç"
              className="w-7 h-7 rounded-sm cursor-pointer border border-[#232730] bg-transparent"
            />
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-[11px] text-rose-400 font-medium">{uploadError}</p>
      )}
    </div>
  );
}


'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  Play,
  Film,
  ExternalLink,
  Upload,
  Trash2,
  Sparkles,
  Check,
  Link2,
} from 'lucide-react';
import {
  parseVideoSource,
  getSuggestedVideosForContext,
  SuggestedTopicVideo,
} from '@/lib/videoUtils';

interface VideoPlayerCardProps {
  url: string;
  title?: string;
  badgeText?: string;
  className?: string;
  compact?: boolean;
}

export function VideoPlayerCard({
  url,
  title,
  badgeText,
  className = '',
  compact = false,
}: VideoPlayerCardProps) {
  const info = useMemo(() => parseVideoSource(url), [url]);
  if (!info) return null;

  const displayTitle =
    title && title !== url ? title : 'Video İncelemesi & Sunum';

  return (
    <div
      className={`rounded-md overflow-hidden border border-[#232730] bg-[#0D0F12] ${className}`}
    >
      {/* Üst Terminal Video Başlık Çubuğu */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-[#15181E] border-b border-[#232730] text-xs font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-[#10B981]/15 border border-[#10B981]/35 text-[#10B981] text-[10px] font-bold shrink-0">
            <Play className="w-2.5 h-2.5 fill-[#10B981]" />
            {badgeText || info.providerLabel}
          </span>
          <span className="text-[#E6EDF3] font-sans font-semibold text-xs truncate">
            {displayTitle}
          </span>
        </div>

        {!info.originalUrl.startsWith('data:video/') && (
          <a
            href={info.originalUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#8B949E] hover:text-[#10B981] transition-colors shrink-0"
            title="Videoyu yeni sekmede aç"
          >
            <span className="hidden sm:inline">Kaynağı Aç</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* 16:9 Sinematik Video Oynatıcı */}
      <div
        className={`relative w-full bg-black ${
          compact ? 'aspect-video max-h-56' : 'aspect-video'
        }`}
      >
        {info.isDirectVideo ? (
          <video
            src={info.embedUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <iframe
            src={info.embedUrl}
            title={displayTitle}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 w-full h-full border-0"
          />
        )}
      </div>
    </div>
  );
}

interface TopicVideoPickerProps {
  videoUrl: string;
  onChange: (nextUrl: string, suggestedTitle?: string) => void;
  categoryName?: string;
  customTopic?: string;
  contextTitle?: string;
  mode?: 'thread' | 'news';
}

const MAX_SHORT_CLIP_BYTES = 2.5 * 1024 * 1024; // 2.5 MB kısa ekran kaydı / klip sınırı

export function TopicVideoPicker({
  videoUrl,
  onChange,
  categoryName = '',
  customTopic = '',
  contextTitle = '',
  mode = 'thread',
}: TopicVideoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const parsedCurrent = useMemo(() => parseVideoSource(videoUrl), [videoUrl]);
  const hasInvalidUrl =
    Boolean(videoUrl && videoUrl !== 'none' && videoUrl.trim().length > 4) &&
    !parsedCurrent;

  const suggestedVideos = useMemo(
    () =>
      getSuggestedVideosForContext({
        categoryName,
        customTopic,
        title: contextTitle,
        limit: 4,
      }),
    [categoryName, customTopic, contextTitle]
  );

  const handleShortClipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadError('');
    if (file.type !== 'video/mp4' && file.type !== 'video/webm') {
      setUploadError(
        'Yalnızca MP4 veya WebM formatında kısa video klipleri yüklenebilir. Uzun videolar için YouTube, Vimeo veya Loom bağlantısı yapıştırın.'
      );
      return;
    }

    if (file.size > MAX_SHORT_CLIP_BYTES) {
      setUploadError(
        'Doğrudan yüklenen kısa klip en fazla 2.5 MB olabilir. Daha uzun videolar için YouTube, Loom veya Vimeo bağlantısı kullanabilirsiniz.'
      );
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError('Video dosyası okunamadı.');
      setUploading(false);
    };
    reader.onload = () => {
      const result = String(reader.result || '');
      onChange(result, file.name.replace(/\.[^/.]+$/, ''));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSuggested = (vid: SuggestedTopicVideo) => {
    setUploadError('');
    if (videoUrl === vid.url) {
      onChange(mode === 'news' ? 'none' : '');
    } else {
      onChange(vid.url, vid.title);
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-[#232730] bg-[#0D0F12] p-3.5">
      {/* Üst Başlık ve Hızlı Kontroller */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-mono font-semibold text-[#E6EDF3] flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-[#10B981]" />
          {mode === 'news'
            ? 'Gündemle İlgili Video İncelemesi (İsteğe Bağlı)'
            : 'Konu Başlığına Uygun Video Ekle (İsteğe Bağlı)'}
        </label>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm"
            onChange={handleShortClipUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            title="Bilgisayardan kısa ekran kaydı veya klip yükle (MP4/WebM, maks. 2.5 MB)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            {uploading ? 'İşleniyor...' : 'Kısa Klip Yükle'}
          </button>

          {videoUrl && videoUrl !== 'none' && (
            <button
              type="button"
              onClick={() => onChange(mode === 'news' ? 'none' : '')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Videoyu Kaldır
            </button>
          )}
        </div>
      </div>

      {/* Bağlantı Giriş Kutusu */}
      <div className="relative">
        <Link2 className="w-3.5 h-3.5 text-[#8B949E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={
            videoUrl.startsWith('data:video/') || videoUrl === 'none'
              ? ''
              : videoUrl
          }
          onChange={(e) => {
            setUploadError('');
            onChange(e.target.value);
          }}
          placeholder={
            videoUrl.startsWith('data:video/')
              ? 'Bilgisayardan kısa video klibi eklendi (Kaldırmak için üstteki butonu kullanın)'
              : 'YouTube, YouTube Shorts, Vimeo, Loom veya doğrudan .mp4 / .webm bağlantısı yapıştırın...'
          }
          className="w-full pl-8 pr-3 py-2 rounded-md text-xs font-mono bg-[#15181E] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981]"
        />
      </div>

      {hasInvalidUrl && (
        <p className="text-[11px] text-[#F59E0B] font-mono">
          Geçerli bir YouTube, Vimeo, Loom veya doğrudan .mp4 / .webm video adresi girin.
        </p>
      )}

      {uploadError && (
        <p className="text-[11px] text-rose-400 font-medium">{uploadError}</p>
      )}

      {/* Seçilen Kategori ve Başlığa Göre Akıllı Video Önerileri */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#8B949E]">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
            {categoryName || customTopic
              ? `"${customTopic || categoryName}" başlığına uygun önerilen videolar:`
              : 'Konu başlığına uygun hazır teknik videolar (tek tıkla ekle):'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestedVideos.map((vid) => {
            const isSelected = videoUrl === vid.url;
            const parsedSug = parseVideoSource(vid.url);
            return (
              <button
                key={vid.id}
                type="button"
                onClick={() => handleSelectSuggested(vid)}
                className={`group flex items-center gap-2.5 p-2 rounded-md border text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#10B981] bg-[#10B981]/10'
                    : 'border-[#232730] bg-[#15181E] hover:border-[#10B981]/50'
                }`}
              >
                <div className="relative w-16 h-10 rounded-sm overflow-hidden bg-[#0D0F12] border border-[#232730] shrink-0">
                  {parsedSug?.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={parsedSug.thumbnailUrl}
                      alt={vid.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#10B981]">
                      <Play className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="absolute inset-0 bg-black/35 flex items-center justify-center">
                    {isSelected ? (
                      <Check className="w-4 h-4 text-[#10B981]" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-white fill-white/90" />
                    )}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-[#E6EDF3] group-hover:text-[#10B981] line-clamp-1">
                    {vid.title}
                  </p>
                  <p className="text-[10px] font-mono text-[#8B949E] truncate">
                    {vid.channel} • {vid.duration}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Canlı Video Önizlemesi */}
      {parsedCurrent && (
        <div className="pt-1">
          <VideoPlayerCard
            url={videoUrl}
            title={
              contextTitle.trim() ||
              (mode === 'news' ? 'Gündem Video Önizleme' : 'Konu Videosu Önizleme')
            }
            badgeText="CANLI ÖNİZLEME"
            compact
          />
        </div>
      )}
    </div>
  );
}

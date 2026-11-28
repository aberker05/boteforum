'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Film,
  ExternalLink,
  Upload,
  Trash2,
  Sparkles,
  Check,
  Link2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  parseVideoSource,
  attachSourceToVideoUrl,
  getSuggestedVideosForContext,
  SuggestedTopicVideo,
} from '@/lib/videoUtils';

interface VideoPlayerCardProps {
  url: string;
  title?: string;
  sourceCredit?: string;
  badgeText?: string;
  className?: string;
  compact?: boolean;
}

export function VideoPlayerCard({
  url,
  title,
  sourceCredit,
  badgeText,
  className = '',
  compact = false,
}: VideoPlayerCardProps) {
  const info = useMemo(() => parseVideoSource(url), [url]);
  if (!info) return null;

  const displayTitle =
    title && title !== url
      ? title.replace(/\s*\|\s*Kaynak:.*$/i, '').trim()
      : 'Video İncelemesi & Sunum';

  const effectiveSource =
    (sourceCredit && sourceCredit.trim()) || info.sourceName;

  const isExternalLink = !info.originalUrl.startsWith('data:video/');

  return (
    <figure
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

        {isExternalLink && (
          <a
            href={info.originalUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#10B981] hover:underline shrink-0"
            title="Videoyu orijinal yayıncı sayfasında aç"
          >
            <span className="hidden sm:inline">Orijinal Kaynakta İzle</span>
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

      {/* Zorunlu Kaynak Gösterimi & Telif Hakkı Bildirim Alt Çubuğu */}
      <figcaption className="px-3.5 py-2.5 bg-[#15181E] border-t border-[#232730] space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            <span className="text-[#8B949E] shrink-0">Video Kaynağı:</span>
            {isExternalLink ? (
              <a
                href={info.originalUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-semibold text-[#E6EDF3] hover:text-[#10B981] hover:underline truncate"
              >
                {effectiveSource} ({info.sourceDomain})
              </a>
            ) : (
              <span className="font-semibold text-[#E6EDF3] truncate">
                {effectiveSource}
              </span>
            )}
          </div>

          {!compact && (
            <Link
              href="/destek"
              className="text-[10px] text-[#8B949E] hover:text-[#F59E0B] transition-colors"
              title="Telif hakkı veya kaynak bildirimi gönder"
            >
              Telif / Hak Bildirimi
            </Link>
          )}
        </div>

        {!compact && (
          <p className="text-[10px] text-[#8B949E] leading-relaxed">
            © {info.licenseNote}
          </p>
        )}
      </figcaption>
    </figure>
  );
}

interface TopicVideoPickerProps {
  videoUrl: string;
  onChange: (
    nextUrl: string,
    suggestedTitle?: string,
    suggestedSource?: string
  ) => void;
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
  const [sourceCreditInput, setSourceCreditInput] = useState(
    parsedCurrent?.sourceName &&
      !parsedCurrent.sourceName.includes('Yayıncısı') &&
      !parsedCurrent.sourceName.includes('Üreticisi')
      ? parsedCurrent.sourceName
      : ''
  );

  // Harici bir YouTube / Vimeo bağlantısı yapıştırıldığında oEmbed üzerinden kanal adını ve başlığı otomatik çekmeyi dene
  useEffect(() => {
    if (!parsedCurrent || parsedCurrent.isDirectVideo) return;
    if (
      parsedCurrent.provider !== 'youtube' &&
      parsedCurrent.provider !== 'vimeo'
    ) {
      return;
    }

    // Zaten katalogdan veya #kaynak= üzerinden bilinen özel kanal adı varsa tekrar sorma
    const isGenericFallback =
      parsedCurrent.sourceName === 'YouTube Resmi Yayıncısı' ||
      parsedCurrent.sourceName === 'Vimeo İçerik Üreticisi';
    if (!isGenericFallback) {
      setSourceCreditInput(parsedCurrent.sourceName);
      return;
    }

    let cancelled = false;
    fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(
        parsedCurrent.originalUrl
      )}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const author =
          typeof data.author_name === 'string' ? data.author_name.trim() : '';
        const fetchedTitle =
          typeof data.title === 'string' ? data.title.trim() : '';
        if (author) {
          setSourceCreditInput(author);
          const urlWithSource = attachSourceToVideoUrl(
            parsedCurrent.originalUrl,
            author
          );
          onChange(urlWithSource, fetchedTitle || undefined, author);
        }
      })
      .catch(() => {
        // Çevrimdışı veya erişim yoksa sessizce manuel girişe bırak
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedCurrent?.originalUrl]);

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
      setSourceCreditInput('Kendi Ekran Kaydım / Telifsiz Klip');
      onChange(
        result,
        file.name.replace(/\.[^/.]+$/, ''),
        'Kendi Ekran Kaydım / Telifsiz Klip'
      );
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSuggested = (vid: SuggestedTopicVideo) => {
    setUploadError('');
    const currentBase = parsedCurrent?.originalUrl || videoUrl;
    if (currentBase === vid.url) {
      setSourceCreditInput('');
      onChange(mode === 'news' ? 'none' : '', '', '');
    } else {
      setSourceCreditInput(vid.channel);
      const urlWithSource = attachSourceToVideoUrl(vid.url, vid.channel);
      onChange(urlWithSource, vid.title, vid.channel);
    }
  };

  const displayRawUrl = useMemo(() => {
    if (!videoUrl || videoUrl === 'none' || videoUrl.startsWith('data:video/')) {
      return '';
    }
    return videoUrl.replace(/#kaynak=[^&\s]*$/i, '');
  }, [videoUrl]);

  return (
    <div className="space-y-3 rounded-md border border-[#232730] bg-[#0D0F12] p-3.5">
      {/* Üst Başlık ve Hızlı Kontroller */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-mono font-semibold text-[#E6EDF3] flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-[#10B981]" />
          {mode === 'news'
            ? 'Gündemle İlgili Video İncelemesi & Kaynak Gösterimi'
            : 'Konu Başlığına Uygun Video & Kaynak Gösterimi'}
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
            title="Yalnızca size ait veya açık lisanslı kısa ekran kaydı yükleyin (MP4/WebM, maks. 2.5 MB)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            {uploading ? 'İşleniyor...' : 'Kendi Klibini Yükle'}
          </button>

          {videoUrl && videoUrl !== 'none' && (
            <button
              type="button"
              onClick={() => {
                setSourceCreditInput('');
                onChange(mode === 'news' ? 'none' : '', '', '');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Videoyu Kaldır
            </button>
          )}
        </div>
      </div>

      {/* Bağlantı ve Kaynak / Üretici Giriş Kutuları */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="sm:col-span-7 relative">
          <Link2 className="w-3.5 h-3.5 text-[#8B949E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={displayRawUrl}
            onChange={(e) => {
              setUploadError('');
              const raw = e.target.value;
              const nextUrl =
                raw.trim() && sourceCreditInput.trim()
                  ? attachSourceToVideoUrl(raw, sourceCreditInput)
                  : raw;
              onChange(nextUrl, undefined, sourceCreditInput || undefined);
            }}
            placeholder={
              videoUrl.startsWith('data:video/')
                ? 'Kısa video klibi eklendi'
                : 'YouTube, Vimeo, Loom veya .mp4 bağlantısı...'
            }
            className="w-full pl-8 pr-3 py-2 rounded-md text-xs font-mono bg-[#15181E] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981]"
          />
        </div>

        <div className="sm:col-span-5 relative">
          <UserCheck className="w-3.5 h-3.5 text-[#10B981] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={sourceCreditInput}
            onChange={(e) => {
              const nextSource = e.target.value;
              setSourceCreditInput(nextSource);
              if (videoUrl && videoUrl !== 'none' && !videoUrl.startsWith('data:video/')) {
                const base = videoUrl.replace(/#kaynak=[^&\s]*$/i, '');
                onChange(
                  attachSourceToVideoUrl(base, nextSource),
                  undefined,
                  nextSource
                );
              }
            }}
            placeholder="Kaynak / Kanal Adı (Örn: MIT, Vercel)"
            title="Telif hakkına saygı gereği video üreticisinin / kanalın adı oynatıcı altında kaynak olarak gösterilir"
            className="w-full pl-8 pr-3 py-2 rounded-md text-xs font-mono bg-[#15181E] border border-[#232730] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#10B981]"
          />
        </div>
      </div>

      {/* Telif ve Kaynak Gösterimi Bilgilendirme Şeridi */}
      <div className="flex items-start gap-2 px-2.5 py-2 rounded-sm bg-[#15181E] border border-[#232730] text-[10px] text-[#8B949E] leading-relaxed">
        <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
        <span>
          <strong className="text-[#E6EDF3]">Telif &amp; Kaynak Güvencesi:</strong>{' '}
          Dış videolar sitemizde kopyalanmaz; yalnızca yayıncının gömülü oynatmaya (embed) izin verdiği resmi oynatıcı kullanılır ve <strong>Kaynak / Kanal Adı</strong> ile orijinal bağlantı video altında zorunlu olarak gösterilir.
        </span>
      </div>

      {hasInvalidUrl && (
        <p className="text-[11px] text-[#F59E0B] font-mono">
          Geçerli bir YouTube, Vimeo, Loom veya doğrudan .mp4 / .webm video adresi girin.
        </p>
      )}

      {uploadError && (
        <p className="text-[11px] text-rose-400 font-medium">{uploadError}</p>
      )}

      {/* Seçilen Kategori ve Başlığa Göre Kaynaklı Akıllı Video Önerileri */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#8B949E]">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
            {categoryName || customTopic
              ? `"${customTopic || categoryName}" başlığına uygun resmi kaynaklı videolar:`
              : 'Konu başlığına uygun resmi kaynaklı teknik videolar (kaynağıyla otomatik eklenir):'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestedVideos.map((vid) => {
            const currentBase = parsedCurrent?.originalUrl || displayRawUrl;
            const isSelected = currentBase === vid.url;
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
                  <p className="text-[10px] font-mono text-[#10B981] truncate">
                    Kaynak: {vid.channel} • {vid.duration}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Canlı Video & Kaynak Gösterimi Önizlemesi */}
      {parsedCurrent && (
        <div className="pt-1">
          <VideoPlayerCard
            url={videoUrl}
            title={
              contextTitle.trim() ||
              (mode === 'news'
                ? 'Gündem Video Önizleme'
                : 'Konu Videosu Önizleme')
            }
            sourceCredit={sourceCreditInput || parsedCurrent.sourceName}
            badgeText="CANLI ÖNİZLEME"
            compact
          />
        </div>
      )}
    </div>
  );
}

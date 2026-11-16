'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Terminal, Maximize2, X } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const SAFE_RASTER_DATA_IMAGE_REGEX =
  /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=\s]+$/i;

function isSafeLinkHref(href?: string): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('/') ||
    lower.startsWith('#')
  );
}

function isSafeImageSrc(src?: string): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/') ||
    lower.startsWith('data:image/svg')
  ) {
    return false;
  }
  if (lower.startsWith('data:')) {
    return SAFE_RASTER_DATA_IMAGE_REGEX.test(trimmed);
  }
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('/')
  );
}

// react-markdown varsayılan olarak tüm data: URL'lerini siler; güvenli raster görsellerine izin verip zararlı protokolleri engelliyoruz
function safeMarkdownUrlTransform(url: string, key: string): string {
  if (!url) return '';
  if (key === 'src') {
    return isSafeImageSrc(url) ? url.trim() : '';
  }
  return isSafeLinkHref(url) ? url.trim() : '';
}

function extractTextFromChildren(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromChildren).join('');
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractTextFromChildren(props.children);
  }
  return '';
}

function CodeBlockContainer({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  // Alt code elementinden dil bilgisini ve ham metni çıkar
  let language = 'kod';
  if (React.isValidElement(children)) {
    const childProps = children.props as { className?: string };
    const match = /language-([\w-]+)/.exec(childProps.className || '');
    if (match && match[1]) {
      language = match[1].toLowerCase();
    }
  }

  const rawCode = extractTextFromChildren(children).replace(/\n$/, '');
  const lineCount = rawCode ? rawCode.split('\n').length : 1;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(rawCode);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = rawCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Kopyalama hatası yoksayılır
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-[#0b0f19] shadow-md group">
      {/* Üst Kod Başlık Çubuğu */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/95 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono font-bold uppercase tracking-wider text-[11px] text-slate-200">
            {language}
          </span>
          <span className="text-[11px] text-slate-500">• {lineCount} satır</span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
          title="Kodu Panoya Kopyala"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kopyalandı!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Kodu Kopyala</span>
            </>
          )}
        </button>
      </div>

      {/* Kod İçeriği */}
      <pre className="!my-0 !rounded-none !border-0 overflow-x-auto p-4 text-xs sm:text-sm font-mono leading-relaxed text-slate-100">
        {children}
      </pre>
    </div>
  );
}

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <div className={`markdown-body text-slate-700 dark:text-slate-200 ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          urlTransform={safeMarkdownUrlTransform}
          components={{
            pre: ({ children }) => <CodeBlockContainer>{children}</CodeBlockContainer>,
            a: ({ href, children }) => {
              if (!isSafeLinkHref(href)) {
                return <span className="text-slate-400 line-through">{children}</span>;
              }
              const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
              return (
                <a
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer nofollow' : undefined}
                >
                  {children}
                </a>
              );
            },
            img: ({ src, alt }) => {
              const srcStr = typeof src === 'string' ? src : undefined;
              if (!isSafeImageSrc(srcStr) || !srcStr) return null;
              return (
                <span className="block my-3">
                  <button
                    type="button"
                    onClick={() => setLightboxImage({ src: srcStr, alt: alt || 'Görsel' })}
                    className="relative group inline-block max-w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={srcStr}
                      alt={alt || 'Forum görseli'}
                      loading="lazy"
                      className="max-h-96 w-auto object-contain rounded-xl transition-transform group-hover:scale-[1.01]"
                    />
                    <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      Büyüt
                    </span>
                  </button>
                </span>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Tam Ekran Görsel Önizleme (Lightbox) Modalı */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            {lightboxImage.alt && (
              <p className="mt-2 text-xs text-slate-300 font-medium">{lightboxImage.alt}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
});

'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  Terminal,
  Maximize2,
  X,
  WrapText,
} from 'lucide-react';

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

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    return true;
  } catch {
    return false;
  }
}

function InlineCodeCopy({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = extractTextFromChildren(children);

  const handleCopy = async () => {
    if (!text) return;
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <code
      onClick={handleCopy}
      title="Kopyalamak için tıklayın"
      className="inline-flex items-center gap-1 cursor-pointer hover:ring-1 hover:ring-indigo-500/40 transition-all"
    >
      <span>{children}</span>
      {copied && (
        <span className="text-[10px] font-sans font-bold text-emerald-500 ml-0.5">
          ✓
        </span>
      )}
    </code>
  );
}

function CodeBlockContainer({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);

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
  const lines = rawCode ? rawCode.split('\n') : [''];
  const lineCount = lines.length;

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(rawCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-slate-800 bg-[#0b0f19] shadow-lg group relative">
      {/* Üst Kod Başlık Çubuğu */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/95 border-b border-slate-800/90 text-xs text-slate-400">
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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setWordWrap(!wordWrap)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              wordWrap
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700/80'
            }`}
            title="Satır Kaydırmayı Aç/Kapat"
          >
            <WrapText className="w-3 h-3" />
            <span className="hidden sm:inline">Kaydır</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-500/40 shadow-xs'
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
      </div>

      {/* Satır Numaralı Kod İçeriği */}
      <div className="flex overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed">
        {lineCount > 1 && (
          <div
            aria-hidden="true"
            className="select-none py-4 pl-3.5 pr-2.5 text-right text-slate-600 bg-slate-950/50 border-r border-slate-800/60 shrink-0"
          >
            {lines.map((_, idx) => (
              <div key={idx}>{idx + 1}</div>
            ))}
          </div>
        )}
        <pre
          className={`!my-0 !rounded-none !border-0 !bg-transparent flex-1 p-4 text-slate-100 ${
            wordWrap ? 'whitespace-pre-wrap break-words' : 'overflow-x-auto'
          }`}
        >
          <code>{rawCode}</code>
        </pre>
      </div>
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
            code: ({ className: codeClass, children }) => {
              const isBlock = Boolean(codeClass && codeClass.includes('language-'));
              if (isBlock) {
                return <code className={codeClass}>{children}</code>;
              }
              return <InlineCodeCopy>{children}</InlineCodeCopy>;
            },
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

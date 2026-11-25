'use client';

import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Code,
  Quote,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
  ImagePlus,
  Terminal,
  Eye,
  Edit3,
  Loader2,
  Trash2,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];
const MAX_RAW_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_EMBEDDED_IMAGES = 4;
const MAX_IMAGE_DIMENSION = 1200;

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Görsel dosyası okunamadı.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (file.type === 'image/gif' && file.size <= 350 * 1024) {
        resolve(dataUrl);
        return;
      }

      const img = new window.Image();
      img.onerror = () => reject(new Error('Görsel biçimi doğrulanamadı.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const ratio = Math.min(
            MAX_IMAGE_DIMENSION / width,
            MAX_IMAGE_DIMENSION / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Görsel işleme motoru başlatılamadı.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let compressed = canvas.toDataURL('image/webp', 0.8);
        if (!compressed.startsWith('data:image/webp')) {
          compressed = canvas.toDataURL('image/jpeg', 0.8);
        }
        resolve(compressed);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Düşüncelerinizi, kod örneklerinizi veya sorunuzu Markdown formatında yazabilirsiniz...',
  rows = 8,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const embeddedImageMatches =
    value.match(/data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+/gi) || [];
  const plainTextLength = value.replace(
    /data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+/gi,
    ''
  ).length;

  const attachedImages = React.useMemo(() => {
    const list: Array<{
      fullMatch: string;
      alt: string;
      url: string;
      index: number;
    }> = [];
    const regex = /!\[([^\]]*)\]\((data:image\/[^)\s]+|https?:\/\/[^)\s]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(value)) !== null) {
      list.push({
        fullMatch: match[0],
        alt: match[1] || `Görsel ${list.length + 1}`,
        url: match[2],
        index: match.index,
      });
    }
    return list;
  }, [value]);

  const handleRemoveAttachedImage = (targetMatch: string, targetIndex: number) => {
    const before = value.slice(0, targetIndex);
    const after = value.slice(targetIndex + targetMatch.length);
    const nextValue = (before.replace(/\n$/, '') + '\n' + after.replace(/^\n/, '')).trim();
    onChange(nextValue);
  };

  const handleRemoveAllImages = () => {
    const cleaned = value
      .replace(/!\[([^\]]*)\]\((data:image\/[^)\s]+|https?:\/\/[^)\s]+)\)/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    onChange(cleaned);
  };

  const insertFormat = (prefix: string, suffix: string = '', defaultText: string = 'metin') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;

    const nextValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextValue);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  // Editör içi geliştirici klavye kısayolları (Ctrl+Enter gönder, Ctrl+B kalın, Ctrl+I italik, Ctrl+E kod, Tab girinti)
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
      return;
    }

    if (e.altKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      setTab((prev) => (prev === 'write' ? 'preview' : 'write'));
      return;
    }

    if (mod && !e.shiftKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertFormat('**', '**', 'kalın metin');
      return;
    }

    if (mod && !e.shiftKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertFormat('*', '*', 'italik metin');
      return;
    }

    if (mod && !e.shiftKey && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      insertFormat('`', '`', 'kod');
      return;
    }

    if (mod && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      insertFormat('\n```typescript\n', '\n```\n', '// kodunuzu buraya yazın');
      return;
    }

    if (mod && !e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      insertFormat('[', '](https://ornek.com)', 'bağlantı metni');
      return;
    }

    if (e.key === 'Tab' && !mod && !e.altKey) {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const nextValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(nextValue);
      setTimeout(() => {
        el.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  };

  const processAndInsertImageFile = async (file: File) => {
    setUploadError('');

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      setUploadError(
        'Güvenlik nedeniyle yalnızca PNG, JPG, WEBP veya GIF formatında görsel yükleyebilirsiniz (SVG desteklenmez).'
      );
      return;
    }

    if (file.size > MAX_RAW_FILE_BYTES) {
      setUploadError('Görsel boyutu en fazla 8 MB olabilir.');
      return;
    }

    if (embeddedImageMatches.length >= MAX_EMBEDDED_IMAGES) {
      setUploadError(`Bir içeriğe en fazla ${MAX_EMBEDDED_IMAGES} adet görsel ekleyebilirsiniz.`);
      return;
    }

    setUploadingImage(true);
    try {
      const compressedDataUrl = await compressImageToDataUrl(file);
      const cleanAlt =
        file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[\[\]()]/g, '')
          .slice(0, 40) || 'Ekran Görüntüsü';
      const imageMarkdown = `\n![${cleanAlt}](${compressedDataUrl})\n`;

      const el = textareaRef.current;
      const start = el ? el.selectionStart : value.length;
      const end = el ? el.selectionEnd : value.length;
      const nextValue = value.substring(0, start) + imageMarkdown + value.substring(end);
      onChange(nextValue);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Görsel yüklenirken bir hata oluştu.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processAndInsertImageFile(file);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processAndInsertImageFile(file);
        }
        return;
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processAndInsertImageFile(file);
    }
  };

  return (
    <div
      className={`rounded-md border transition-colors overflow-hidden ${
        dragActive
          ? 'border-[#10B981] bg-[#10B981]/5'
          : 'border-[#232730] bg-[#0D0F12] focus-within:border-[#10B981]'
      }`}
    >
      {/* Araç Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#232730] bg-[#15181E]">
        <div className="flex items-center gap-1 font-mono">
          <button
            type="button"
            onClick={() => setTab('write')}
            title="Yazma Modu (Alt+P)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'write'
                ? 'bg-[#10B981] text-[#0D0F12]'
                : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Düzenle
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            title="Önizleme Modu (Alt+P)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'preview'
                ? 'bg-[#10B981] text-[#0D0F12]'
                : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Önizleme
          </button>
        </div>

        {tab === 'write' && (
          <div className="flex flex-wrap items-center gap-0.5">
            <button
              type="button"
              title="Kalın (Ctrl+B)"
              onClick={() => insertFormat('**', '**', 'kalın metin')}
              className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors cursor-pointer"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="İtalik (Ctrl+I)"
              onClick={() => insertFormat('*', '*', 'italik metin')}
              className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors cursor-pointer"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Alt Başlık"
              onClick={() => insertFormat('\n### ', '\n', 'Alt Başlık')}
              className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors cursor-pointer"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Satır İçi Kod (Ctrl+E)"
              onClick={() => insertFormat('`', '`', 'kod')}
              className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors cursor-pointer"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Kod Bloğu (Ctrl+Shift+C)"
              onClick={() => insertFormat('\n```typescript\n', '\n```\n', '// kodunuzu buraya yazın')}
              className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Alıntı"
              onClick={() => insertFormat('\n> ', '\n', 'Alıntı metni')}
              className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors cursor-pointer"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Liste"
              onClick={() => insertFormat('\n- ', '\n', 'Liste öğesi')}
              className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors cursor-pointer"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Bağlantı Ekle (Ctrl+L)"
              onClick={() => insertFormat('[', '](https://ornek.com)', 'bağlantı metni')}
              className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors cursor-pointer"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Görsel URL Bağlantısı Ekle"
              onClick={() => insertFormat('![', '](https://ornek.com/gorsel.png)', 'Görsel açıklaması')}
              className="p-1.5 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D0F12] transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploadingImage}
              title="Bilgisayardan Görsel Yükle veya Ctrl+V ile Yapıştır"
              onClick={() => fileInputRef.current?.click()}
              className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/35 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {uploadingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" />
              )}
              <span>{uploadingImage ? 'Yükleniyor...' : 'Görsel Yükle'}</span>
            </button>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/25 text-xs text-rose-400 flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError('')}
            className="text-rose-400 hover:underline font-semibold ml-2"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Editör / Önizleme Alanı */}
      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleEditorKeyDown}
          onPaste={handlePaste}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          placeholder={placeholder}
          className="w-full p-4 bg-transparent text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none resize-y font-sans leading-relaxed"
        />
      ) : (
        <div className="p-4 min-h-[180px] bg-[#0D0F12]">
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-[#8B949E] italic">Önizlenecek içerik henüz yazılmadı...</p>
          )}
        </div>
      )}

      {/* Eklenen Görselleri Tek Tıkla Kaldırma / Yönetim Paneli */}
      {attachedImages.length > 0 && (
        <div className="px-3.5 py-2.5 border-t border-[#232730] bg-[#15181E] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#E6EDF3] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#10B981]" />
              İçeriğe Eklenen Görseller ({attachedImages.length})
            </span>
            {attachedImages.length > 1 && (
              <button
                type="button"
                onClick={handleRemoveAllImages}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Tüm Görselleri Kaldır
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {attachedImages.map((img, idx) => (
              <div
                key={`${img.index}-${idx}`}
                className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-md border border-[#232730] bg-[#0D0F12]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-11 h-11 rounded-sm object-cover border border-[#232730] shrink-0 bg-[#15181E]"
                />
                <div className="min-w-0 max-w-[130px]">
                  <p className="text-xs font-semibold text-[#E6EDF3] truncate">
                    {img.alt}
                  </p>
                  <p className="text-[10px] font-mono text-[#8B949E]">
                    {img.url.startsWith('data:image/')
                      ? 'Yüklenen Resim'
                      : 'Harici Görsel'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachedImage(img.fullMatch, img.index)}
                  title="Bu resmi içerikten kaldır"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Resmi Kaldır</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-3.5 py-2 border-t border-[#232730] bg-[#15181E] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#8B949E]">
        <span>
          <strong className="text-[#E6EDF3]">Ctrl+Enter</strong> gönder •{' '}
          <strong className="text-[#E6EDF3]">Ctrl+B</strong> kalın •{' '}
          <strong className="text-[#E6EDF3]">Ctrl+E</strong> kod •{' '}
          <strong className="text-[#E6EDF3]">Ctrl+V</strong> görsel
        </span>
        <div className="flex items-center gap-2.5">
          {embeddedImageMatches.length > 0 && (
            <span className="px-2 py-0.5 rounded-sm bg-[#10B981]/15 text-[#10B981] font-semibold">
              {embeddedImageMatches.length}/{MAX_EMBEDDED_IMAGES} görsel
            </span>
          )}
          <span className="tabular-nums">{plainTextLength} krk</span>
        </div>
      </div>
    </div>
  );
}

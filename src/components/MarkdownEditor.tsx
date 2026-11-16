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
      // GIF animasyonlarını bozmamak için küçük boyutlu GIF'leri olduğu gibi koru
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
      className={`rounded-xl border transition-all overflow-hidden ${
        dragActive
          ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500'
      }`}
    >
      {/* Araç Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === 'write'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Düzenle
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === 'preview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
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
              title="Kalın (Bold)"
              onClick={() => insertFormat('**', '**', 'kalın metin')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="İtalik"
              onClick={() => insertFormat('*', '*', 'italik metin')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Alt Başlık"
              onClick={() => insertFormat('\n### ', '\n', 'Alt Başlık')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Satır İçi Kod (`kod`)"
              onClick={() => insertFormat('`', '`', 'kod')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Kod Bloğu (Kopyalanabilir)"
              onClick={() => insertFormat('\n```typescript\n', '\n```\n', '// kodunuzu buraya yazın')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <Terminal className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Alıntı"
              onClick={() => insertFormat('\n> ', '\n', 'Alıntı metni')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Liste"
              onClick={() => insertFormat('\n- ', '\n', 'Liste öğesi')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Bağlantı Ekle"
              onClick={() => insertFormat('[', '](https://ornek.com)', 'bağlantı metni')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Görsel URL Bağlantısı Ekle"
              onClick={() => insertFormat('![', '](https://ornek.com/gorsel.png)', 'Görsel açıklaması')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Bilgisayardan Görsel Yükle Butonu */}
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
              className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors disabled:opacity-50"
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
        <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/25 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError('')}
            className="text-rose-500 hover:underline font-semibold ml-2"
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
          onPaste={handlePaste}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          placeholder={placeholder}
          className="w-full p-4 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-y font-sans leading-relaxed"
        />
      ) : (
        <div className="p-4 min-h-[180px] bg-slate-50/40 dark:bg-slate-900/40">
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-slate-400 italic">Önizlenecek içerik henüz yazılmadı...</p>
          )}
        </div>
      )}

      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>
          Markdown, kod bloğu (```) ve <strong>Ctrl+V ile görsel yapıştırma</strong> desteklenir
        </span>
        <div className="flex items-center gap-2.5">
          {embeddedImageMatches.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
              {embeddedImageMatches.length}/{MAX_EMBEDDED_IMAGES} görsel eklendi
            </span>
          )}
          <span>{plainTextLength} karakter</span>
        </div>
      </div>
    </div>
  );
}

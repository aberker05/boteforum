'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Tag,
  Sparkles,
  Layers,
  BarChart3,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { MarkdownEditor } from './MarkdownEditor';
import { CategoryIcon } from './CategoryIcon';

const NEW_THREAD_DRAFT_KEY = 'novaforum_draft_new_thread';

const QUICK_CUSTOM_TOPICS = [
  { label: 'Siber Güvenlik & Pentest', icon: 'Shield', color: '#f43f5e' },
  { label: 'Kriptografi & Ağ Güvenliği', icon: 'Lock', color: '#ef4444' },
  { label: 'Yapay Zeka & LLM', icon: 'Sparkles', color: '#10b981' },
  { label: 'Oyun Geliştirme', icon: 'Gamepad2', color: '#a855f7' },
  { label: 'DevOps, Linux & Sunucu', icon: 'Terminal', color: '#06b6d4' },
  { label: 'Veri Bilimi & SQL', icon: 'Database', color: '#3b82f6' },
  { label: 'Donanım & Gömülü Sistem', icon: 'Cpu', color: '#f59e0b' },
  { label: 'Eğitim Teknolojileri', icon: 'BookOpen', color: '#6366f1' },
  { label: 'BÖTE & Akademik', icon: 'GraduationCap', color: '#0ea5e9' },
  { label: 'Mobil Uygulama', icon: 'Smartphone', color: '#ec4899' },
  { label: 'Robotik & Otomasyon', icon: 'Bot', color: '#14b8a6' },
];

interface CategoryOption {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
}

export function NewThreadForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const standardCategories = categories.filter((c) => c.name !== 'Diğer');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(standardCategories[0]?.id || 'OTHER');
  const [customTopic, setCustomTopic] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // İlk yüklemede kaydedilmiş taslağı geri yükle
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NEW_THREAD_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.title === 'string') setTitle(parsed.title);
          if (typeof parsed.categoryId === 'string' && parsed.categoryId) {
            setCategoryId(parsed.categoryId);
          }
          if (typeof parsed.customTopic === 'string') setCustomTopic(parsed.customTopic);
          if (typeof parsed.tags === 'string') setTags(parsed.tags);
          if (typeof parsed.content === 'string') setContent(parsed.content);
          if (parsed.title || parsed.content || parsed.tags) {
            setDraftSavedTime(parsed.savedAt || 'Az önce');
          }
        }
      }
    } catch {
      // localStorage erişim hatası yoksayılır
    } finally {
      setDraftHydrated(true);
    }
  }, []);

  // Yazılan içerikleri otomatik olarak localStorage taslağına kaydet
  useEffect(() => {
    if (!draftHydrated) return;

    const timer = setTimeout(() => {
      try {
        const hasAnyInput =
          title.trim().length > 0 ||
          content.trim().length > 0 ||
          tags.trim().length > 0 ||
          customTopic.trim().length > 0;

        if (!hasAnyInput) {
          window.localStorage.removeItem(NEW_THREAD_DRAFT_KEY);
          setDraftSavedTime(null);
          return;
        }

        const nowStr = new Date().toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        window.localStorage.setItem(
          NEW_THREAD_DRAFT_KEY,
          JSON.stringify({
            title,
            categoryId,
            customTopic,
            tags,
            content,
            savedAt: nowStr,
          })
        );
        setDraftSavedTime(nowStr);
      } catch {
        // localStorage kota hatası yoksayılır
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, categoryId, customTopic, tags, content, draftHydrated]);

  const handleClearDraft = () => {
    setTitle('');
    setCustomTopic('');
    setTags('');
    setContent('');
    setHasPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setDraftSavedTime(null);
    try {
      window.localStorage.removeItem(NEW_THREAD_DRAFT_KEY);
    } catch {
      // yoksay
    }
  };

  const isOtherSelected = categoryId === 'OTHER';

  const handleAddOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const next = [...pollOptions];
    next[index] = val;
    setPollOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) {
      setError('Lütfen başlık, kategori ve içerik alanlarını doldurun.');
      return;
    }

    if (isOtherSelected && !customTopic.trim()) {
      setError('Diğer seçeneğini işaretlediğiniz için lütfen konunun alanını/başlığını yazın.');
      return;
    }

    if (hasPoll) {
      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (!pollQuestion.trim()) {
        setError('Anket eklediğiniz için lütfen bir anket sorusu yazın.');
        return;
      }
      if (validOptions.length < 2) {
        setError('Anket için en az 2 dolu seçenek girmelisiniz.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          categoryId,
          customTopic: isOtherSelected ? customTopic : undefined,
          tags,
          content,
          poll: hasPoll
            ? {
                question: pollQuestion.trim(),
                options: pollOptions.map((o) => o.trim()).filter(Boolean),
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Konu oluşturulamadı.');
        setLoading(false);
      } else {
        try {
          window.localStorage.removeItem(NEW_THREAD_DRAFT_KEY);
        } catch {
          // yoksay
        }
        router.push(`/konu/${data.thread.slug}`);
      }
    } catch {
      setError('Sunucu ile bağlantı kurulamadı.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Foruma Dön
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Yeni Konu Başlat
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sorunuzu, projenizi veya tartışmak istediğiniz fikri toplulukla paylaşın.
              </p>
            </div>
          </div>

          {draftSavedTime && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Taslak kaydedildi ({draftSavedTime})</span>
              <button
                type="button"
                onClick={handleClearDraft}
                className="ml-1 inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:underline"
                title="Kaydedilen taslağı temizle"
              >
                <RotateCcw className="w-3 h-3" />
                Temizle
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Kategori Seçimi */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Kategori Seçin
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {standardCategories.map((cat) => {
                const selected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                        }}
                      >
                        <CategoryIcon
                          name={cat.icon || 'MessageSquare'}
                          className="w-4 h-4"
                          color={cat.color}
                        />
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {cat.description}
                    </p>
                  </button>
                );
              })}

              {/* Diğer Seçeneği */}
              <button
                type="button"
                onClick={() => setCategoryId('OTHER')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isOtherSelected
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Diğer (Farklı Konu Alanı)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  Yukarıdaki başlıklara uymayan konularınız için özel alan belirtin.
                </p>
              </button>
            </div>

            {/* Diğer Seçildiğinde Açılan Özel Konu Alanı Kutusu */}
            {isOtherSelected && (
              <div className="mt-3 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2.5">
                <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Diğer Konu Alanı / Alt Başlığı Seçin veya Yazın *
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CUSTOM_TOPICS.map((t) => {
                    const active = customTopic === t.label;
                    return (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => setCustomTopic(t.label)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        <CategoryIcon
                          name={t.icon}
                          className="w-3.5 h-3.5"
                          color={active ? '#ffffff' : t.color}
                        />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  required
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Örn: Siber Güvenlik, Oyun Geliştirme, Donanım Tavsiyesi, Robotik..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Yukarıdaki ikonlu alanlardan birine tıklayabilir veya kendi özel konu başlığınızı yazabilirsiniz.
                </p>
              </div>
            )}
          </div>

          {/* Konu Başlığı */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Konu Başlığı
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Next.js 15'te Server Actions ile form doğrulama nasıl yapılır?"
              className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
            />
          </div>

          {/* Etiketler */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              Etiketler (Virgülle ayırın, en fazla 5 adet)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Örn: nextjs, react, typescript, yardım"
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
            />
          </div>

          {/* Zengin Markdown Editörü */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Konu İçeriği
            </label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              rows={10}
              placeholder="Konunuzu detaylıca açıklayın. Kod örnekleri, başlıklar ve listeler için üstteki araç çubuğunu kullanabilirsiniz..."
            />
          </div>

          {/* İsteğe Bağlı Anket Oluşturma Alanı */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Konuya Anket Ekle (İsteğe Bağlı)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Topluluğun fikrini almak için çoktan seçmeli bir oylama başlatın.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHasPoll(!hasPoll)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  hasPoll
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {hasPoll ? 'Anketi Kaldır' : '+ Anket Oluştur'}
              </button>
            </div>

            {hasPoll && (
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Anket Sorusu *
                  </label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Örn: Sizce 2026 yılında hangi web framework'ü daha çok tercih edilecek?"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Seçenekler (En az 2, en fazla 6 seçenek)
                  </label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs font-bold text-slate-400">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`${idx + 1}. Seçenek`}
                        className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Seçeneği Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Yeni Seçenek Ekle ({pollOptions.length}/6)
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Yayınlanıyor...' : 'Konuyu Yayınla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

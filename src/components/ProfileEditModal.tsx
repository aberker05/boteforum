'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Edit2,
  X,
  Check,
  Lock,
  User,
  Camera,
  Trash2,
} from 'lucide-react';
import {
  UserAvatar,
  parseAvatarValue,
  formatAvatarValue,
  compressAvatarFile,
} from './UserAvatar';

const COLORS = [
  '#6366f1',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#14b8a6',
  '#f43f5e',
];

interface ProfileEditModalProps {
  initialDisplayName: string;
  initialEmail?: string;
  initialBio: string;
  initialColor: string;
}

export function ProfileEditModal({
  initialDisplayName,
  initialEmail = '',
  initialBio,
  initialColor,
}: ProfileEditModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parsedInitial = parseAvatarValue(initialColor);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'profile' | 'security'>('profile');

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [email, setEmail] = useState(initialEmail);
  const [bio, setBio] = useState(initialBio);
  const [baseColor, setBaseColor] = useState(parsedInitial.color);
  const [avatarImageUrl, setAvatarImageUrl] = useState(parsedInitial.imageUrl);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const combinedAvatarValue = formatAvatarValue(baseColor, avatarImageUrl);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploadingPhoto(true);
    try {
      const compressed = await compressAvatarFile(file);
      setAvatarImageUrl(compressed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Fotoğraf yüklenirken bir hata oluştu.'
      );
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (tab === 'security') {
      if (!currentPassword || !newPassword) {
        setError('Lütfen mevcut ve yeni şifrenizi girin.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Yeni şifreler birbiriyle eşleşmiyor.');
        return;
      }
      if (newPassword.length < 8) {
        setError('Güvenliğiniz için yeni şifreniz en az 8 karakter olmalıdır.');
        return;
      }
      if (!/[a-zA-ZğüşöçıİĞÜŞÖÇ]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        setError('Yeni şifreniz en az bir harf ve en az bir rakam içermelidir.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload =
        tab === 'profile'
          ? {
              displayName,
              email,
              bio,
              avatarColor: combinedAvatarValue,
            }
          : { currentPassword, newPassword };

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Güncelleme başarısız oldu.');
      } else {
        if (tab === 'security') {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('Şifreniz başarıyla güncellendi.');
        } else {
          setOpen(false);
          router.refresh();
        }
      }
    } catch {
      setError('Bir bağlantı hatası oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const fresh = parseAvatarValue(initialColor);
          setDisplayName(initialDisplayName);
          setEmail(initialEmail);
          setBio(initialBio);
          setBaseColor(fresh.color);
          setAvatarImageUrl(fresh.imageUrl);
          setError('');
          setSuccessMsg('');
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <Edit2 className="w-3.5 h-3.5" />
        Profili & Fotoğrafı Düzenle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Hesap & Profil Ayarları
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sekmeler */}
            <div className="flex gap-1 p-1 mb-4 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTab('profile');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tab === 'profile'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Profil & Fotoğraf
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('security');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tab === 'security'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Şifre Değiştir
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {tab === 'profile' ? (
                <>
                  {/* Profil Fotoğrafı Yükleme Bölümü */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center gap-4">
                    <UserAvatar
                      name={displayName || initialDisplayName}
                      avatar={combinedAvatarValue}
                      className="w-16 h-16 rounded-2xl text-2xl shadow-md"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Profil Fotoğrafı
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={uploadingPhoto}
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {uploadingPhoto ? 'İşleniyor...' : 'Fotoğraf Seç'}
                        </button>
                        {avatarImageUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarImageUrl('')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Kaldır
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Otomatik kare (1:1) kırpılır ve sıkıştırılır.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Görünen Ad Soyad
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Konu ve yorumlarınızda yazar adı olarak herkese açık görünür.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      E-posta Adresi
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      🔒 Gizlidir; profil sayfanızda diğer üyelere asla gösterilmez.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Hakkımda (Biyografi)
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Kendinizden ve ilgi alanlarınızdan kısaca bahsedin..."
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      İsteğe bağlıdır. Profil sayfanızda topluluk üyelerine görünür.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Varsayılan Avatar Rengi (Fotoğraf yoksa görünür)
                    </label>
                    <div className="flex items-center gap-2.5">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setBaseColor(color)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-110 cursor-pointer"
                          style={{ backgroundColor: color }}
                        >
                          {baseColor === color && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Mevcut Şifreniz
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Yeni Şifre (En az 8 karakter, harf ve rakam)
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Yeni Şifre (Tekrar)
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 cursor-pointer"
                >
                  {saving
                    ? 'Kaydediliyor...'
                    : tab === 'profile'
                    ? 'Profili Güncelle'
                    : 'Şifreyi Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

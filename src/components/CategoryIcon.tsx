'use client';

import React from 'react';
import {
  Megaphone,
  Code2,
  Sparkles,
  Palette,
  Rocket,
  HelpCircle,
  MessageSquare,
  Layers,
  Shield,
  ShieldAlert,
  Lock,
  KeyRound,
  Bug,
  Fingerprint,
  Terminal,
  Cpu,
  Server,
  Database,
  Cloud,
  Wifi,
  Globe,
  Smartphone,
  GraduationCap,
  BookOpen,
  Brain,
  Bot,
  Gamepad2,
  LineChart,
  Wrench,
  Zap,
  Video,
  Award,
} from 'lucide-react';

export interface IconOption {
  name: string;
  label: string;
  group: string;
}

export const CATEGORY_ICON_OPTIONS: IconOption[] = [
  // Siber Güvenlik & Ağ
  { name: 'Shield', label: 'Kalkan (Siber Güvenlik)', group: 'Siber Güvenlik' },
  { name: 'ShieldAlert', label: 'Güvenlik Uyarısı / SOC', group: 'Siber Güvenlik' },
  { name: 'Lock', label: 'Kilit (Kriptografi & Gizlilik)', group: 'Siber Güvenlik' },
  { name: 'KeyRound', label: 'Anahtar (Yetkilendirme & Auth)', group: 'Siber Güvenlik' },
  { name: 'Bug', label: 'Zafiyet / Pentest & CTF', group: 'Siber Güvenlik' },
  { name: 'Fingerprint', label: 'Biyometri & Adli Bilişim', group: 'Siber Güvenlik' },

  // Yazılım & Sistem
  { name: 'Code2', label: 'Kod & Yazılım Geliştirme', group: 'Yazılım & Sistem' },
  { name: 'Terminal', label: 'Terminal / Linux & Shell', group: 'Yazılım & Sistem' },
  { name: 'Database', label: 'Veritabanı & SQL', group: 'Yazılım & Sistem' },
  { name: 'Server', label: 'Sunucu & DevOps', group: 'Yazılım & Sistem' },
  { name: 'Cloud', label: 'Bulut Bilişim (Cloud)', group: 'Yazılım & Sistem' },
  { name: 'Globe', label: 'Web & İnternet Teknolojileri', group: 'Yazılım & Sistem' },
  { name: 'Wifi', label: 'Ağ & Telekomünikasyon', group: 'Yazılım & Sistem' },

  // Yapay Zeka, Donanım & Bilim
  { name: 'Sparkles', label: 'Yapay Zeka & İnovasyon', group: 'Teknoloji & AI' },
  { name: 'Bot', label: 'Otonom Ajan & Robotik', group: 'Teknoloji & AI' },
  { name: 'Brain', label: 'Derin Öğrenme & Sinir Ağları', group: 'Teknoloji & AI' },
  { name: 'Cpu', label: 'Donanım, Çip & Gömülü Sistem', group: 'Teknoloji & AI' },
  { name: 'Smartphone', label: 'Mobil Uygulama & Cihazlar', group: 'Teknoloji & AI' },
  { name: 'LineChart', label: 'Veri Bilimi & Analitik', group: 'Teknoloji & AI' },

  // Eğitim, Tasarım & Topluluk
  { name: 'GraduationCap', label: 'Akademi, BÖTE & Eğitim', group: 'Eğitim & Topluluk' },
  { name: 'BookOpen', label: 'Ders Notu & Kaynaklar', group: 'Eğitim & Topluluk' },
  { name: 'Palette', label: 'UI/UX & Grafik Tasarım', group: 'Eğitim & Topluluk' },
  { name: 'Gamepad2', label: 'Oyun Geliştirme & E-Spor', group: 'Eğitim & Topluluk' },
  { name: 'Video', label: 'Multimedya & İçerik Üretimi', group: 'Eğitim & Topluluk' },
  { name: 'Rocket', label: 'Proje, Girişim & Kariyer', group: 'Eğitim & Topluluk' },
  { name: 'Wrench', label: 'Araçlar & Teknik Destek', group: 'Eğitim & Topluluk' },
  { name: 'Zap', label: 'Hızlı İpuçları & Performans', group: 'Eğitim & Topluluk' },
  { name: 'Megaphone', label: 'Duyurular & Haberler', group: 'Eğitim & Topluluk' },
  { name: 'HelpCircle', label: 'Soru - Cevap & Yardım', group: 'Eğitim & Topluluk' },
  { name: 'MessageSquare', label: 'Genel Sohbet & Tartışma', group: 'Eğitim & Topluluk' },
  { name: 'Layers', label: 'Diğer / Genel Kategori', group: 'Eğitim & Topluluk' },
  { name: 'Award', label: 'Yarışma & Başarılar', group: 'Eğitim & Topluluk' },
];

export const RICH_COLOR_PALETTE = [
  { hex: '#6366f1', label: 'İndigo' },
  { hex: '#3b82f6', label: 'Okyanus Mavisi' },
  { hex: '#0ea5e9', label: 'Siber Gök Mavisi' },
  { hex: '#06b6d4', label: 'Turkuaz / Cyan' },
  { hex: '#14b8a6', label: 'Teal Yeşili' },
  { hex: '#10b981', label: 'Zümrüt Yeşili' },
  { hex: '#22c55e', label: 'Matrix / Terminal Yeşili' },
  { hex: '#84cc16', label: 'Limon Yeşili' },
  { hex: '#eab308', label: 'Altın Sarısı' },
  { hex: '#f59e0b', label: 'Kehribar Turuncu' },
  { hex: '#f97316', label: 'Alev Turuncusu' },
  { hex: '#ef4444', label: 'Kızıl Kırmızı (Red Team)' },
  { hex: '#f43f5e', label: 'Mercan / Siber Gül' },
  { hex: '#ec4899', label: 'Neon Pembe' },
  { hex: '#d946ef', label: 'Fuşya / Magenta' },
  { hex: '#a855f7', label: 'Ametist Moru' },
  { hex: '#8b5cf6', label: 'Kraliyet Moru' },
  { hex: '#64748b', label: 'Çelik Grisi' },
];

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export function CategoryIcon({ name, className = 'w-4 h-4', color }: CategoryIconProps) {
  const style = color ? { color } : undefined;
  switch (name) {
    case 'Megaphone':
      return <Megaphone className={className} style={style} />;
    case 'Code2':
      return <Code2 className={className} style={style} />;
    case 'Sparkles':
      return <Sparkles className={className} style={style} />;
    case 'Palette':
      return <Palette className={className} style={style} />;
    case 'Rocket':
      return <Rocket className={className} style={style} />;
    case 'HelpCircle':
      return <HelpCircle className={className} style={style} />;
    case 'Layers':
      return <Layers className={className} style={style} />;
    case 'Shield':
      return <Shield className={className} style={style} />;
    case 'ShieldAlert':
      return <ShieldAlert className={className} style={style} />;
    case 'Lock':
      return <Lock className={className} style={style} />;
    case 'KeyRound':
      return <KeyRound className={className} style={style} />;
    case 'Bug':
      return <Bug className={className} style={style} />;
    case 'Fingerprint':
      return <Fingerprint className={className} style={style} />;
    case 'Terminal':
      return <Terminal className={className} style={style} />;
    case 'Cpu':
      return <Cpu className={className} style={style} />;
    case 'Server':
      return <Server className={className} style={style} />;
    case 'Database':
      return <Database className={className} style={style} />;
    case 'Cloud':
      return <Cloud className={className} style={style} />;
    case 'Wifi':
      return <Wifi className={className} style={style} />;
    case 'Globe':
      return <Globe className={className} style={style} />;
    case 'Smartphone':
      return <Smartphone className={className} style={style} />;
    case 'GraduationCap':
      return <GraduationCap className={className} style={style} />;
    case 'BookOpen':
      return <BookOpen className={className} style={style} />;
    case 'Brain':
      return <Brain className={className} style={style} />;
    case 'Bot':
      return <Bot className={className} style={style} />;
    case 'Gamepad2':
      return <Gamepad2 className={className} style={style} />;
    case 'LineChart':
      return <LineChart className={className} style={style} />;
    case 'Wrench':
      return <Wrench className={className} style={style} />;
    case 'Zap':
      return <Zap className={className} style={style} />;
    case 'Video':
      return <Video className={className} style={style} />;
    case 'Award':
      return <Award className={className} style={style} />;
    default:
      return <MessageSquare className={className} style={style} />;
  }
}

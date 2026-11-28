export type VideoProvider =
  | 'youtube'
  | 'vimeo'
  | 'loom'
  | 'dailymotion'
  | 'mp4';

export interface ParsedVideoInfo {
  provider: VideoProvider;
  providerLabel: string;
  originalUrl: string;
  embedUrl: string;
  thumbnailUrl?: string;
  isDirectVideo: boolean;
  sourceName: string;
  sourceDomain: string;
  licenseNote: string;
}

export interface SuggestedTopicVideo {
  id: string;
  title: string;
  channel: string;
  duration: string;
  url: string;
  categories: string[];
  keywords: string[];
}

const SAFE_DATA_VIDEO_REGEX =
  /^data:video\/(?:mp4|webm);base64,[a-zA-Z0-9+/=\s]+$/i;

const MAX_DATA_VIDEO_LENGTH = 3_600_000; // ~2.6 MB ham video sınırı (Vercel 4.5MB gövde limiti ile uyumlu)

function parseStartSeconds(raw: string | null): number {
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return Number(raw);
  let total = 0;
  const h = /(\d+)h/i.exec(raw);
  const m = /(\d+)m/i.exec(raw);
  const s = /(\d+)s/i.exec(raw);
  if (h) total += Number(h[1]) * 3600;
  if (m) total += Number(m[1]) * 60;
  if (s) total += Number(s[1]);
  return total;
}

export function attachSourceToVideoUrl(
  rawUrl: string,
  sourceName?: string
): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed || trimmed === 'none' || trimmed.startsWith('data:video/')) {
    return trimmed;
  }
  const cleanSource = (sourceName || '').trim().slice(0, 80);
  try {
    const u = new URL(trimmed);
    if (cleanSource) {
      u.hash = `kaynak=${encodeURIComponent(cleanSource)}`;
    } else if (u.hash.startsWith('#kaynak=')) {
      u.hash = '';
    }
    return u.toString();
  } catch {
    return trimmed;
  }
}

function findSuggestedVideoMatch(videoIdOrUrl: string): SuggestedTopicVideo | undefined {
  const needle = videoIdOrUrl.toLowerCase();
  return TOPIC_SUGGESTED_VIDEOS.find(
    (v) => v.url.toLowerCase().includes(needle) || needle.includes(v.url.toLowerCase())
  );
}

export function parseVideoSource(rawUrl?: string | null): ParsedVideoInfo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === 'none') return null;

  // 1. Güvenli kısa yerel video klibi (data:video/mp4 veya data:video/webm)
  if (trimmed.toLowerCase().startsWith('data:video/')) {
    if (
      trimmed.length <= MAX_DATA_VIDEO_LENGTH &&
      SAFE_DATA_VIDEO_REGEX.test(trimmed)
    ) {
      return {
        provider: 'mp4',
        providerLabel: 'YÜKLENEN KLİP',
        originalUrl: trimmed,
        embedUrl: trimmed,
        isDirectVideo: true,
        sourceName: 'Üye Tarafından Yüklenen Klip',
        sourceDomain: 'Yerel Medya',
        licenseNote:
          'Bu kısa klip paylaşan kullanıcı tarafından yüklenmiştir; telif uygunluğu paylaşan üyeye aittir.',
      };
    }
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }

  let hashSource = '';
  if (parsed.hash && parsed.hash.toLowerCase().startsWith('#kaynak=')) {
    try {
      hashSource = decodeURIComponent(parsed.hash.slice('#kaynak='.length)).trim();
    } catch {
      hashSource = '';
    }
  }

  const cleanExternalUrlObj = new URL(parsed.toString());
  if (cleanExternalUrlObj.hash.toLowerCase().startsWith('#kaynak=')) {
    cleanExternalUrlObj.hash = '';
  }
  const cleanExternalUrl = cleanExternalUrlObj.toString();

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const pathname = parsed.pathname;
  const standardEmbedNotice =
    'Resmi gömülü oynatıcı (Embed) üzerinden sunulmaktadır; içerik sitemizde barındırılmaz ve tüm telif hakları orijinal içerik üreticisine aittir.';

  // 2. YouTube (watch, youtu.be, shorts, embed, live)
  if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com' ||
    host === 'youtu.be'
  ) {
    let videoId = '';
    if (host === 'youtu.be') {
      videoId = pathname.split('/').filter(Boolean)[0] || '';
    } else if (pathname === '/watch') {
      videoId = parsed.searchParams.get('v') || '';
    } else {
      const parts = pathname.split('/').filter(Boolean);
      if (
        parts.length >= 2 &&
        (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live')
      ) {
        videoId = parts[1];
      }
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      const startSec = parseStartSeconds(
        parsed.searchParams.get('t') || parsed.searchParams.get('start')
      );
      const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}${
        startSec > 0 ? `?start=${startSec}` : ''
      }`;
      const matchedCatalog = findSuggestedVideoMatch(videoId);
      return {
        provider: 'youtube',
        providerLabel: 'YOUTUBE',
        originalUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        isDirectVideo: false,
        sourceName:
          hashSource ||
          matchedCatalog?.channel ||
          'YouTube Resmi Yayıncısı',
        sourceDomain: 'youtube.com',
        licenseNote: standardEmbedNotice,
      };
    }
    return null;
  }

  // 3. Vimeo
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const parts = pathname.split('/').filter(Boolean);
    const numericId = [...parts].reverse().find((seg) => /^\d{6,12}$/.test(seg));
    if (numericId) {
      return {
        provider: 'vimeo',
        providerLabel: 'VIMEO',
        originalUrl: cleanExternalUrl,
        embedUrl: `https://player.vimeo.com/video/${numericId}`,
        isDirectVideo: false,
        sourceName: hashSource || 'Vimeo İçerik Üreticisi',
        sourceDomain: 'vimeo.com',
        licenseNote: standardEmbedNotice,
      };
    }
    return null;
  }

  // 4. Loom (Ekran kaydı & teknik sunumlar için ideal)
  if (host === 'loom.com') {
    const parts = pathname.split('/').filter(Boolean);
    if (
      parts.length >= 2 &&
      (parts[0] === 'share' || parts[0] === 'embed') &&
      /^[a-zA-Z0-9]{20,40}$/.test(parts[1])
    ) {
      return {
        provider: 'loom',
        providerLabel: 'LOOM EKRAN KAYDI',
        originalUrl: cleanExternalUrl,
        embedUrl: `https://www.loom.com/embed/${parts[1]}`,
        isDirectVideo: false,
        sourceName: hashSource || 'Loom Sunum Kaydı',
        sourceDomain: 'loom.com',
        licenseNote: standardEmbedNotice,
      };
    }
    return null;
  }

  // 5. Dailymotion
  if (host === 'dailymotion.com' || host === 'dai.ly') {
    const parts = pathname.split('/').filter(Boolean);
    let dmId = '';
    if (host === 'dai.ly') {
      dmId = parts[0] || '';
    } else {
      const vidIdx = parts.indexOf('video');
      if (vidIdx !== -1 && parts[vidIdx + 1]) {
        dmId = parts[vidIdx + 1].split('_')[0];
      }
    }
    if (/^[a-zA-Z0-9]{5,15}$/.test(dmId)) {
      return {
        provider: 'dailymotion',
        providerLabel: 'DAILYMOTION',
        originalUrl: cleanExternalUrl,
        embedUrl: `https://www.dailymotion.com/embed/video/${dmId}`,
        isDirectVideo: false,
        sourceName: hashSource || 'Dailymotion Yayıncısı',
        sourceDomain: 'dailymotion.com',
        licenseNote: standardEmbedNotice,
      };
    }
    return null;
  }

  // 6. Doğrudan MP4 / WebM / OGG video dosyası bağlantısı
  if (/\.(?:mp4|webm|ogg|mov)$/i.test(pathname)) {
    return {
      provider: 'mp4',
      providerLabel: 'HARİCİ VİDEO',
      originalUrl: cleanExternalUrl,
      embedUrl: cleanExternalUrl,
      isDirectVideo: true,
      sourceName: hashSource || host,
      sourceDomain: host,
      licenseNote:
        'Harici sunucu bağlantısı üzerinden oynatılmaktadır; tüm telif hakları kaynak yayıncıya aittir.',
    };
  }

  return null;
}

export function isSafeVideoUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || rawUrl === 'none') return true;
  return parseVideoSource(rawUrl) !== null;
}

export function formatVideoMarkdown(
  url: string,
  title?: string,
  sourceName?: string
): string {
  const cleanTitle = (title || 'Konu Videosu')
    .replace(/[\[\]()|]/g, '')
    .trim()
    .slice(0, 90);
  const cleanSource = (sourceName || '')
    .replace(/[\[\]()|]/g, '')
    .trim()
    .slice(0, 60);
  const finalUrl = cleanSource ? attachSourceToVideoUrl(url, cleanSource) : url.trim();
  const label = cleanSource
    ? `🎬 Video: ${cleanTitle || 'Konu Videosu'} | Kaynak: ${cleanSource}`
    : `🎬 Video: ${cleanTitle || 'Konu Videosu'}`;
  return `[${label}](${finalUrl})`;
}

export function extractVideosFromMarkdown(content: string): Array<{
  fullMatch: string;
  title: string;
  url: string;
  index: number;
  info: ParsedVideoInfo;
}> {
  const results: Array<{
    fullMatch: string;
    title: string;
    url: string;
    index: number;
    info: ParsedVideoInfo;
  }> = [];

  if (!content) return results;

  // Markdown bağlantı biçimi: [🎬 Video: ...](url) veya [herhangi başlık](video_url)
  const mdLinkRegex = /(?<!\!)\[([^\]]+)\]\((data:video\/[^)\s]+|https?:\/\/[^)\s]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const label = match[1];
    const url = match[2];
    const info = parseVideoSource(url);
    if (info) {
      results.push({
        fullMatch: match[0],
        title: label.replace(/^🎬\s*Video:\s*/i, '').trim() || 'Video',
        url,
        index: match.index,
        info,
      });
    }
  }

  return results;
}

export function hasEmbeddedVideoInMarkdown(content: string): boolean {
  if (!content) return false;
  if (
    content.includes('🎬 Video:') ||
    content.includes('youtube.com/watch') ||
    content.includes('youtu.be/') ||
    content.includes('youtube.com/shorts/') ||
    content.includes('vimeo.com/') ||
    content.includes('loom.com/share/') ||
    content.includes('data:video/')
  ) {
    if (extractVideosFromMarkdown(content).length > 0) return true;
    const bareUrls = content.match(/https?:\/\/[^\s<>()]+/g) || [];
    return bareUrls.some((u) => parseVideoSource(u) !== null);
  }
  return /\.(?:mp4|webm)(?:\?[^\s)]*)?/i.test(content);
}

/**
 * Konu başlıklarına, forum kategorilerine ve teknoloji gündemi alanlarına göre
 * eşleşen seçkin teknik sunum ve inceleme videoları kataloğu
 */
export const TOPIC_SUGGESTED_VIDEOS: SuggestedTopicVideo[] = [
  {
    id: 'vid_ai_intro_llm',
    title: 'Büyük Dil Modelleri (LLM) ve Sinir Ağları Nasıl Çalışır? — Görsel Rehber',
    channel: '3Blue1Brown',
    duration: '27:14',
    url: 'https://www.youtube.com/watch?v=wjZofJX0v4M',
    categories: [
      'Yapay Zeka',
      'Yapay Zeka & Veri Bilimi',
      'Yapay Zeka & LLM',
      'Eğitim Teknolojileri',
    ],
    keywords: [
      'yapay zeka',
      'llm',
      'gpt',
      'transformer',
      'model',
      'ajan',
      'deepseek',
      'sinir ağı',
      'makine öğrenmesi',
    ],
  },
  {
    id: 'vid_ai_karpathy_llm',
    title: 'Büyük Dil Modellerine Derinlemesine Giriş & Ajan Mimarileri',
    channel: 'Andrej Karpathy',
    duration: '59:47',
    url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g',
    categories: ['Yapay Zeka', 'Yapay Zeka & Veri Bilimi', 'Yapay Zeka & LLM'],
    keywords: [
      'ajan',
      'agent',
      'otonom',
      'rlhf',
      'inference',
      'çıkarım',
      'açık ağırlıklı',
      'python',
    ],
  },
  {
    id: 'vid_web_nextjs_react',
    title: 'React 19 & Modern Next.js App Router Mimarisi Üzerine Teknik İnceleme',
    channel: 'Vercel',
    duration: '18:32',
    url: 'https://www.youtube.com/watch?v=Sklc_fQBmcs',
    categories: [
      'Web & Yazılım',
      'Web & Mobil Geliştirme',
      'Soru & Cevap (Teknik Yardım)',
      'Mobil Uygulama',
    ],
    keywords: [
      'react',
      'nextjs',
      'next.js',
      'typescript',
      'javascript',
      'frontend',
      'web',
      'server actions',
      'cache',
      'tailwind',
    ],
  },
  {
    id: 'vid_web_wasm_rust',
    title: 'WebAssembly (Wasm) ve Modern Tarayıcı Motorlarında Yüksek Performans',
    channel: 'Fireship',
    duration: '04:12',
    url: 'https://www.youtube.com/watch?v=cbB3QEwWMlA',
    categories: ['Web & Yazılım', 'Web & Mobil Geliştirme', 'Mobil & Bulut'],
    keywords: ['wasm', 'webassembly', 'webgpu', 'rust', 'performans', 'tarayıcı', 'edge'],
  },
  {
    id: 'vid_sec_pqc_crypto',
    title: 'Kuantum Bilgisayarlar ve Kuantum-Dirençli Şifreleme (Post-Quantum Cryptography)',
    channel: 'Veritasium',
    duration: '22:45',
    url: 'https://www.youtube.com/watch?v=-UrdExQW0cs',
    categories: [
      'Siber Güvenlik',
      'Siber Güvenlik & Pentest',
      'Kriptografi & Ağ Güvenliği',
    ],
    keywords: [
      'siber',
      'güvenlik',
      'kuantum',
      'şifreleme',
      'kriptografi',
      'passkey',
      'zero-day',
      'pentest',
      'hack',
      'tls',
    ],
  },
  {
    id: 'vid_sec_passkeys',
    title: 'Passkey (FIDO2 / WebAuthn) Şifresiz Kimlik Doğrulama Nasıl Çalışır?',
    channel: 'ByteByteGo',
    duration: '06:28',
    url: 'https://www.youtube.com/watch?v=2xdV6xut7bc',
    categories: [
      'Siber Güvenlik',
      'Siber Güvenlik & Pentest',
      'Web & Mobil Geliştirme',
    ],
    keywords: ['passkey', 'fido2', 'webauthn', 'oturum', 'auth', 'şifre', 'kimlik', 'cookie'],
  },
  {
    id: 'vid_chip_2nm_cpu',
    title: 'Mikroçipler ve Nanometre Transistörler Nasıl Üretilir? — Yarı İletken Mimarisi',
    channel: 'Branch Education',
    duration: '27:56',
    url: 'https://www.youtube.com/watch?v=dX9CGRZwD-w',
    categories: ['Donanım & Çip', 'Donanım & Gömülü Sistem'],
    keywords: [
      'çip',
      'islemci',
      'işlemci',
      '2nm',
      'gaa',
      'gpu',
      'hbm4',
      'donanım',
      'ram',
      'cxl',
      'transistör',
    ],
  },
  {
    id: 'vid_bote_cs50',
    title: 'Harvard CS50 — Bilgisayar Bilimi, Algoritmik Düşünme ve Öğretim Tasarımı',
    channel: 'CS50 / Harvard University',
    duration: '25:10',
    url: 'https://www.youtube.com/watch?v=8mAITcNt710',
    categories: [
      'BÖTE & Akademi',
      'BÖTE & Akademik',
      'Eğitim Teknolojileri',
      'Genel Tartışma & Duyurular',
    ],
    keywords: [
      'böte',
      'bote',
      'akademi',
      'eğitim',
      'öğretim',
      'müfredat',
      'algoritma',
      'üniversite',
      'pedagoji',
      'öğretmen',
    ],
  },
  {
    id: 'vid_edtech_ai_tutor',
    title: 'Eğitimde Yapay Zeka Asistanları ve Kişiselleştirilmiş Öğrenme Deneyimi',
    channel: 'TED / Sal Khan',
    duration: '15:19',
    url: 'https://www.youtube.com/watch?v=hJP5GqnTrNo',
    categories: ['Eğitim Teknolojileri', 'BÖTE & Akademi'],
    keywords: [
      'eğitim teknolojileri',
      'edtech',
      'sokratik',
      'öğrenci',
      'xr',
      'laboratuvar',
      'uzaktan eğitim',
      'lms',
    ],
  },
  {
    id: 'vid_data_postgres',
    title: 'Sistem Tasarımı: Veritabanı İndeksleme, PostgreSQL ve Ağ Mimarileri',
    channel: 'ByteByteGo',
    duration: '08:44',
    url: 'https://www.youtube.com/watch?v=lYh6LrSIDvY',
    categories: [
      'Veri Bilimi & Ağ',
      'Veri Bilimi & SQL',
      'Yapay Zeka & Veri Bilimi',
      'DevOps, Linux & Sunucu',
    ],
    keywords: [
      'postgresql',
      'sql',
      'veritabanı',
      'indeks',
      'hnsw',
      'rag',
      'vektör',
      'wifi',
      'ethernet',
      'ağ',
    ],
  },
  {
    id: 'vid_robotics_atlas',
    title: 'Yeni Nesil Elektrikli İnsansı Robotlar ve Fiziksel Yapay Zeka (VLA)',
    channel: 'Boston Dynamics',
    duration: '01:40',
    url: 'https://www.youtube.com/watch?v=29ECwExc-_M',
    categories: ['Robotik & Otomasyon', 'Yapay Zeka'],
    keywords: ['robot', 'robotik', 'insansı', 'otomasyon', 'vla', 'motor', 'sensör'],
  },
  {
    id: 'vid_game_unreal_rt',
    title: 'Gerçek Zamanlı Işın İzleme (Ray Tracing) ve Modern Oyun Motoru Grafikleri',
    channel: 'Unreal Engine',
    duration: '03:22',
    url: 'https://www.youtube.com/watch?v=7ZLibi6s_ew',
    categories: [
      'Oyun & Simülasyon',
      'Oyun Geliştirme',
      'UI/UX & Ürün Tasarımı',
    ],
    keywords: ['oyun', 'render', 'ışın izleme', 'ray tracing', 'npc', 'unity', 'unreal', '3b', 'tasarım'],
  },
  {
    id: 'vid_cloud_docker_k8s',
    title: 'Bulut Mimarisi, Konteyner Orkestrasyonu ve Modern DevOps Rehberi',
    channel: 'IBM Technology',
    duration: '09:15',
    url: 'https://www.youtube.com/watch?v=P6FORpg0KVo',
    categories: [
      'Mobil & Bulut',
      'DevOps, Linux & Sunucu',
      'Kariyer & Proje Vitrin',
    ],
    keywords: ['bulut', 'cloud', 'kubernetes', 'docker', 'devops', 'linux', 'sunucu', 'kariyer', 'uydu'],
  },
  {
    id: 'vid_space_fusion',
    title: 'Temiz Enerji, Katı Hal Bataryalar ve Uzay Teknolojilerinde Yeni Eşikler',
    channel: 'Cleo Abram',
    duration: '16:08',
    url: 'https://www.youtube.com/watch?v=mZsaaturR6E',
    categories: ['Uzay & Bilim'],
    keywords: ['füzyon', 'batarya', 'enerji', 'uzay', 'uydu', 'bilim', 'süperiletken'],
  },
];

/**
 * Seçilen kategoriye, özel alana ve yazılan konu/haber başlığına göre en uygun videoları sıralar
 */
export function getSuggestedVideosForContext(params: {
  categoryName?: string;
  customTopic?: string;
  title?: string;
  limit?: number;
}): SuggestedTopicVideo[] {
  const { categoryName = '', customTopic = '', title = '', limit = 4 } = params;
  const normalizedCat = categoryName.trim().toLowerCase();
  const normalizedTopic = customTopic.trim().toLowerCase();
  const normalizedTitle = title.trim().toLowerCase();

  const scored = TOPIC_SUGGESTED_VIDEOS.map((vid) => {
    let score = 0;

    for (const c of vid.categories) {
      const lc = c.toLowerCase();
      if (normalizedCat && (lc === normalizedCat || lc.includes(normalizedCat) || normalizedCat.includes(lc))) {
        score += 10;
      }
      if (normalizedTopic && (lc.includes(normalizedTopic) || normalizedTopic.includes(lc))) {
        score += 8;
      }
    }

    for (const kw of vid.keywords) {
      if (normalizedTitle && normalizedTitle.includes(kw)) {
        score += 6;
      }
      if (normalizedTopic && normalizedTopic.includes(kw)) {
        score += 5;
      }
      if (normalizedCat && normalizedCat.includes(kw)) {
        score += 3;
      }
    }

    return { vid, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.vid);
}

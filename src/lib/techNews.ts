import { cache } from 'react';
import { prisma } from './prisma';
import { slugify } from './utils';

export interface TechNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  badgeColor: string;
  source: string;
  readTime: string;
  isFeatured: number;
  views: number;
  createdAt: string;
  imageUrl?: string;
  videoUrl?: string;
  commentCount?: number;
}

export interface TechNewsCommentItem {
  id: string;
  newsId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarColor: string;
    role: string;
    reputation: number;
  };
}

export const TECH_NEWS_CATEGORIES = [
  { name: 'Yapay Zeka', color: '#10b981', icon: 'Sparkles' },
  { name: 'Siber Güvenlik', color: '#f43f5e', icon: 'Shield' },
  { name: 'Web & Yazılım', color: '#3b82f6', icon: 'Code2' },
  { name: 'Donanım & Çip', color: '#f59e0b', icon: 'Cpu' },
  { name: 'Mobil & Bulut', color: '#ec4899', icon: 'Cloud' },
  { name: 'Veri Bilimi & Ağ', color: '#06b6d4', icon: 'Database' },
  { name: 'Oyun & Simülasyon', color: '#a855f7', icon: 'Gamepad2' },
  { name: 'Eğitim Teknolojileri', color: '#6366f1', icon: 'BookOpen' },
  { name: 'BÖTE & Akademi', color: '#0ea5e9', icon: 'GraduationCap' },
  { name: 'Robotik & Otomasyon', color: '#14b8a6', icon: 'Bot' },
  { name: 'Uzay & Bilim', color: '#8b5cf6', icon: 'Rocket' },
];

export const DEFAULT_NEWS_IMAGES_BY_CATEGORY: Record<string, string> = {
  'Yapay Zeka':
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
  'Siber Güvenlik':
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  'Donanım & Çip':
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  'Web & Yazılım':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  'Uzay & Bilim':
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
  'Mobil & Bulut':
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  'Veri Bilimi & Ağ':
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  'Oyun & Simülasyon':
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
  'Eğitim Teknolojileri':
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  'Eğitim Teknolojileri (BÖTE)':
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  'BÖTE & Akademi':
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  'Robotik & Otomasyon':
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
};

export const DEFAULT_NEWS_IMAGES_BY_SLUG: Record<string, string> = {
  'otonom-yazilim-ajanlari-ve-coklu-model-mimarilerinde-yeni-donem':
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
  'kuantum-direncli-sifreleme-post-quantum-cryptography-tarayicilarda-varsayilan-oldu':
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
  '2nm-gaa-islemciler-ve-fotonik-ara-baglanti-teknolojisi-seri-uretimde':
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  'webassembly-3-0-ve-webgpu-ile-tarayicida-masaustu-kalitesinde-yerel-uygulamalar':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  'kati-hal-solid-state-bataryalarda-10-dakikada-yuzde-80-sarj-ve-1200-km-menzil':
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80',
  'dusuk-dunya-yorungesi-leo-uydu-agi-ile-akilli-telefonlarda-dogrudan-uydu-genisbant':
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
  'yapay-zeka-destekli-sifir-gun-zero-day-zafiyet-avciligi-ve-otonom-soc-savunmasi':
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  'egitim-teknolojilerinde-bote-kisisellestirilmis-yapay-zeka-ogretmenler-ve-xr-laboratuvarlar':
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  'genel-amacli-insansi-robotlarda-gorsel-dil-eylem-vla-modelleri-ve-sifir-atis-ogrenme':
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
  'postgresql-uzerinde-hnsw-vektor-indeksleme-ve-hibrit-rag-mimarilerinde-milisaniye-alti-arama':
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  'gercek-zamanli-sinirsel-isin-izleme-neural-path-tracing-ve-oyunlarda-uretken-npcler':
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
  'rust-tabanli-ultra-hizli-web-arac-zincirleri-ve-sunucusuz-edge-veritabanlari':
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
  'acik-agirlikli-akil-yuruten-modeller-ve-yerel-cikarim-sunucularinda-yeni-standart':
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
  'bote-ve-akademik-arastirmalarda-yapay-zeka-okuryazarligi-ve-acik-bilim-standartlari':
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  'react-19-ve-nextjs-use-cache-mimarisiyle-hibrit-web-uygulamalarinda-sifir-gecikme':
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
  'passkey-zorunlulugu-ve-cihaza-bagli-oturum-kimlikleriyle-sifresiz-guvenlik-donemi':
    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1200&q=80',
  'hbm4-bellekler-ve-cxl-3-1-havuzlama-mimarisi-yapay-zeka-sunucularinda-bellek-duvarini-yikiyor':
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1200&q=80',
  'wifi-7-coklu-baglanti-mlo-ve-veri-merkezlerinde-800g-ultra-ethernet-donemi':
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  'bulut-yerel-mimaride-webassembly-mikro-konteynerler-ve-otonom-finops-optimizasyonu':
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  'nukleer-fuzyon-reaktorlerinde-yuksek-sicaklik-superiletken-miknatislar-ve-veri-merkezi-enerjisi':
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
};

export const TECH_NEWS_PRESET_COVERS = [
  {
    label: 'Yapay Zeka & Sinir Ağı',
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Siber Güvenlik & Kripto',
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Siber Savunma & SOC',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'İşlemci & Mikroçip',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Kodlama & Yazılım',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Sunucu & Veri Merkezi',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Robotik & Otonom',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Eğitim & Laboratuvar',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Batarya & Enerji',
    url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Uzay & Uydu Ağı',
    url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
  },
];

export const DEFAULT_NEWS_VIDEOS_BY_SLUG: Record<string, string> = {
  'acik-agirlikli-akil-yuruten-modeller-ve-yerel-cikarim-sunucularinda-yeni-standart':
    'https://www.youtube.com/watch?v=zjkBMFhNj_g',
  'bote-ve-akademik-arastirmalarda-yapay-zeka-okuryazarligi-ve-acik-bilim-standartlari':
    'https://www.youtube.com/watch?v=8mAITcNt710',
  'react-19-ve-nextjs-use-cache-mimarisiyle-hibrit-web-uygulamalarinda-sifir-gecikme':
    'https://www.youtube.com/watch?v=Sklc_fQBmcs',
  'passkey-zorunlulugu-ve-cihaza-bagli-oturum-kimlikleriyle-sifresiz-guvenlik-donemi':
    'https://www.youtube.com/watch?v=2xdV6xut7bc',
  'kuantum-direncli-sifreleme-post-quantum-cryptography-tarayicilarda-varsayilan-oldu':
    'https://www.youtube.com/watch?v=-UrdExQW0cs',
  '2nm-gaa-islemciler-ve-fotonik-ara-baglanti-teknolojisi-seri-uretimde':
    'https://www.youtube.com/watch?v=dX9CGRZwD-w',
  'egitim-teknolojilerinde-bote-kisisellestirilmis-yapay-zeka-ogretmenler-ve-xr-laboratuvarlar':
    'https://www.youtube.com/watch?v=hJP5GqnTrNo',
  'genel-amacli-insansi-robotlarda-gorsel-dil-eylem-vla-modelleri-ve-sifir-atis-ogrenme':
    'https://www.youtube.com/watch?v=29ECwExc-_M',
};

export function resolveNewsVideoUrl(item: {
  videoUrl?: string;
  slug?: string;
}): string {
  if (item.videoUrl && item.videoUrl.trim() === 'none') {
    return '';
  }
  if (item.videoUrl && item.videoUrl.trim()) {
    return item.videoUrl.trim();
  }
  if (item.slug && DEFAULT_NEWS_VIDEOS_BY_SLUG[item.slug]) {
    return DEFAULT_NEWS_VIDEOS_BY_SLUG[item.slug];
  }
  return '';
}

export function resolveNewsImageUrl(item: {
  imageUrl?: string;
  slug?: string;
  category?: string;
}): string {
  if (item.imageUrl && item.imageUrl.trim() === 'none') {
    return '';
  }
  if (item.imageUrl && item.imageUrl.trim()) {
    return item.imageUrl.trim();
  }
  if (item.slug && DEFAULT_NEWS_IMAGES_BY_SLUG[item.slug]) {
    return DEFAULT_NEWS_IMAGES_BY_SLUG[item.slug];
  }
  return (
    (item.category && DEFAULT_NEWS_IMAGES_BY_CATEGORY[item.category]) ||
    DEFAULT_NEWS_IMAGES_BY_CATEGORY['Yapay Zeka']
  );
}

const INITIAL_NEWS: Omit<TechNewsItem, 'id'>[] = [
  {
    title: 'Otonom Yazılım Ajanları ve Çoklu-Model Mimarilerinde Yeni Dönem',
    slug: 'otonom-yazilim-ajanlari-ve-coklu-model-mimarilerinde-yeni-donem',
    summary:
      'Yeni nesil akıl yürüten (reasoning) modeller artık tek başına kod yazmakla kalmıyor; uçtan uca test, güvenlik taraması ve mimari yeniden yapılandırma (refactoring) süreçlerini otonom yürütüyor.',
    content: `### Yazılım Geliştirmede Ajan (Agentic) Devrimi

2026 itibarıyla büyük dil modelleri (LLM), yalnızca metin veya kod tamamlayan yardımcılar olmaktan çıkıp **uzun süreli görevleri planlayabilen otonom mühendislik ajanlarına** dönüştü.

#### Öne Çıkan Teknolojik Gelişmeler
1. **Çok Adımlı Doğrulama Döngüleri:** Ajanlar yazdıkları kodu doğrudan izole kum havuzlarında (sandbox) çalıştırıp derleme ve tip hatalarını kullanıcıya yansıtmadan kendi kendine onarabiliyor.
2. **Yerel (On-Device) NPU Hızlandırma:** Dizüstü bilgisayarlarda bulunan 60+ TOPS gücündeki NPU birimleri sayesinde 8B–14B parametreli kodlama modelleri internet bağlantısı olmadan sıfır gecikmeyle çalışabiliyor.
3. **MCP (Model Context Protocol) Standartlaşması:** Veri tabanları, Git depoları, CI/CD hatları ve bulut sağlayıcıları tek bir açık protokol üzerinden yapay zeka ajanlarına güvenli bağlam sunuyor.

\`\`\`typescript
// Örnek: Ajan tabanlı görev doğrulama akışı
async function runAgentPipeline(task: string) {
  const plan = await planner.createSteps(task);
  const patch = await coder.implement(plan);
  const testResult = await sandbox.verify(patch);
  return testResult.passed ? patch : coder.selfHeal(testResult.logs);
}
\`\`\`

Geliştiriciler için artık en kritik yetkinlik satır satır sözdizimi ezberlemek değil; **sistem mimarisi kurgulamak, güvenlik sınırlarını belirlemek ve ajan sürülerini (swarms) doğru yönlendirmektir.**`,
    category: 'Yapay Zeka',
    badgeColor: '#10b981',
    source: 'AI Mühendislik Raporu',
    readTime: '4 dk okuma',
    isFeatured: 1,
    views: 412,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    title: ' Kuantum-Dirençli Şifreleme (Post-Quantum Cryptography) Tarayıcılarda Varsayılan Oldu',
    slug: 'kuantum-direncli-sifreleme-post-quantum-cryptography-tarayicilarda-varsayilan-oldu',
    summary:
      'NIST onaylı ML-KEM (Kyber) hibrit anahtar değişim algoritmaları, modern web tarayıcıları ve TLS 1.3 sunucularında standart hale gelerek "şimdi topla, sonra çöz" saldırılarına karşı koruma sağlıyor.',
    content: `### Siber Güvenlikte Kuantum Sonrası Hazırlık

Kuantum bilgisayarların RSA ve klasik eliptik eğri (ECC) şifrelemesini kırabilecek kapasiteye yaklaşmasıyla birlikte, küresel internet altyapısında **Post-Quantum Cryptography (PQC)** geçişi hızlandı.

#### Neler Değişti?
- **ML-KEM (Module-Lattice-Based Key-Encapsulation):** TLS 1.3 el sıkışmalarında klasik X25519 ile birleştirilmiş hibrit kuantum-dirençli anahtar değişimi artık Chrome, Firefox, Edge ve büyük CDN sağlayıcılarında varsayılan olarak aktif.
- **"Şimdi Kaydet, İleride Çöz" Tehdidi Önleniyor:** Saldırganların bugün şifreli ağ trafiğini kaydedip yıllar sonra kuantum bilgisayarlarla çözme senaryosu bu yeni kafes (lattice) tabanlı algoritmalarla boşa çıkarılıyor.
- **Sertifika Boyutları ve Performans:** Yeni sıkıştırma teknikleri sayesinde kuantum-dirençli el sıkışmalar yalnızca 1-2 milisaniye ek gecikme ile tamamlanabiliyor.`,
    category: 'Siber Güvenlik',
    badgeColor: '#f43f5e',
    source: 'SecOps Gündemi',
    readTime: '3 dk okuma',
    isFeatured: 1,
    views: 289,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    title: '2nm GAA (Gate-All-Around) İşlemciler ve Fotonik Ara Bağlantı Teknolojisi Seri Üretimde',
    slug: '2nm-gaa-islemciler-ve-fotonik-ara-baglanti-teknolojisi-seri-uretimde',
    summary:
      'Silikon sınırlarını zorlayan 2 nanometre GAA transistör mimarisi ve çipler arası bakır yerine ışık kullanan silikon fotonik teknolojisi, veri merkezlerinde enerji tüketimini %40 düşürüyor.',
    content: `### Yarı İletken Dünyasında 2nm ve Silikon Fotonik Çağı

FinFET transistörlerin fiziksel sızıntı sınırlarına ulaşmasının ardından yarı iletken üreticileri **GAA (Gate-All-Around / Nanosheet)** mimarisiyle 2nm seri üretimine tam kapasiteyle geçti.

#### Teknik Kazanımlar
1. **%40 Daha Düşük Güç Tüketimi:** Kanalın dört bir yanını saran kapı yapısı sayesinde elektron kaçağı minimuma indirildi.
2. **Arka Yüz Güç Dağıtımı (Backside Power Delivery):** Güç hatları çipin arka yüzeyine taşınarak sinyal hatlarıyla olan parazit ortadan kaldırıldı.
3. **Optik Çip İletişimi:** Yapay zeka kümelerinde GPU'lar arası veri aktarımı bakır kablolar yerine optik dalga kılavuzlarıyla yapılarak bant genişliği terabit seviyesine çıkarıldı.`,
    category: 'Donanım & Çip',
    badgeColor: '#f59e0b',
    source: 'Hardware Radar',
    readTime: '3 dk okuma',
    isFeatured: 0,
    views: 234,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
  },
  {
    title: 'WebAssembly 3.0 ve WebGPU ile Tarayıcıda Masaüstü Kalitesinde Yerel Uygulamalar',
    slug: 'webassembly-3-0-ve-webgpu-ile-tarayicida-masaustu-kalitesinde-yerel-uygulamalar',
    summary:
      'Wasm Bileşen Modeli (Component Model) ve WebGPU hesaplama gölgelendiricileri (compute shaders), 3B tasarım araçlarının ve yerel yapay zeka modellerinin doğrudan tarayıcı sekmesinde çalışmasını sağlıyor.',
    content: `### Tarayıcılar Artık Tam Teşekküllü Birer İşletim Sistemi Katmanı

**WebAssembly (Wasm)** ekosistemindeki yeni Component Model standardı; Rust, Go, C++ ve TypeScript modüllerinin birbirleriyle sıfır kopyalama (zero-copy) maliyetiyle konuşmasına olanak tanıyor.

#### Geliştiriciler İçin Ne Anlama Geliyor?
- **WebGPU Compute Shaders:** Tarayıcı içinden doğrudan ekran kartının paralel işlem çekirdeklerine erişilerek video kurgu, 3B render ve yerel LLM çıkarımı (inference) yerel uygulama hızında yapılabiliyor.
- **Edge Sunucularda Mikrosaniye Soğuk Başlangıç (Cold Start):** Docker konteynerleri yerine Wasm modülleri kullanan uç (edge) fonksiyonlar 1 milisaniyenin altında ayağa kalkıyor.`,
    category: 'Web & Yazılım',
    badgeColor: '#3b82f6',
    source: 'Web Platform Weekly',
    readTime: '4 dk okuma',
    isFeatured: 0,
    views: 318,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    title: 'Katı Hal (Solid-State) Bataryalarda 10 Dakikada %80 Şarj ve 1.200 Km Menzil Eşiği Aşıldı',
    slug: 'kati-hal-solid-state-bataryalarda-10-dakikada-yuzde-80-sarj-ve-1200-km-menzil',
    summary:
      'Sıvı elektrolit yerine sülfür ve oksit tabanlı katı elektrolit kullanan yeni nesil batarya hücreleri, hem yangın riskini ortadan kaldırıyor hem de enerji yoğunluğunu iki katına çıkarıyor.',
    content: `### Enerji Depolama ve Mobilitede Katı Hal Devrimi

Geleneksel lityum-iyon pillerdeki yanıcı sıvı elektrolitlerin yerini alan **katı hal (solid-state)** batarya teknolojisi, laboratuvar aşamasından çıkıp ilk ticari üretim hatlarına ulaştı.

- **500 Wh/kg Enerji Yoğunluğu:** Aynı ağırlıkta iki kat daha fazla menzil sunuluyor.
- **Termal Güvenlik:** Dendrit oluşumu ve aşırı ısınma kaynaklı batarya yangını riski neredeyse sıfıra indirildi.
- **Uzun Ömür:** 3.000'den fazla tam şarj döngüsünden sonra bile %90 kapasite korunumu sağlanıyor.`,
    category: 'Uzay & Bilim',
    badgeColor: '#8b5cf6',
    source: 'Future Science',
    readTime: '3 dk okuma',
    isFeatured: 0,
    views: 196,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 32).toISOString(),
  },
  {
    title: 'Düşük Dünya Yörüngesi (LEO) Uydu Ağı ile Akıllı Telefonlarda Doğrudan Uydu Genişbant Dönemi',
    slug: 'dusuk-dunya-yorungesi-leo-uydu-agi-ile-akilli-telefonlarda-dogrudan-uydu-genisbant',
    summary:
      'Özel anten gerektirmeden standart LTE/5G frekanslarını kullanan yeni nesil Direct-to-Cell uyduları, okyanus ortasında ve dağ zirvelerinde bile kesintisiz veri bağlantısı sunuyor.',
    content: `### Kapsama Alanı Dışı Kavramı Tarihe Karışıyor

Uzay tabanlı baz istasyonu olarak çalışan yeni nesil **Direct-to-Cell (D2C)** uyduları, mevcut akıllı telefonlarda hiçbir donanım değişikliği gerektirmeden doğrudan bağlantı kurabiliyor.

- **Acil Durum SMS'inden Ses ve Veriye:** İlk etapta yalnızca acil durum mesajlaşması sunan sistemler artık sesli görüşme ve temel internet paketlerini destekliyor.
- **IoT ve Küresel Lojistik:** Deniz taşımacılığı, tarım sensörleri ve otonom araçlar dünyanın her noktasında kesintisiz telemetri gönderebiliyor.`,
    category: 'Mobil & Bulut',
    badgeColor: '#ec4899',
    source: 'Telekom & Uzay',
    readTime: '3 dk okuma',
    isFeatured: 0,
    views: 175,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString(),
  },
  {
    title: 'Yapay Zeka Destekli Sıfır-Gün (Zero-Day) Zafiyet Avcılığı ve Otonom SOC Savunma Sistemleri',
    slug: 'yapay-zeka-destekli-sifir-gun-zero-day-zafiyet-avciligi-ve-otonom-soc-savunmasi',
    summary:
      'Semantik kod analizi yapan güvenlik ajanları ve eBPF çekirdek telemetrisi, bellek taşması ile yetki yükseltme zafiyetlerini saldırganlardan önce tespit edip saniyeler içinde otomatik yama üretiyor.',
    content: `### Siber Güvenlikte Otonom Savunma (SecOps 2.0) Dönemi

Geleneksel imza tabanlı güvenlik duvarları ve statik kod tarayıcıları (SAST), karmaşık mantıksal güvenlik açıklarını yakalamakta yetersiz kalırken; **akıl yürüten güvenlik ajanları (AI Red & Blue Teams)** siber savunmada yeni bir standart oluşturdu.

#### Öne Çıkan Siber Güvenlik Teknolojileri
1. **Semantik Fuzzing ve Mantıksal Zafiyet Tespiti:** Büyük dil modelleri kaynak kodun veri akış grafiğini (AST & CFG) inceleyerek yetkilendirme atlatma (IDOR), yarış durumu (Race Condition) ve bellek bozulması hatalarını otomatik simüle ediyor.
2. **eBPF Tabanlı Çekirdek (Kernel) Gözlemlenebilirliği:** Linux çekirdeği seviyesinde sıfır ek yükle çalışan eBPF sensörleri, konteyner kaçış girişimlerini ve beklenmeyen sistem çağrılarını (` + '`syscall`' + `) milisaniyede izole ediyor.
3. **Otomatik Yama (Auto-Remediation) Boru Hatları:** Tespit edilen bir zafiyet için anında birim testiyle doğrulanmış Pull Request üretiliyor.

\`\`\`typescript
// Örnek: Otonom güvenlik taraması ve otomatik yama doğrulama akışı
async function auditAndPatchEndpoint(routeAst: ASTNode) {
  const vulnReport = await securityAgent.detectLogicFlaws(routeAst);
  if (!vulnReport.hasCriticalRisk) return { status: 'SAFE' };

  const candidatePatch = await securityAgent.generateMinimalPatch(vulnReport);
  const exploitBlocked = await sandbox.replayExploit(candidatePatch, vulnReport.poc);
  return { status: exploitBlocked ? 'PATCH_VERIFIED' : 'MANUAL_REVIEW', candidatePatch };
}
\`\`\`

Kurumlar için artık en güçlü savunma stratejisi, **Sıfır Güven (Zero Trust)** mimarisini sürekli çalışan otonom sızma testi ajanlarıyla birleştirmektir.`,
    category: 'Siber Güvenlik',
    badgeColor: '#ef4444',
    source: 'CyberSec & RedTeam Radar',
    readTime: '5 dk okuma',
    isFeatured: 1,
    views: 524,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
  },
  {
    title: 'Eğitim Teknolojilerinde Kişiselleştirilmiş Yapay Zeka Öğretmenler ve XR Sanal Laboratuvarlar',
    slug: 'egitim-teknolojilerinde-bote-kisisellestirilmis-yapay-zeka-ogretmenler-ve-xr-laboratuvarlar',
    summary:
      'Her öğrencinin bilişsel öğrenme hızına göre gerçek zamanlı uyarlanan Sokratik yapay zeka asistanları ve WebXR tabanlı 3B sanal laboratuvarlar, eğitimde fırsat eşitliğini ve kalıcılığı üst seviyeye taşıyor.',
    content: `### Öğretim Tasarımında Birebir Uyarlanabilir Öğrenme Çağı

Eğitim bilimlerinde Benjamin Bloom'un ünlü **"2 Sigma Problemi"** (birebir özel ders alan öğrencilerin standart sınıf ortamına göre %98 daha başarılı olması), yeni nesil **pedagojik yapay zeka ajanları ve uzamsal bilişim (WebXR)** araçlarıyla ilk kez kitlesel ölçekte çözüme kavuşuyor.

#### Eğitim Teknolojilerinde 3 Büyük Dönüşüm
- **Sokratik Kodlama ve Bilim Rehberleri:** Öğrenciye doğrudan hazır cevabı vermek yerine, hatanın nedenini bulduran ipuçları ve kademeli sorular (Scaffolding) yönelten pedagojik dil modelleri.
- **Tarayıcı İçi WebXR Laboratuvarları:** Pahalı donanım gerektirmeden standart web tarayıcısı üzerinden ağ topolojisi kurma, mikrodenetleyici simülasyonu ve siber güvenlik CTF laboratuvarlarını 3 boyutlu deneyimleme imkanı.
- **Öğrenme Analitiği ve Bilişsel Yük Takibi:** Öğrencinin zorlandığı kavramları erken tespit ederek materyali görsel, işitsel veya etkileşimli kod bloklarıyla dinamik olarak yeniden yapılandıran akıllı öğretim yönetim sistemleri (LMS).`,
    category: 'Eğitim Teknolojileri',
    badgeColor: '#6366f1',
    source: 'EdTech & Öğretim Tasarımı',
    readTime: '4 dk okuma',
    isFeatured: 1,
    views: 468,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    title: 'Genel Amaçlı İnsansı Robotlarda Görsel-Dil-Eylem (VLA) Modelleri ve Sıfır-Atış Beceri Öğrenimi',
    slug: 'genel-amacli-insansi-robotlarda-gorsel-dil-eylem-vla-modelleri-ve-sifir-atis-ogrenme',
    summary:
      'Kamera görüntüsünü ve doğal dil komutlarını doğrudan motor eklem torklarına dönüştüren uçtan uca VLA (Vision-Language-Action) modelleri, robotların daha önce görmedikleri nesneleri hassasiyetle kullanmasını sağlıyor.',
    content: `### Fiziksel Yapay Zeka (Embodied AI) Sahaya İniyor

Yıllarca yalnızca önceden programlanmış sabit koordinatlarda çalışabilen endüstriyel robotların yerini, çevresini görsel-işitsel olarak algılayıp doğal dildeki komutları yerine getiren **VLA (Vision-Language-Action)** tabanlı insansı robotlar alıyor.

#### Öne Çıkan Mühendislik Atılımları
1. **Sim-to-Real Pekiştirmeli Öğrenme:** Fizik motorlarında gerçek zamanın 10.000 katı hızında simüle edilen milyonlarca saatlik deneme-yanılma eğitimi, sıfır kayıpla gerçek robot donanımına aktarılıyor.
2. **Dokunsal (Tactile) Parmak Ucu Sensörleri:** Milimetrik basınç ve kayma algılayan yapay deri sensörleri sayesinde robotlar yumurta kırmadan tutmaktan hassas devre lehimlemeye kadar ince motor becerileri sergiliyor.`,
    category: 'Robotik & Otomasyon',
    badgeColor: '#14b8a6',
    source: 'Robotics & AI Lab',
    readTime: '4 dk okuma',
    isFeatured: 0,
    views: 342,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 11).toISOString(),
  },
  {
    title: 'PostgreSQL Üzerinde HNSW Vektör İndeksleme ve Hibrit RAG Mimarilerinde Milisaniye Altı Arama',
    slug: 'postgresql-uzerinde-hnsw-vektor-indeksleme-ve-hibrit-rag-mimarilerinde-milisaniye-alti-arama',
    summary:
      'Ayrı bir vektör veritabanı kurma maliyetini ortadan kaldıran pgvector HNSW indeksleri ve tam metin (BM25) aramasını birleştiren RRF (Reciprocal Rank Fusion) sorguları kurumsal yapay zeka uygulamalarında standart haline geldi.',
    content: `### Veritabanı Mimarilerinde Tekil Platform (Unified Data Layer) Yaklaşımı

Kurumsal RAG (Retrieval-Augmented Generation) sistemlerinde ilişkisel verilerle vektör gömmelerini (embeddings) ayrı veritabanlarında tutmak senkronizasyon ve güvenlik sorunlarına yol açıyordu. **PostgreSQL ve pgvector** üzerindeki yeni nesil HNSW (Hierarchical Navigable Small World) optimizasyonları bu sorunu kökünden çözdü.

\`\`\`sql
-- Örnek: PostgreSQL üzerinde Semantik Vektör + Tam Metin Hibrit Arama
SELECT id, title,
       1 - (embedding <=> $1::vector) AS semantic_score
FROM knowledge_articles
WHERE is_published = true
ORDER BY embedding <=> $1::vector
LIMIT 5;
\`\`\`

- **Niceleme (Scalar & Binary Quantization):** Vektör bellek kullanımını %75 azaltırken doğruluk oranını %99 seviyesinde koruyor.
- **Satır Düzeyinde Güvenlik (RLS):** Kullanıcı yalnızca kendi yetkisi dahilindeki belgelerin vektör sonuçlarını görebiliyor.`,
    category: 'Veri Bilimi & Ağ',
    badgeColor: '#06b6d4',
    source: 'Data Systems Digest',
    readTime: '4 dk okuma',
    isFeatured: 0,
    views: 389,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    title: 'Gerçek Zamanlı Sinirsel Işın İzleme (Neural Path Tracing) ve Oyun Motorlarında Üretken NPC’ler',
    slug: 'gercek-zamanli-sinirsel-isin-izleme-neural-path-tracing-ve-oyunlarda-uretken-npcler',
    summary:
      'Sinirsel ışıma önbellekleri (Neural Radiance Cache) ile saniyede 240 kare tam ışın izleme mümkün hale gelirken, ekran kartı NPU biriminde çalışan mikro dil modelleri oyun karakterlerine dinamik hafıza kazandırıyor.',
    content: `### Oyun Geliştirme ve Gerçek Zamanlı Simülasyonda Sinirsel Grafik Çağı

Klasik rasterizasyon tekniklerinin yerini tamamen **Sinirsel İşleme (Neural Rendering)** boru hatlarına bıraktığı yeni nesil oyun motorları, fotogerçekçi sinema kalitesini gerçek zamanlı kare hızlarına taşıdı.

- **Sinirsel Işıma Önbelleği (NRC):** Sahnedeki çoklu ışık yansımalarını birkaç ışın örneğiyle tahmin ederek gürültü giderme (denoising) gecikmesini sıfıra indiriyor.
- **Dinamik Hafızalı NPC Mimarisi:** Oyuncunun geçmiş kararlarını hatırlayan ve senaryo sınırları içinde doğaçlama diyalog ile strateji üreten yerel SLM (Small Language Model) ajanları.`,
    category: 'Oyun & Simülasyon',
    badgeColor: '#a855f7',
    source: 'GameDev & Graphics Foundry',
    readTime: '3 dk okuma',
    isFeatured: 0,
    views: 295,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
  },
  {
    title: 'Rust Tabanlı Ultra Hızlı Web Araç Zincirleri ve Sunucusuz (Serverless) Edge Veritabanları',
    slug: 'rust-tabanli-ultra-hizli-web-arac-zincirleri-ve-sunucusuz-edge-veritabanlari',
    summary:
      'Çok çekirdekli Rust derleyicileri büyük ölçekli TypeScript projelerinde derleme sürelerini saniyenin altına indirirken, küresel uç noktalara (Edge) çoğaltılan dağıtık veritabanları ilk bayt süresini (TTFB) 10ms altına çekiyor.',
    content: `### Modern Web Mühendisliğinde Sıfır Gecikme Hedefi

Önyüz ve tam yığın (Full-Stack) web geliştirmede JavaScript tabanlı derleme araçlarının yerini tamamen **Rust ile yazılmış paralel araç zincirleri** aldı.

- **Milisaniye Mertebesinde HMR ve Build:** Yüz binlerce modülden oluşan kurumsal monorepo projeleri bile sıfır yapılandırmayla saniyeler içinde paketleniyor.
- **Küresel Okuma Replikaları:** Kullanıcıya coğrafi olarak en yakın uç veri merkezinden yanıt veren sunucusuz SQL veritabanları sayesinde dünyanın her yerinde anlık sayfa geçişleri sağlanıyor.`,
    category: 'Web & Yazılım',
    badgeColor: '#3b82f6',
    source: 'Modern Stack Radar',
    readTime: '3 dk okuma',
    isFeatured: 0,
    views: 310,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    title: 'Açık Ağırlıklı Akıl Yürüten Modeller ve Yerel Çıkarım Sunucularında Yeni Standart',
    slug: 'acik-agirlikli-akil-yuruten-modeller-ve-yerel-cikarim-sunucularinda-yeni-standart',
    summary:
      'Doğrulanabilir ödüllerle pekiştirmeli öğrenme (RLVR) ve KV-Cache sıkıştırma mimarileri sayesinde açık ağırlıklı modeller, şirket içi sunucularda bulut API maliyetlerini %85 düşürerek sınır modellere yetişti.',
    content: `### Kurumsal Yapay Zekada Açık Ağırlıklı (Open-Weight) Dönüm Noktası

Kapalı kaynaklı dev modellere bağımlılık, **doğrulanabilir ödüllerle eğitilen açık ağırlıklı akıl yürütme (reasoning) modellerinin** yükselişiyle yerini hibrit ve yerel (on-premise) çıkarım mimarilerine bırakıyor.

#### Mimarideki 3 Kritik Atılım
1. **RLVR (Reinforcement Learning with Verifiable Rewards):** Matematiksel ispatlar, birim testleri ve derleyici çıktıları üzerinden kendi düşünce zincirini (Chain-of-Thought) doğrulayan modeller, halüsinasyon oranlarını radikal biçimde aşağı çekti.
2. **MLA ve FP8 KV-Cache Sıkıştırma:** Uzun bağlam (128K+ token) pencerelerinde bellek darboğazını çözen Multi-head Latent Attention (MLA) tekniği, tek bir iş istasyonu GPU'sunda yüksek eşzamanlı istek (throughput) sunulmasını sağlıyor.
3. **vLLM ve SGLang Üretim Motorları:** Önek önbellekleme (Prefix Caching) ve spekülatif kod çözme (Speculative Decoding) ile token üretim hızı saniyede yüzlerce token seviyesine ulaştı.

\`\`\`bash
# vLLM ile yerel FP8 nicelenmiş akıl yürütme modeli servisi başlatma
vllm serve Qwen/QwQ-32B-FP8 \\
  --enable-prefix-caching \\
  --max-model-len 65536 \\
  --kv-cache-dtype fp8 \\
  --reasoning-parser deepseek_r1
\`\`\`

Veri mahremiyeti gerektiren finans, sağlık, savunma ve üniversite araştırma ağları artık verilerini dışarı çıkarmadan kendi özel yapay zeka kümelerini işletebiliyor.`,
    category: 'Yapay Zeka',
    badgeColor: '#10b981',
    source: 'OpenAI & Sistem Mimarisi',
    readTime: '5 dk okuma',
    isFeatured: 1,
    views: 642,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    title: 'BÖTE ve Akademik Araştırmalarda Yapay Zeka Okuryazarlığı ve Açık Bilim Standartları',
    slug: 'bote-ve-akademik-arastirmalarda-yapay-zeka-okuryazarligi-ve-acik-bilim-standartlari',
    summary:
      'Üniversitelerin BÖTE ve mühendislik bölümlerinde öğretim tasarımı müfredatı; doğrulanabilir veri setleri, tekrarlanabilir kod defterleri ve pedagojik yapay zeka etiği ekseninde yeniden şekilleniyor.',
    content: `### Akademide ve Öğretim Teknolojilerinde Yeni Yetkinlik Çerçevesi

Üretken yapay zeka araçlarının yaygınlaşmasıyla birlikte, Bilgisayar ve Öğretim Teknolojileri Eğitimi (**BÖTE**) ile mühendislik fakültelerinde ölçme-değerlendirme ve akademik yayın standartları köklü biçimde güncelleniyor.

#### Öne Çıkan Akademik ve Pedagojik Uygulamalar
- **Süreç Odaklı Ölçme ve Değerlendirme:** Yalnızca sonuç raporu yerine; öğrencinin problem çözme adımlarını, Git sürüm geçmişini ve sözlü kod savunmasını merkeze alan otantik değerlendirme rubrikleri yaygınlaşıyor.
- **Tekrarlanabilir Açık Bilim (Reproducible Science):** Akademik makalelerde ham veri setlerinin ve analiz betiklerinin konteynerleştirilmiş çalışma ortamlarıyla birlikte paylaşılması hakemli dergilerde temel kriter haline geldi.
- **Eleştirel Yapay Zeka Okuryazarlığı:** Öğretmen adaylarına ve araştırmacılara yalnızca istem (prompt) mühendisliği değil; algoritmik önyargı analizi, kaynak doğrulama ve veri gizliliği ilkeleri uygulamalı olarak kazandırılıyor.`,
    category: 'BÖTE & Akademi',
    badgeColor: '#0ea5e9',
    source: 'Akademik Bilişim Raporu',
    readTime: '4 dk okuma',
    isFeatured: 1,
    views: 518,
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
  {
    title: 'React 19 ve Next.js Önbellek Mimarisiyle Hibrit Web Uygulamalarında Sıfır Gecikme',
    slug: 'react-19-ve-nextjs-use-cache-mimarisiyle-hibrit-web-uygulamalarinda-sifir-gecikme',
    summary:
      'Kısmi Ön Oluşturma (Partial Prerendering), derleyici düzeyinde otomatik memoization ve açık önbellek direktifleri sayesinde dinamik web uygulamaları statik site hızında açılıyor.',
    content: `### Modern Tam Yığın (Full-Stack) Web Mimarilerinde Yeni Dönem

Geleneksel SPA (Single Page Application) ile klasik SSR arasındaki ödünleşimler, **statik kabuk + akışkan dinamik adalar (Streaming Islands)** mimarisiyle tamamen ortadan kalkıyor.

#### Öne Çıkan Mühendislik Yenilikleri
1. **React Compiler ile Otomatik Optimizasyon:** Bileşen ağacındaki gereksiz yeniden çizimleri (re-render) derleme aşamasında analiz eden derleyici, manuel \`useMemo\` ve \`useCallback\` karmaşasını sona erdiriyor.
2. **İnce Taneli \`use cache\` Kontrolü:** Sayfa düzeyinde katı önbellekleme yerine fonksiyon ve bileşen bazında etiketlenebilir (\`cacheTag\`) önbellek stratejisiyle veri güncelliği milisaniyeler içinde korunuyor.
3. **Sunucu Eylemlerinde (Server Actions) Sıfır Güven İlkesi:** Her sunucu eyleminin tıpkı açık bir HTTP uç noktası gibi şema doğrulaması ve oturum kontrolünden geçirilmesi standart güvenlik pratiği olarak benimseniyor.

\`\`\`tsx
// Örnek: Etiket bazlı önbelleğe alınan sunucu veri katmanı
import { unstable_cacheTag as cacheTag } from 'next/cache';

export async function getCachedCategoryStats(slug: string) {
  'use cache';
  cacheTag(\`category-\${slug}\`);
  return db.category.findUnique({ where: { slug }, include: { _count: true } });
}
\`\`\``,
    category: 'Web & Yazılım',
    badgeColor: '#3b82f6',
    source: 'Frontend Architecture Digest',
    readTime: '4 dk okuma',
    isFeatured: 0,
    views: 476,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    title: 'Passkey Zorunluluğu ve Cihaza Bağlı Oturum Kimlikleriyle Şifresiz Güvenlik Dönemi',
    slug: 'passkey-zorunlulugu-ve-cihaza-bagli-oturum-kimlikleriyle-sifresiz-guvenlik-donemi',
    summary:
      'FIDO2/WebAuthn tabanlı geçiş anahtarları (Passkeys) ve çerez çalınmasını engelleyen DBSC (Device Bound Session Credentials) protokolü, oltalama ve oturum gaspı saldırılarını etkisizleştiriyor.',
    content: `### Kimlik Doğrulamada Parola ve SMS OTP Sonrası Çağ

Veri ihlallerinin %80'inden fazlasına kaynaklık eden zayıf parolalar ve SIM kopyalama saldırılarına açık SMS doğrulama kodları, yerini kriptografik **Passkey** ve **DBSC** standartlarına bırakıyor.

#### Güvenlik Mimarisi Nasıl Çalışıyor?
- **Asimetrik Anahtar Çifti ve TPM Koruması:** Özel anahtar kullanıcının cihazındaki güvenli donanım modülünden (Secure Enclave / TPM) asla dışarı çıkmaz; sunucuda yalnızca açık anahtar tutulur.
- **Alan Adı Bağlama (Origin Binding):** Sahte bir oltalama (phishing) sitesi gerçek alan adını taklit etse bile tarayıcı kriptografik imzayı üretmeyi reddeder.
- **DBSC ile Çerez Hırsızlığına Son:** Zararlı yazılımlar oturum çerezini kopyalasa dahi, kısa ömürlü oturum yenileme istekleri fiziksel cihazın donanım anahtarıyla imzalanmadığı için başka bilgisayarda kullanılamaz.`,
    category: 'Siber Güvenlik',
    badgeColor: '#f43f5e',
    source: 'ZeroTrust Security Lab',
    readTime: '4 dk okuma',
    isFeatured: 0,
    views: 438,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
  },
  {
    title: 'HBM4 Bellekler ve CXL 3.1 Havuzlama Mimarisi Yapay Zeka Sunucularında Bellek Duvarını Yıkıyor',
    slug: 'hbm4-bellekler-ve-cxl-3-1-havuzlama-mimarisi-yapay-zeka-sunucularinda-bellek-duvarini-yikiyor',
    summary:
      '2048-bit veri yoluna sahip HBM4 yığın bellekler ve sunucular arası paylaşımlı RAM havuzu kuran CXL 3.1 standardı, trilyon parametreli modellerin bellek bant genişliği darboğazını aşıyor.',
    content: `### İşlem Gücü Değil, Veri Taşıma Hızı Belirleyici Oldu

Modern yapay zeka hızlandırıcılarında aritmetik işlem kapasitesi (FLOPS) hızla artarken, ağırlıkların bellekten işlem çekirdeklerine taşınması sırasında yaşanan **"Bellek Duvarı" (Memory Wall)** en büyük mühendislik engeli haline gelmişti.

#### Donanım Cephesindeki Çözümler
1. **2048-Bit Arayüzlü HBM4:** Önceki nesle göre veri yolu genişliğini ikiye katlayan HBM4 istifleri, yığın başına saniyede 2 Terabayt'ı aşan bant genişliği ve özel mantık tabanı (base logic die) sunuyor.
2. **CXL 3.1 (Compute Express Link) Bellek Kumaşı:** Birden fazla CPU ve GPU düğümünün aynı fiziksel bellek havuzuna önbellek tutarlılığıyla (cache-coherent) erişmesini sağlayarak atıl RAM kapasitesini ortadan kaldırıyor.`,
    category: 'Donanım & Çip',
    badgeColor: '#f59e0b',
    source: 'Silicon & Systems Review',
    readTime: '3 dk okuma',
    isFeatured: 0,
    views: 364,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    title: 'Wi-Fi 7 Çoklu Bağlantı (MLO) ve Veri Merkezlerinde 800G Ultra Ethernet Dönemi',
    slug: 'wifi-7-coklu-baglanti-mlo-ve-veri-merkezlerinde-800g-ultra-ethernet-donemi',
    summary:
      '2.4 GHz, 5 GHz ve 6 GHz bantlarını tek bir sanal boruda birleştiren Wi-Fi 7 MLO teknolojisi kablosuz ağlarda kablolu gecikme kararlılığı sunarken, veri merkezlerinde 800G Ultra Ethernet küme iletişimini hızlandırıyor.',
    content: `### Kampüs Ağlarından Yapay Zeka Kümelerine Yeni Nesil İletişim

Ağ mühendisliğinde hem son kullanıcı erişim katmanında hem de omurga veri merkezlerinde paket kaybını ve gecikme titremesini (jitter) minimize eden iki büyük standart sahaya indi.

- **Wi-Fi 7 (IEEE 802.11be) ve MLO:** Cihazların aynı anda birden fazla frekans bandından veri gönderip almasını sağlayan Multi-Link Operation (MLO) ve 320 MHz kanallar sayesinde parazitli ortamlarda bile 2 milisaniyenin altında kararlı gecikme elde ediliyor.
- **800G Ultra Ethernet (UEC):** Büyük ölçekli GPU kümelerinde RDMA (Remote Direct Memory Access) trafiğini açık standart Ethernet üzerinde paket bazlı yük dengelemeyle taşıyarak kapalı ağ protokollerine güçlü bir alternatif oluşturuyor.`,
    category: 'Veri Bilimi & Ağ',
    badgeColor: '#06b6d4',
    source: 'NetEng & Infra Radar',
    readTime: '3 dk okuma',
    isFeatured: 0,
    views: 329,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
  },
  {
    title: 'Bulut-Yerel Mimaride WebAssembly Mikro-Konteynerler ve Otonom FinOps Optimizasyonu',
    slug: 'bulut-yerel-mimaride-webassembly-mikro-konteynerler-ve-otonom-finops-optimizasyonu',
    summary:
      'Kubernetes kümelerinde Linux konteynerleriyle yan yana koşan Wasm iş yükleri bellek tüketimini %80 azaltırken, telemetri güdümlü FinOps ajanları bulut faturalarındaki atıl kaynak israfını anlık kapatıyor.',
    content: `### Bulut Altyapılarında Verimlilik ve Anlık Ölçeklenme

Mikroservis mimarilerinde her küçük API uç noktası için tam bir işletim sistemi katmanı barındıran konteynerler ayağa kaldırmak yüksek bellek ve soğuk başlangıç maliyetine yol açıyordu.

#### Bulut Mühendisliğinde Yeni Yaklaşımlar
1. **Kubernetes Üzerinde Wasm (SpinKube & wasmCloud):** Megabayt yerine kilobayt boyutundaki WebAssembly modülleri milisaniyenin altında sıfırdan yüzlerce kopyaya ölçeklenip istek bittiğinde sıfıra inebiliyor (scale-to-zero).
2. **Otonom FinOps Politikaları:** Prometheus ve OpenTelemetry metriklerini sürekli izleyen orkestrasyon katmanı, düşük trafikli saatlerde iş yüklerini spot düğümlere ve ARM64 işlemcilere kesintisiz taşıyarak bulut maliyetlerinde %45'e varan tasarruf sağlıyor.`,
    category: 'Mobil & Bulut',
    badgeColor: '#ec4899',
    source: 'Cloud Native Weekly',
    readTime: '4 dk okuma',
    isFeatured: 0,
    views: 284,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    title: 'Nükleer Füzyon Reaktörlerinde Yüksek Sıcaklık Süperiletken Mıknatıslar ve Veri Merkezi Enerjisi',
    slug: 'nukleer-fuzyon-reaktorlerinde-yuksek-sicaklik-superiletken-miknatislar-ve-veri-merkezi-enerjisi',
    summary:
      'REBCO yüksek sıcaklık süperiletken şeritleri ve derin pekiştirmeli öğrenme tabanlı plazma kontrolü, kompakt tokamak reaktörlerini ticari temiz enerji şebekesine bir adım daha yaklaştırıyor.',
    content: `### Yapay Zeka Çağında Sürdürülebilir Baz Yük Enerji Arayışı

Küresel veri merkezlerinin elektrik talebi katlanarak büyürken, kesintisiz ve sıfır karbonlu baz yük enerji sağlayacak **kompakt füzyon ve yeni nesil modüler reaktör** teknolojilerinde tarihi mühendislik eşikleri aşılıyor.

- **20 Tesla Üstü HTS Mıknatıslar:** Nadir toprak baryum bakır oksit (REBCO) süperiletken şeritler, çok daha küçük hacimli tokamak odalarında çok daha güçlü manyetik hapsetme alanı üretebiliyor.
- **Yapay Zeka ile Milisaniye Plazma Kararlılığı:** Yüzlerce manyetik bobini saniyede binlerce kez ayarlayan sinir ağları, plazma yırtılmalarını (tearing modes) oluşmadan milisaniyeler önce sönümlüyor.`,
    category: 'Uzay & Bilim',
    badgeColor: '#8b5cf6',
    source: 'CleanTech & Energy Lab',
    readTime: '3 dk okuma',
    isFeatured: 0,
    views: 356,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

const globalForTechNews = globalThis as unknown as {
  techNewsInitialized?: boolean;
  techNewsImageColumnReady?: boolean;
  techNewsVideoColumnReady?: boolean;
  techNewsListCache?: { data: TechNewsItem[]; expiresAt: number };
};

const TECH_NEWS_TTL_MS = 300_000;

export function invalidateTechNewsCache() {
  globalForTechNews.techNewsListCache = undefined;
}

async function ensureTechNewsVideoColumn() {
  if (globalForTechNews.techNewsVideoColumnReady) return;
  await prisma.$executeRaw`
    ALTER TABLE "TechNews" ADD COLUMN "videoUrl" TEXT NOT NULL DEFAULT ''
  `.catch(() => {});
  globalForTechNews.techNewsVideoColumnReady = true;
}

export async function ensureTechNewsTable() {
  if (globalForTechNews.techNewsInitialized) {
    await ensureTechNewsVideoColumn();
    return;
  }

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "TechNews" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "summary" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "badgeColor" TEXT NOT NULL DEFAULT '#6366f1',
      "source" TEXT NOT NULL DEFAULT 'NovaTech Radar',
      "readTime" TEXT NOT NULL DEFAULT '3 dk okuma',
      "isFeatured" INTEGER NOT NULL DEFAULT 0,
      "views" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL DEFAULT '',
      "videoUrl" TEXT NOT NULL DEFAULT ''
    )
  `;

  await ensureTechNewsVideoColumn();

  const existingRows = await prisma.$queryRaw<{ slug: string }[]>`
    SELECT "slug" FROM "TechNews"
  `;
  const existingSlugs = new Set(existingRows.map((r) => r.slug));

  const hasWave2 = INITIAL_NEWS.slice(6, 12).some((s) =>
    existingSlugs.has(s.slug)
  );
  const hasWave3 = INITIAL_NEWS.slice(12).some((s) =>
    existingSlugs.has(s.slug)
  );

  let startSeedIndex = INITIAL_NEWS.length;
  if (existingSlugs.size === 0) {
    startSeedIndex = 0;
  } else if (!hasWave2) {
    startSeedIndex = 6;
  } else if (!hasWave3) {
    startSeedIndex = 12;
  }

  if (startSeedIndex < INITIAL_NEWS.length) {
    for (let i = startSeedIndex; i < INITIAL_NEWS.length; i++) {
      const item = INITIAL_NEWS[i];
      if (existingSlugs.has(item.slug)) continue;

      const id = `news_seed_2026_${i + 1}`;
      const cleanTitle = item.title.trim();
      const imgUrl = resolveNewsImageUrl(item);
      await prisma.$executeRaw`
        INSERT INTO "TechNews" ("id", "title", "slug", "summary", "content", "category", "badgeColor", "source", "readTime", "isFeatured", "views", "createdAt", "imageUrl")
        VALUES (${id}, ${cleanTitle}, ${item.slug}, ${item.summary}, ${item.content}, ${item.category}, ${item.badgeColor}, ${item.source}, ${item.readTime}, ${item.isFeatured}, ${item.views}, ${item.createdAt}, ${imgUrl})
        ON CONFLICT ("slug") DO NOTHING
      `.catch(async () => {
        // SQLite/Postgres uyumluluğu için yedek INSERT
        await prisma.$executeRaw`
          INSERT INTO "TechNews" ("id", "title", "slug", "summary", "content", "category", "badgeColor", "source", "readTime", "isFeatured", "views", "createdAt", "imageUrl")
          VALUES (${`news_${Date.now()}_${i}`}, ${cleanTitle}, ${item.slug}, ${item.summary}, ${item.content}, ${item.category}, ${item.badgeColor}, ${item.source}, ${item.readTime}, ${item.isFeatured}, ${item.views}, ${item.createdAt}, ${imgUrl})
        `.catch(() => {});
      });
    }
    invalidateTechNewsCache();
  }

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "TechNewsComment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "newsId" TEXT NOT NULL,
      "authorId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "parentId" TEXT,
      "createdAt" TEXT NOT NULL
    )
  `;

  const commentCountRes = await prisma.$queryRaw<{ count: bigint | number }[]>`
    SELECT COUNT(*) as count FROM "TechNewsComment"
  `;
  const existingComments = Number(commentCountRes[0]?.count || 0);

  if (existingComments === 0) {
    const firstNews = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "TechNews" ORDER BY "isFeatured" DESC, "createdAt" DESC LIMIT 2
    `;
    const sampleUsers = await prisma.user.findMany({ take: 3 });

    if (firstNews[0] && sampleUsers.length >= 2) {
      const c1Id = `ncom_${Date.now()}_1`;
      const c1Content =
        'Özellikle yerel NPU birimleri üzerinde çalışan kodlama modelleri hem gizlilik hem de gecikme süresi açısından oyunun kurallarını değiştiriyor. Bulut bağımlılığının azalması büyük avantaj.';
      const c1Date = new Date(Date.now() - 1000 * 60 * 90).toISOString();
      await prisma.$executeRaw`
        INSERT INTO "TechNewsComment" ("id", "newsId", "authorId", "content", "parentId", "createdAt")
        VALUES (${c1Id}, ${firstNews[0].id}, ${sampleUsers[0].id}, ${c1Content}, ${null}, ${c1Date})
      `;

      const c2Id = `ncom_${Date.now()}_2`;
      const c2Content =
        'Kesinlikle katılıyorum! Ayrıca MCP protokolü sayesinde farklı araçların tek standartta bağlanması entegrasyon yükünü çok hafifletti.';
      const c2Date = new Date(Date.now() - 1000 * 60 * 45).toISOString();
      await prisma.$executeRaw`
        INSERT INTO "TechNewsComment" ("id", "newsId", "authorId", "content", "parentId", "createdAt")
        VALUES (${c2Id}, ${firstNews[0].id}, ${sampleUsers[1].id}, ${c2Content}, ${c1Id}, ${c2Date})
      `;
    }
  }

  globalForTechNews.techNewsInitialized = true;
}

export async function getAllTechNews(category?: string, search?: string): Promise<TechNewsItem[]> {
  const now = Date.now();
  let allWithCounts: TechNewsItem[];

  if (
    globalForTechNews.techNewsListCache &&
    globalForTechNews.techNewsListCache.expiresAt > now
  ) {
    allWithCounts = globalForTechNews.techNewsListCache.data;
  } else {
    let items: TechNewsItem[];
    let commentCounts: { newsId: string; count: bigint | number }[];

    try {
      [items, commentCounts] = await Promise.all([
        prisma.$queryRaw<TechNewsItem[]>`
          SELECT * FROM "TechNews" ORDER BY "isFeatured" DESC, "createdAt" DESC
        `,
        prisma.$queryRaw<{ newsId: string; count: bigint | number }[]>`
          SELECT "newsId", COUNT(*) as count FROM "TechNewsComment" GROUP BY "newsId"
        `,
      ]);

      const hasWave3 = INITIAL_NEWS.slice(12).some((seed) =>
        items.some((row) => row.slug === seed.slug)
      );

      // Tablo boşsa veya yeni eklenen güncel haber paketi henüz veritabanına işlenmemişse senkron tamamla ve anında listeye yansıt
      if (
        (items.length === 0 || !hasWave3) &&
        !globalForTechNews.techNewsInitialized
      ) {
        await ensureTechNewsTable();
        items = await prisma.$queryRaw<TechNewsItem[]>`
          SELECT * FROM "TechNews" ORDER BY "isFeatured" DESC, "createdAt" DESC
        `;
      }
    } catch {
      await ensureTechNewsTable();
      [items, commentCounts] = await Promise.all([
        prisma.$queryRaw<TechNewsItem[]>`
          SELECT * FROM "TechNews" ORDER BY "isFeatured" DESC, "createdAt" DESC
        `,
        prisma.$queryRaw<{ newsId: string; count: bigint | number }[]>`
          SELECT "newsId", COUNT(*) as count FROM "TechNewsComment" GROUP BY "newsId"
        `,
      ]);
    }

    const countMap: Record<string, number> = {};
    commentCounts.forEach((row) => {
      countMap[row.newsId] = Number(row.count);
    });

    allWithCounts = items.map((item) => {
      const normalizedCategory =
        item.category === 'Eğitim Teknolojileri (BÖTE)'
          ? 'Eğitim Teknolojileri'
          : item.category;
      const normalizedTitle = item.title.replace(' (BÖTE)', '');
      const normalizedSource =
        item.source === 'BÖTE & EdTech Akademi' ? 'EdTech Akademi' : item.source;
      return {
        ...item,
        category: normalizedCategory,
        title: normalizedTitle,
        source: normalizedSource,
        imageUrl: resolveNewsImageUrl({
          ...item,
          category: normalizedCategory,
        }),
        videoUrl: resolveNewsVideoUrl(item),
        commentCount: countMap[item.id] || 0,
      };
    });

    globalForTechNews.techNewsListCache = {
      data: allWithCounts,
      expiresAt: now + TECH_NEWS_TTL_MS,
    };
  }

  return allWithCounts.filter((item) => {
    if (category && item.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export const getTechNewsBySlug = cache(async function getTechNewsBySlugImpl(
  slug: string
): Promise<TechNewsItem | null> {
  // Önbellekte varsa doğrudan 0ms'de kullan
  const now = Date.now();
  if (
    globalForTechNews.techNewsListCache &&
    globalForTechNews.techNewsListCache.expiresAt > now
  ) {
    const cached = globalForTechNews.techNewsListCache.data.find(
      (n) => n.slug === slug
    );
    if (cached) {
      prisma.$executeRaw`
        UPDATE "TechNews" SET "views" = "views" + 1 WHERE "id" = ${cached.id}
      `.catch(() => {});
      return {
        ...cached,
        views: Number(cached.views) + 1,
      };
    }
  }

  let items: TechNewsItem[];
  try {
    items = await prisma.$queryRaw<TechNewsItem[]>`
      SELECT * FROM "TechNews" WHERE "slug" = ${slug} LIMIT 1
    `;
  } catch {
    await ensureTechNewsTable();
    items = await prisma.$queryRaw<TechNewsItem[]>`
      SELECT * FROM "TechNews" WHERE "slug" = ${slug} LIMIT 1
    `;
  }

  if (!items[0]) return null;

  prisma.$executeRaw`
    UPDATE "TechNews" SET "views" = "views" + 1 WHERE "id" = ${items[0].id}
  `.catch(() => {});

  const normalizedCategory =
    items[0].category === 'Eğitim Teknolojileri (BÖTE)'
      ? 'Eğitim Teknolojileri'
      : items[0].category;

  return {
    ...items[0],
    category: normalizedCategory,
    title: items[0].title.replace(' (BÖTE)', ''),
    source:
      items[0].source === 'BÖTE & EdTech Akademi'
        ? 'EdTech Akademi'
        : items[0].source,
    imageUrl: resolveNewsImageUrl({
      ...items[0],
      category: normalizedCategory,
    }),
    videoUrl: resolveNewsVideoUrl(items[0]),
    views: Number(items[0].views) + 1,
  };
});

export async function createTechNews(input: {
  title: string;
  summary: string;
  content: string;
  category: string;
  badgeColor?: string;
  source?: string;
  readTime?: string;
  isFeatured?: boolean;
  imageUrl?: string;
  videoUrl?: string;
}): Promise<TechNewsItem> {
  await ensureTechNewsTable();
  await ensureTechNewsVideoColumn();

  const id = `news_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const baseSlug = slugify(input.title) || 'teknoloji-haberi';
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
  const catObj = TECH_NEWS_CATEGORIES.find((c) => c.name === input.category);
  const customColor =
    input.badgeColor && /^#[0-9a-fA-F]{6}$/.test(input.badgeColor.trim())
      ? input.badgeColor.trim()
      : undefined;
  const badgeColor = customColor || catObj?.color || '#6366f1';
  const createdAt = new Date().toISOString();
  const isFeatured = input.isFeatured ? 1 : 0;
  const source = input.source?.trim() || 'Teknoloji Gündemi Masası';
  const readTime = input.readTime?.trim() || '3 dk okuma';
  const cleanTitle = input.title.trim();
  const cleanSummary = input.summary.trim();
  const cleanContent = input.content.trim();
  const cleanImageUrl =
    input.imageUrl?.trim() === 'none'
      ? 'none'
      : resolveNewsImageUrl({
          imageUrl: input.imageUrl,
          category: input.category,
        });
  const cleanVideoUrl =
    input.videoUrl?.trim() === 'none' ? 'none' : (input.videoUrl || '').trim();

  await prisma.$executeRaw`
    INSERT INTO "TechNews" ("id", "title", "slug", "summary", "content", "category", "badgeColor", "source", "readTime", "isFeatured", "views", "createdAt", "imageUrl", "videoUrl")
    VALUES (${id}, ${cleanTitle}, ${slug}, ${cleanSummary}, ${cleanContent}, ${input.category}, ${badgeColor}, ${source}, ${readTime}, ${isFeatured}, 1, ${createdAt}, ${cleanImageUrl}, ${cleanVideoUrl})
  `;
  invalidateTechNewsCache();

  return {
    id,
    title: cleanTitle,
    slug,
    summary: cleanSummary,
    content: cleanContent,
    category: input.category,
    badgeColor,
    source,
    readTime,
    isFeatured,
    views: 1,
    createdAt,
    imageUrl: cleanImageUrl,
    videoUrl: cleanVideoUrl === 'none' ? '' : cleanVideoUrl,
  };
}

export async function updateTechNews(input: {
  id: string;
  title?: string;
  summary?: string;
  content?: string;
  category?: string;
  badgeColor?: string;
  source?: string;
  readTime?: string;
  isFeatured?: boolean;
  imageUrl?: string;
  videoUrl?: string;
}): Promise<TechNewsItem | null> {
  await ensureTechNewsTable();
  await ensureTechNewsVideoColumn();

  const existing = await prisma.$queryRaw<TechNewsItem[]>`
    SELECT * FROM "TechNews" WHERE "id" = ${input.id} LIMIT 1
  `;
  if (!existing[0]) return null;

  const curr = existing[0];
  const nextTitle =
    input.title !== undefined ? input.title.trim() || curr.title : curr.title;
  const nextSummary =
    input.summary !== undefined
      ? input.summary.trim() || curr.summary
      : curr.summary;
  const nextContent =
    input.content !== undefined
      ? input.content.trim() || curr.content
      : curr.content;
  const nextCategory =
    input.category !== undefined
      ? input.category.trim() || curr.category
      : curr.category;
  const catObj = TECH_NEWS_CATEGORIES.find((c) => c.name === nextCategory);
  const customColor =
    input.badgeColor && /^#[0-9a-fA-F]{6}$/.test(input.badgeColor.trim())
      ? input.badgeColor.trim()
      : undefined;
  const nextBadgeColor =
    customColor ||
    (input.category && input.category !== curr.category
      ? catObj?.color
      : curr.badgeColor) ||
    catObj?.color ||
    '#6366f1';
  const nextSource =
    input.source !== undefined ? input.source.trim() || curr.source : curr.source;
  const nextReadTime =
    input.readTime !== undefined
      ? input.readTime.trim() || curr.readTime
      : curr.readTime;
  const nextFeatured =
    input.isFeatured !== undefined
      ? input.isFeatured
        ? 1
        : 0
      : Number(curr.isFeatured);
  const nextImageUrl =
    input.imageUrl !== undefined
      ? input.imageUrl.trim() === 'none'
        ? 'none'
        : resolveNewsImageUrl({
            imageUrl: input.imageUrl,
            category: nextCategory,
          })
      : curr.imageUrl === 'none'
      ? 'none'
      : resolveNewsImageUrl({
          imageUrl: curr.imageUrl,
          category: nextCategory,
        });
  const nextVideoUrl =
    input.videoUrl !== undefined
      ? input.videoUrl.trim() === 'none' || input.videoUrl.trim() === ''
        ? 'none'
        : input.videoUrl.trim()
      : curr.videoUrl || '';

  await prisma.$executeRaw`
    UPDATE "TechNews"
    SET
      "title" = ${nextTitle},
      "summary" = ${nextSummary},
      "content" = ${nextContent},
      "category" = ${nextCategory},
      "badgeColor" = ${nextBadgeColor},
      "source" = ${nextSource},
      "readTime" = ${nextReadTime},
      "isFeatured" = ${nextFeatured},
      "imageUrl" = ${nextImageUrl},
      "videoUrl" = ${nextVideoUrl}
    WHERE "id" = ${curr.id}
  `;

  invalidateTechNewsCache();

  return {
    ...curr,
    title: nextTitle,
    summary: nextSummary,
    content: nextContent,
    category: nextCategory,
    badgeColor: nextBadgeColor,
    source: nextSource,
    readTime: nextReadTime,
    isFeatured: nextFeatured,
    imageUrl: nextImageUrl,
    videoUrl: resolveNewsVideoUrl({ videoUrl: nextVideoUrl, slug: curr.slug }),
  };
}

export async function deleteTechNews(id: string): Promise<void> {
  await ensureTechNewsTable();
  await prisma.$executeRaw`DELETE FROM "TechNewsComment" WHERE "newsId" = ${id}`;
  await prisma.$executeRaw`DELETE FROM "TechNews" WHERE "id" = ${id}`;
  invalidateTechNewsCache();
}

export async function getTechNewsComments(newsId: string): Promise<TechNewsCommentItem[]> {
  let rows: {
    id: string;
    newsId: string;
    authorId: string;
    content: string;
    parentId: string | null;
    createdAt: string;
  }[];

  try {
    rows = await prisma.$queryRaw`
      SELECT * FROM "TechNewsComment" WHERE "newsId" = ${newsId} ORDER BY "createdAt" ASC
    `;
  } catch {
    await ensureTechNewsTable();
    rows = await prisma.$queryRaw`
      SELECT * FROM "TechNewsComment" WHERE "newsId" = ${newsId} ORDER BY "createdAt" ASC
    `;
  }

  if (rows.length === 0) return [];

  const authorIds = Array.from(new Set(rows.map((r) => r.authorId)));
  const users = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarColor: true,
      role: true,
      reputation: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return rows
    .map((r) => {
      const author = userMap.get(r.authorId);
      if (!author) return null;
      return {
        id: r.id,
        newsId: r.newsId,
        content: r.content,
        parentId: r.parentId,
        createdAt: r.createdAt,
        authorId: r.authorId,
        author,
      };
    })
    .filter((item): item is TechNewsCommentItem => item !== null);
}

export async function createTechNewsComment(input: {
  newsId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
}) {
  await ensureTechNewsTable();

  const id = `ncom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const createdAt = new Date().toISOString();
  const cleanContent = input.content.trim();
  const parentId = input.parentId || null;

  await prisma.$executeRaw`
    INSERT INTO "TechNewsComment" ("id", "newsId", "authorId", "content", "parentId", "createdAt")
    VALUES (${id}, ${input.newsId}, ${input.authorId}, ${cleanContent}, ${parentId}, ${createdAt})
  `;
  invalidateTechNewsCache();

  // Puan güncellemesini arka planda çalıştır (yanıtı geciktirme)
  prisma.user
    .update({
      where: { id: input.authorId },
      data: { reputation: { increment: 5 } },
    })
    .catch(() => {});

  return { id, createdAt };
}

export async function getTechNewsCommentById(commentId: string) {
  await ensureTechNewsTable();
  const rows = await prisma.$queryRaw<
    { id: string; newsId: string; authorId: string; content: string }[]
  >`SELECT * FROM "TechNewsComment" WHERE "id" = ${commentId} LIMIT 1`;
  return rows[0] || null;
}

export async function updateTechNewsComment(commentId: string, content: string) {
  await ensureTechNewsTable();
  const cleanContent = content.trim();
  await prisma.$executeRaw`
    UPDATE "TechNewsComment" SET "content" = ${cleanContent} WHERE "id" = ${commentId}
  `;
}

export async function deleteTechNewsComment(commentId: string) {
  await ensureTechNewsTable();
  await prisma.$executeRaw`
    DELETE FROM "TechNewsComment" WHERE "id" = ${commentId} OR "parentId" = ${commentId}
  `;
  invalidateTechNewsCache();
}

export interface AdminTechNewsCommentItem extends TechNewsCommentItem {
  newsTitle: string;
  newsSlug: string;
}

export async function getAllTechNewsCommentsForAdmin(): Promise<
  AdminTechNewsCommentItem[]
> {
  let rows: {
    id: string;
    newsId: string;
    authorId: string;
    content: string;
    parentId: string | null;
    createdAt: string;
  }[];
  let newsRows: { id: string; title: string; slug: string }[];

  try {
    [rows, newsRows] = await Promise.all([
      prisma.$queryRaw<typeof rows>`SELECT * FROM "TechNewsComment" ORDER BY "createdAt" DESC`,
      prisma.$queryRaw<typeof newsRows>`SELECT "id", "title", "slug" FROM "TechNews"`,
    ]);
  } catch {
    await ensureTechNewsTable();
    [rows, newsRows] = await Promise.all([
      prisma.$queryRaw<typeof rows>`SELECT * FROM "TechNewsComment" ORDER BY "createdAt" DESC`,
      prisma.$queryRaw<typeof newsRows>`SELECT "id", "title", "slug" FROM "TechNews"`,
    ]);
  }

  if (rows.length === 0) return [];

  const authorIds = Array.from(new Set(rows.map((r) => r.authorId)));
  const users = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarColor: true,
      role: true,
      reputation: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));
  const newsMap = new Map(newsRows.map((n) => [n.id, n]));

  return rows
    .map((r) => {
      const author = userMap.get(r.authorId);
      const news = newsMap.get(r.newsId);
      if (!author || !news) return null;
      return {
        id: r.id,
        newsId: r.newsId,
        content: r.content,
        parentId: r.parentId,
        createdAt: r.createdAt,
        authorId: r.authorId,
        author,
        newsTitle: news.title,
        newsSlug: news.slug,
      };
    })
    .filter((item): item is AdminTechNewsCommentItem => item !== null);
}


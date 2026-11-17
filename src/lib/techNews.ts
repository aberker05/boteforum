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
  { name: 'Yapay Zeka', color: '#10b981' },
  { name: 'Web & Yazılım', color: '#3b82f6' },
  { name: 'Donanım & Çip', color: '#f59e0b' },
  { name: 'Siber Güvenlik', color: '#f43f5e' },
  { name: 'Uzay & Bilim', color: '#8b5cf6' },
  { name: 'Mobil & Bulut', color: '#ec4899' },
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
    label: 'İşlemci & Mikroçip',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Kodlama & Yazılım',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
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

export function resolveNewsImageUrl(item: {
  imageUrl?: string;
  slug?: string;
  category?: string;
}): string {
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
      'Yeni nesil akıl yürüten (reasoning) modeller artık tek başına kod yazmakla kalmıyor; uçtan uca test, güvenlik taraması ve mimari重构 (refactoring) süreçlerini otonom yürütüyor.',
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
];

const globalForTechNews = globalThis as unknown as {
  techNewsInitialized?: boolean;
  techNewsImageColumnReady?: boolean;
  techNewsListCache?: { data: TechNewsItem[]; expiresAt: number };
};

const TECH_NEWS_TTL_MS = 120_000;

export function invalidateTechNewsCache() {
  globalForTechNews.techNewsListCache = undefined;
}

export async function ensureTechNewsTable() {
  if (globalForTechNews.techNewsInitialized) return;

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
      "imageUrl" TEXT NOT NULL DEFAULT ''
    )
  `;

  const countResult = await prisma.$queryRaw<{ count: bigint | number }[]>`
    SELECT COUNT(*) as count FROM "TechNews"
  `;
  const count = Number(countResult[0]?.count || 0);

  if (count === 0) {
    for (let i = 0; i < INITIAL_NEWS.length; i++) {
      const item = INITIAL_NEWS[i];
      const id = `news_${Date.now()}_${i}`;
      const cleanTitle = item.title.trim();
      const imgUrl = resolveNewsImageUrl(item);
      await prisma.$executeRaw`
        INSERT INTO "TechNews" ("id", "title", "slug", "summary", "content", "category", "badgeColor", "source", "readTime", "isFeatured", "views", "createdAt", "imageUrl")
        VALUES (${id}, ${cleanTitle}, ${item.slug}, ${item.summary}, ${item.content}, ${item.category}, ${item.badgeColor}, ${item.source}, ${item.readTime}, ${item.isFeatured}, ${item.views}, ${item.createdAt}, ${imgUrl})
      `;
    }
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
      if (items.length === 0 && !globalForTechNews.techNewsInitialized) {
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

    allWithCounts = items.map((item) => ({
      ...item,
      imageUrl: resolveNewsImageUrl(item),
      commentCount: countMap[item.id] || 0,
    }));

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

  return {
    ...items[0],
    imageUrl: resolveNewsImageUrl(items[0]),
    views: Number(items[0].views) + 1,
  };
});

export async function createTechNews(input: {
  title: string;
  summary: string;
  content: string;
  category: string;
  source?: string;
  readTime?: string;
  isFeatured?: boolean;
  imageUrl?: string;
}): Promise<TechNewsItem> {
  await ensureTechNewsTable();

  const id = `news_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const baseSlug = slugify(input.title) || 'teknoloji-haberi';
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
  const catObj = TECH_NEWS_CATEGORIES.find((c) => c.name === input.category);
  const badgeColor = catObj?.color || '#6366f1';
  const createdAt = new Date().toISOString();
  const isFeatured = input.isFeatured ? 1 : 0;
  const source = input.source?.trim() || 'Teknoloji Gündemi Masası';
  const readTime = input.readTime?.trim() || '3 dk okuma';
  const cleanTitle = input.title.trim();
  const cleanSummary = input.summary.trim();
  const cleanContent = input.content.trim();
  const cleanImageUrl = resolveNewsImageUrl({
    imageUrl: input.imageUrl,
    category: input.category,
  });

  await prisma.$executeRaw`
    INSERT INTO "TechNews" ("id", "title", "slug", "summary", "content", "category", "badgeColor", "source", "readTime", "isFeatured", "views", "createdAt", "imageUrl")
    VALUES (${id}, ${cleanTitle}, ${slug}, ${cleanSummary}, ${cleanContent}, ${input.category}, ${badgeColor}, ${source}, ${readTime}, ${isFeatured}, 1, ${createdAt}, ${cleanImageUrl})
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
  };
}

export async function updateTechNews(input: {
  id: string;
  title?: string;
  summary?: string;
  content?: string;
  category?: string;
  source?: string;
  readTime?: string;
  isFeatured?: boolean;
  imageUrl?: string;
}): Promise<TechNewsItem | null> {
  await ensureTechNewsTable();

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
  const nextBadgeColor = catObj?.color || curr.badgeColor || '#6366f1';
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
      ? resolveNewsImageUrl({
          imageUrl: input.imageUrl,
          category: nextCategory,
        })
      : resolveNewsImageUrl({
          imageUrl: curr.imageUrl,
          category: nextCategory,
        });

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
      "imageUrl" = ${nextImageUrl}
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


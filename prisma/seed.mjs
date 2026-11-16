import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Veritabanı başlangıç verileri yükleniyor...');

  // Mevcut verileri temizle
  await prisma.bookmark.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('123456', 10);

  // Kullanıcıları oluştur
  const admin = await prisma.user.create({
    data: {
      username: 'deniz_admin',
      email: 'admin@novatek.forum',
      password: hashedPassword,
      displayName: 'Deniz Yılmaz',
      bio: 'Yazılım mimarı, açık kaynak tutkunu ve NovaForum kurucusu. Web teknolojileri ve sistem tasarımı üzerine yazıyorum.',
      avatarColor: '#6366f1',
      role: 'ADMIN',
      reputation: 1450,
    },
  });

  const elif = await prisma.user.create({
    data: {
      username: 'elif_dev',
      email: 'elif@novatek.forum',
      password: hashedPassword,
      displayName: 'Elif Kaya',
      bio: 'Full-Stack Developer | React, Next.js, TypeScript & Rust. UI/UX detaylarına meraklı.',
      avatarColor: '#ec4899',
      role: 'MODERATOR',
      reputation: 890,
    },
  });

  const mert = await prisma.user.create({
    data: {
      username: 'mert_ai',
      email: 'mert@novatek.forum',
      password: hashedPassword,
      displayName: 'Mert Demir',
      bio: 'Yapay Zeka & LLM Araştırmacısı. Yerel modeller, ince ayar (fine-tuning) ve ajan sistemler.',
      avatarColor: '#10b981',
      role: 'MEMBER',
      reputation: 640,
    },
  });

  const zeynep = await prisma.user.create({
    data: {
      username: 'zeynep_ux',
      email: 'zeynep@novatek.forum',
      password: hashedPassword,
      displayName: 'Zeynep Arslan',
      bio: 'Ürün Tasarımcısı & Design System Uzmanı. Erişilebilirlik ve mikro etkileşimler üzerine çalışıyorum.',
      avatarColor: '#f59e0b',
      role: 'MEMBER',
      reputation: 520,
    },
  });

  // Kategorileri oluştur
  const catGenel = await prisma.category.create({
    data: {
      name: 'Genel Tartışma & Duyurular',
      slug: 'genel-tartisma',
      description: 'Topluluk duyuruları, tanışma, teknoloji dünyasından güncel haberler ve sohbet.',
      icon: 'Megaphone',
      color: '#6366f1',
      order: 1,
    },
  });

  const catWeb = await prisma.category.create({
    data: {
      name: 'Web & Mobil Geliştirme',
      slug: 'web-mobil-gelistirme',
      description: 'React, Next.js, Vue, Node.js, React Native, Flutter ve modern web mimarileri.',
      icon: 'Code2',
      color: '#3b82f6',
      order: 2,
    },
  });

  const catAI = await prisma.category.create({
    data: {
      name: 'Yapay Zeka & Veri Bilimi',
      slug: 'yapay-zeka-veri',
      description: 'LLM modelleri, otonom ajanlar, makine öğrenmesi, Python ve veri mühendisliği.',
      icon: 'Sparkles',
      color: '#10b981',
      order: 3,
    },
  });

  const catTasarim = await prisma.category.create({
    data: {
      name: 'UI/UX & Ürün Tasarımı',
      slug: 'ui-ux-tasarim',
      description: 'Arayüz tasarımı, Figma, tasarım sistemleri, CSS sanatları ve kullanıcı deneyimi.',
      icon: 'Palette',
      color: '#ec4899',
      order: 4,
    },
  });

  const catKariyer = await prisma.category.create({
    data: {
      name: 'Kariyer & Proje Vitrin',
      slug: 'kariyer-proje-vitrin',
      description: 'Kendi projelerinizi tanıtın, geri bildirim alın, mülakat deneyimleri ve kariyer tavsiyeleri.',
      icon: 'Rocket',
      color: '#f59e0b',
      order: 5,
    },
  });

  const catYardim = await prisma.category.create({
    data: {
      name: 'Soru & Cevap (Teknik Yardım)',
      slug: 'soru-cevap',
      description: 'Kodunuzda takıldığınız noktalar, hata çözümleri ve mimari danışmanlık soruları.',
      icon: 'HelpCircle',
      color: '#8b5cf6',
      order: 6,
    },
  });

  // Konuları (Threads) oluştur
  const t1 = await prisma.thread.create({
    data: {
      title: 'NovaForum Topluluğuna Hoş Geldiniz! Kurallar, Özellikler ve Yol Haritası 🚀',
      slug: 'novaforum-topluluguna-hos-geldiniz-kurallar-ve-yol-haritasi',
      content: `Merhaba arkadaşlar, **NovaForum**'a hoş geldiniz! 👋

Burası yazılımcıların, tasarımcıların, teknoloji meraklılarının ve üreticilerin bir araya gelerek kaliteli tartışmalar yürüttüğü modern bir topluluk platformudur.

### ✨ Platformda Neler Yapabilirsiniz?
- **Zengin Markdown Editörü:** Kod blokları, tablolar, başlıklar ve listelerle okunaklı konular açabilirsiniz.
- **Oylama (Upvote / Downvote):** Faydalı bulduğunuz konulara ve yorumlara oy vererek kaliteli içeriğin öne çıkmasını sağlayabilirsiniz.
- **İç İçe Yanıtlar & Çözüm İşaretleme:** Yorumlara doğrudan yanıt verebilir, soru konularında en doğru cevabı **Çözüm** olarak işaretleyebilirsiniz.
- **Etiketler & Gelişmiş Arama:** Konuları etiketlere göre filtreleyebilir ve anlık arama yapabilirsiniz.

\`\`\`typescript
// NovaForum'da örnek bir kod paylaşımı
function merhabaTopluluk(isim: string) {
  return \`Hoş geldin \${isim}, birlikte harika projeler geliştirelim!\`;
}
\`\`\`

### 📌 Temel Topluluk İlkelerimiz
1. **Yapıcı Olun:** Eleştirilerinizi her zaman fikirler ve kodlar üzerinden yapıcı şekilde paylaşın.
2. **Arama Yapın:** Yeni bir soru sormadan önce benzer konulara göz atın.
3. **Detay Verin:** Teknik yardım isterken aldığınız hatayı ve ilgili kod parçasını eklemeyi unutmayın.

Hepinize keyifli paylaşımlar dileriz! Yorumlarda kendinizi tanıtabilirsiniz. 🙌`,
      views: 342,
      isPinned: true,
      isSolved: false,
      tags: 'duyuru,rehber,topluluk',
      authorId: admin.id,
      categoryId: catGenel.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
  });

  const t2 = await prisma.thread.create({
    data: {
      title: 'Next.js 15 ve React 19 ile Full-Stack Uygulamalarda En İyi Pratikler',
      slug: 'nextjs-15-ve-react-19-ile-fullstack-uygulamalarda-en-iyi-pratikler',
      content: `Son dönemde **Next.js App Router** ve **React 19** ile birlikte veri çekme (data fetching), önbellekleme (caching) ve form yönetimi alışkanlıklarımız oldukça değişti.

Kendi prodüksiyon projelerimde uyguladığım ve performans açısından büyük faydasını gördüğüm birkaç önemli noktayı paylaşmak istiyorum:

### 1. Server Components Varsayılan Olmalı
İstemci tarafında etkileşim (\`useState\`, \`useEffect\`, tarayıcı API'leri) gerekmiyorsa bileşenleri Server Component olarak tutmak JS paket boyutunu ciddi oranda düşürüyor.

### 2. Veritabanı Sorgularını Doğrudan Sunucu Bileşenlerinde veya Route Handler'larda Çalıştırın
Prisma veya Drizzle gibi ORM'leri doğrudan sunucu katmanında çağırarak gereksiz API katmanı yükünden kurtulabilirsiniz.

\`\`\`tsx
// Örnek: Paralel veri çekme ile şelale (waterfall) gecikmesini önleme
const [threads, categories] = await Promise.all([
  prisma.thread.findMany({ take: 20 }),
  prisma.category.findMany()
]);
\`\`\`

### 3. Optimistic UI Güncellemeleri
Kullanıcı bir beğeni veya oylama butonuna bastığında sunucu yanıtını beklemeden arayüzü anında güncellemek uygulama hissiyatını çok daha akıcı hale getiriyor.

Siz projelerinizde state yönetimi ve veri çekme için hangi yapıyı tercih ediyorsunuz?`,
      views: 218,
      isPinned: false,
      isSolved: false,
      tags: 'nextjs,react,typescript,mimari',
      authorId: elif.id,
      categoryId: catWeb.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
    },
  });

  const t3 = await prisma.thread.create({
    data: {
      title: '[Çözüldü] SQLite ve Prisma kullanırken bağlantı havuzu (Singleton) nasıl yapılandırılmalı?',
      slug: 'sqlite-ve-prisma-kullanirken-baglanti-havuzu-singleton-nasil-yapilandirilmali',
      content: `Geliştirme ortamında Next.js ile çalışırken her dosya kaydettiğimde (Hot Reload sonrasında) konsolda şu uyarıyı görüyorum:

> \`warn(prisma-client) Already 10 Prisma Clients are actively running.\`

Bunun önüne geçmek için \`PrismaClient\` örneğini nasıl tekil (singleton) hale getirebilirim? Özellikle TypeScript tip güvenliğini bozmadan en temiz yöntem nedir?`,
      views: 164,
      isPinned: false,
      isSolved: true,
      tags: 'prisma,sqlite,nextjs,yardım',
      authorId: mert.id,
      categoryId: catYardim.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
    },
  });

  const t4 = await prisma.thread.create({
    data: {
      title: '2026 Yılında Arayüz Tasarımında Karanlık Mod (Dark Mode) ve Kontrast İpuçları',
      slug: '2026-yilinda-arayuz-tasariminda-karanlik-mod-ve-kontrast-ipuclari',
      content: `Birçok geliştirici karanlık mod tasarlarken arka planı doğrudan tam siyah (\`#000000\`) ve metinleri tam beyaz (\`#FFFFFF\`) yapıyor. Ancak bu durum uzun süreli okumada göz yorgunluğuna (halation etkisi) yol açıyor.

### Daha Modern ve Dinlendirici Karanlık Tema İçin Öneriler:
- **Arka Plan Tonları:** Tam siyah yerine derin arduvaz / lacivert alt tonlu koyu griler (\`#0B0F19\` veya \`#0f172a\`) kullanın.
- **Derinlik Algısı:** Karanlık modda gölgeler pek görünmez. Bunun yerine üstteki kartları bir ton daha açık arka plan ve ince yarı saydam kenarlıklarla (\`border-white/10\`) ayırın.
- **Vurgu Renkleri:** Aydınlık modda kullandığınız doygun renkleri karanlık modda biraz daha pastel/parlak tonlara çekerek okunabilirliği artırın.

Bu forumun karanlık ve aydınlık mod geçişlerini nasıl buldunuz? Görüşlerinizi bekliyorum! 🎨`,
      views: 129,
      isPinned: false,
      isSolved: false,
      tags: 'ui-ux,tasarım,tailwind,dark-mode',
      authorId: zeynep.id,
      categoryId: catTasarim.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
    },
  });

  const t5 = await prisma.thread.create({
    data: {
      title: 'Yerel Olarak Çalışan Kodlama Asistanları ve Ajan Mimarileri Deneyimlerim',
      slug: 'yerel-olarak-calisan-kodlama-asistanlari-ve-ajan-mimarileri-deneyimlerim',
      content: `Son birkaç aydır hem bulut tabanlı büyük modelleri hem de kendi bilgisayarımda çalışan açık ağırlıklı modelleri kodlama iş akışlarımda test ediyorum.

Özellikle çok adımlı görevlerde **araç kullanımı (tool calling)** ve **dosya sistemi indeksleme** yetenekleri modelin ham boyutundan bile daha kritik hale geldi.

### Gözlemlediğim En Büyük Farklar:
1. **Bağlam Yönetimi (Context Engineering):** Modele tüm projeyi vermek yerine sadece ilgili sembolleri ve dosya özetlerini sunmak doğruluğu 2 katına çıkarıyor.
2. **Test Güdümlü Üretim:** Ajanın yazdığı kodu anında linter veya birim testinden geçirip kendi hatasını düzeltmesi (self-healing loop) muazzam zaman kazandırıyor.

Sizin günlük geliştirme sürecinizde yapay zeka araçlarıyla iş akışınız nasıl?`,
      views: 195,
      isPinned: false,
      isSolved: false,
      tags: 'yapay-zeka,llm,ajanlar,üretkenlik',
      authorId: mert.id,
      categoryId: catAI.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
  });

  // Yorumları oluştur
  const c1 = await prisma.comment.create({
    data: {
      content: 'Harika bir platform olmuş! Özellikle Markdown desteği ve temiz tasarım okumayı çok keyifli hale getiriyor. Herkese merhaba! 👋',
      authorId: elif.id,
      threadId: t1.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40),
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Hoş geldin Elif! Katkıların ve moderasyon desteğin için şimdiden teşekkürler.',
      authorId: admin.id,
      threadId: t1.id,
      parentId: c1.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 38),
    },
  });

  const c2 = await prisma.comment.create({
    data: {
      content: `Bunun için \`globalThis\` nesnesini kullanarak geliştirme ortamında tek bir örnek saklayabilirsin. \`src/lib/prisma.ts\` dosyasını şu şekilde oluşturman yeterli:

\`\`\`typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
\`\`\`

Bu yapı sayesinde Next.js her Hot Reload yaptığında yeni bağlantı açmak yerine mevcut örneği kullanmaya devam eder.`,
      isAccepted: true,
      authorId: elif.id,
      threadId: t3.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16),
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Çok teşekkürler Elif! Tam olarak aradığım temiz çözüm buydu, uyarılar tamamen kayboldu. Çözüm olarak işaretledim. 🙏',
      authorId: mert.id,
      threadId: t3.id,
      parentId: c2.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 15),
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Kesinlikle katılıyorum. Özellikle `Promise.all` ile paralel sorgu atmak sayfa geçiş sürelerini yarı yarıya düşürüyor.',
      authorId: admin.id,
      threadId: t2.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
    },
  });

  await prisma.comment.create({
    data: {
      content: 'İnce kenarlık (`border-white/10`) ipucu karanlık temalarda gerçekten hayat kurtarıyor. Gölge yerine katman parlaklığı kullanmak çok daha modern duruyor.',
      authorId: elif.id,
      threadId: t4.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
  });

  // Oyları (Votes) oluştur
  await prisma.vote.createMany({
    data: [
      { userId: elif.id, threadId: t1.id, value: 1 },
      { userId: mert.id, threadId: t1.id, value: 1 },
      { userId: zeynep.id, threadId: t1.id, value: 1 },
      { userId: admin.id, threadId: t2.id, value: 1 },
      { userId: mert.id, threadId: t2.id, value: 1 },
      { userId: zeynep.id, threadId: t2.id, value: 1 },
      { userId: admin.id, threadId: t3.id, value: 1 },
      { userId: elif.id, threadId: t3.id, value: 1 },
      { userId: admin.id, threadId: t4.id, value: 1 },
      { userId: elif.id, threadId: t4.id, value: 1 },
      { userId: mert.id, threadId: t4.id, value: 1 },
      { userId: admin.id, threadId: t5.id, value: 1 },
      { userId: elif.id, threadId: t5.id, value: 1 },
      { userId: admin.id, commentId: c2.id, value: 1 },
      { userId: mert.id, commentId: c2.id, value: 1 },
      { userId: zeynep.id, commentId: c2.id, value: 1 },
    ],
  });

  console.log('✅ Başlangıç verileri başarıyla oluşturuldu!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

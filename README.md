# BÖTEForum — Yazılım, Yapay Zeka ve Bilişim Topluluk Platformu

[![Canlı Demo](https://img.shields.io/badge/Canl%C4%B1_Platform-boteforum.vercel.app-10B981?style=flat-square&logo=vercel&logoColor=white)](https://boteforum.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.2_(App_Router)-0D0F12?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-15181E?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-6.4-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-10B981?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

**BÖTEForum**, yazılım mühendisliği, yapay zeka, siber güvenlik, veri bilimi, eğitim teknolojileri ve BÖTE (Bilgisayar ve Öğretim Teknolojileri Eğitimi) alanlarındaki geliştiricileri, akademisyenleri ve öğrencileri tek çatı altında buluşturan yüksek bilgi yoğunluklu, tam yığın (full-stack) bilgi ve çözüm merkezidir.

🔗 **Canlı Önizleme:** [https://boteforum.vercel.app](https://boteforum.vercel.app)

---

## 🎨 Tasarım Dili ve Estetik

Arayüz, **GitHub Discussions** ve **Linear** mühendislik araçlarından ilham alan keskin hatlı ve okunabilirliği yüksek bir tasarım sistemi üzerine inşa edilmiştir:

- **Renk Paleti:** `#0D0F12` ana arka plan, `#15181E` ikincil kart yüzeyleri, `1px solid #232730` keskin sınır çizgileri (`rounded-md`), `#10B981` terminal yeşili ve `#F59E0B` kehribar vurgu renkleri.
- **Tipografi:** Ana okuma metinleri ve başlıklarda **Plus Jakarta Sans** (`--font-sans`), teknik telemetri, tarihler, rozetler, kısayollar ve kod bloklarında **JetBrains Mono** (`--font-mono`).
- **Yüksek Bilgi Yoğunluğu:** Gereksiz dekoratif efektler yerine hızlı taranabilir konu satırları, rahat/kompakt görünüm anahtarı ve klavye odaklı gezinme.

---

## ✨ Temel Özellikler

### 💬 Tartışma, Soru-Cevap ve Topluluk Motoru
- **Konu Durumları:** Sabitlenmiş (*Pinned*), Kilitli (*Locked*) ve Çözüldü (*Solved*) konu etiketleri; konu sahibi veya moderatör tarafından doğru yanıtı **Kabul Edilen Çözüm** olarak işaretleme.
- **İç İçe Yorum Ağacı & Anketler:** Çok katmanlı yanıt sistemi, konulara özel çok seçenekli topluluk anketleri (*Polls*), yer imlerine kaydetme (*Bookmarks*) ve okunma sayaçları.
- **Oylama & İtibar Sistemi:** Konu ve yorumlarda artı/eksi oylama (*Upvote / Downvote*) ile yazarlara otomatik yansıyan itibar (*Reputation*) puanı ve liderlik tablosu.
- **Akıllı Kategori Gezgini:** Yatay kaydırılabilir kategori şeridi, kategori bazlı çözüm/yanıtsız konu istatistiklerini gösteren genişletilebilir **Kategori Kataloğu**, sol kenar hızlı kategori filtresi ve seçili kategoride doğrudan konu açma (`/yeni-konu?kategoriId=...`).

### 📰 Teknoloji Gündemi & İnovasyon Radarı (`/haberler`)
- **Editöryal Mühendislik Dosyaları:** Yapay Zeka, Siber Güvenlik, Web & Yazılım, Donanım & Çip, Veri Bilimi & Ağ, Mobil & Bulut, Oyun & Simülasyon, Eğitim Teknolojileri, BÖTE & Akademi, Robotik ve Uzay & Bilim kategorilerinde derinlemesine teknik analizler.
- **Canlı Radar & Bölünmüş Dergi Vitrini:** Etkileşimli `RADAR` haber bandı, karartmasız net kapak görseline sahip baş manşet ve yatay bölünmüş dergi kartları.
- **Görsel Kapak Yöneticisi:** Tarayıcı içi otomatik WebP sıkıştırmalı özel kapak yükleme, hazır teknoloji kapak galerisi ve görsel olmadığında devreye giren kategoriye özel vektörel siber ızgara kapağı.
- **SEO & Tartışma:** Her haber dosyası için `NewsArticle` JSON-LD yapısal verisi ve haber altı yorum/tartışma alanı.

### ✍️ Zengin Markdown Editörü
- GitHub Flavored Markdown (`remark-gfm`) desteği; canlı önizleme sekmesi, kalın/italik yazım, satır içi kod, kod bloğu, bağlantı, alıntı ve liste oluşturma araç çubuğu ile tam klavye kısayolu desteği.

### 🛡️ Şikayet, İçerik Raporlama ve Destek Merkezi (`/destek`, `/kurallar`)
- **Hızlı İçerik Bildirimi:** Uygunsuz konu ve yorumları doğrudan içerik altındaki **Bildir** aksiyonuyla moderasyon kuyruğuna iletme.
- **Bilet Tabanlı Destek & Şikayet Merkezi:** Kategori (*Şikayet, Teknik Hata, Hesap Desteği, Öneri*), öncelik seviyesi (*Düşük, Normal, Yüksek, Acil*) ve durum takibi (*Açık, İnceleniyor, Çözüldü*) içeren özel bildirim sistemi; adım adım kullanım rehberiyle birlikte.

### ⚙️ Yönetim & Moderasyon Paneli (`/admin`)
- Kullanıcı rollerini (`ADMIN`, `MODERATOR`, `MEMBER`) güncelleme ve üye yönetimi.
- Kategori ekleme, düzenleme, sıralama ve yönetici panelinden hızlı konu oluşturma.
- Raporlanan içerikleri inceleme/kaldırma ve destek/şikayet biletlerine resmi yönetici yanıtı gönderme.
- Site adı, vurgu rengi ve özel logo ayarlarını (`SiteSettings`) kod değişikliği gerektirmeden canlı güncelleme.

### 🔐 Kimlik Doğrulama & Performans Altyapısı
- **Güvenli Oturum:** `jose` (HS256 JWT + `HttpOnly` çerez) ve `bcryptjs` parola özetleme; Google OAuth 2.0 ile tek tıkla giriş ve doğrulama kodlu şifre sıfırlama (`/sifremi-unuttum`).
- **Akıllı Çift Veritabanı Desteği:** `prisma/generate-smart.mjs` betiği `DATABASE_URL` ortam değişkenini analiz ederek yerel geliştirmede **SQLite**, bulut/üretim ortamında **Supabase PostgreSQL** şemasını otomatik seçer ve derler.
- **Bellek İçi Önbellekleme:** Ana sayfa akışı, site ayarları ve teknoloji haberleri için sunucu tarafı TTL önbelleği + mutasyon anında otomatik önbellek temizleme (`invalidateHomeCache`, `invalidateTechNewsCache`).

---

## ⌨️ Klavye Kısayolları

Platform genelinde herhangi bir metin kutusu odaklı değilken `?` tuşuna basarak kısayol rehberini açabilirsiniz:

| Kısayol | İşlev | Kapsam |
| :--- | :--- | :--- |
| `?` | Klavye kısayolları rehberini aç / kapat | Tüm Sayfalar |
| `/` veya `Ctrl + K` | Üst arama çubuğuna odaklan | Tüm Sayfalar |
| `c` veya `n` | Yeni konu oluşturma sayfasına git | Tüm Sayfalar |
| `g` ardından `h` / `g` / `d` / `k` | Ana Sayfa / Gündem / Destek / Kurallar sayfasına git | Tüm Sayfalar |
| `g` ardından `p` / `s` / `a` | Profil / Kaydedilenler / Yönetim Paneline git | Oturum Açıkken |
| `j` / `k` | Konu listesinde aşağı / yukarı gezin | Ana Sayfa |
| `Enter` veya `o` | Seçili konuyu aç | Ana Sayfa |
| `1` / `2` / `3` | *En Yeni* / *Popüler* / *Yanıtsız* filtreleri arasında geç | Ana Sayfa |
| `v` | *Rahat* ve *Kompakt* liste görünümü arasında geç | Ana Sayfa |
| `x` veya `Esc` | Aktif kategori/etiket/arama filtrelerini sıfırla | Ana Sayfa |
| `r` | Yorum / yanıt editörüne odaklan | Konu & Haber Detay |
| `Ctrl + Enter` | Konuyu veya yorumu gönder | Markdown Editör |
| `Ctrl + B` / `I` / `E` / `L` | Kalın / İtalik / Satır içi kod / Bağlantı ekle | Markdown Editör |
| `Alt + P` | Yazma ve Canlı Önizleme modları arasında geç | Markdown Editör |

---

## 📂 Proje Dizin Yapısı

```text
forum/
├── prisma/
│   ├── schema.prisma            # Yerel geliştirme için SQLite şeması
│   ├── schema.supabase.prisma   # Üretim ortamı için Supabase PostgreSQL şeması
│   ├── generate-smart.mjs       # Ortama göre otomatik Prisma Client üretici
│   └── seed.mjs                 # Örnek kullanıcı, kategori ve konu tohumlama betiği
├── supabase/
│   └── schema.sql               # Supabase SQL Editor kurulum ve RLS şeması
├── src/
│   ├── app/                     # Next.js 15 App Router sayfaları ve API Route Handler'ları
│   │   ├── api/                 # Kimlik doğrulama, konu, yorum, oy, anket, haber, destek, admin uçları
│   │   ├── admin/               # Yönetim ve moderasyon paneli
│   │   ├── destek/              # Şikayet ve destek bilet merkezi
│   │   ├── haberler/            # Teknoloji Gündemi & haber detay sayfaları
│   │   ├── konu/[slug]/         # Konu detay, anket ve iç içe yorum sayfası
│   │   ├── kullanici/[username]/# Kullanıcı profili, istatistikler ve yer imleri
│   │   ├── kurallar/ & gizlilik/# Topluluk kuralları ve gizlilik politikası
│   │   └── yeni-konu/           # Zengin Markdown destekli konu açma sayfası
│   ├── components/              # İstemci ve sunucu arayüz bileşenleri
│   └── lib/                     # Prisma, JWT kimlik doğrulama, haber, destek, bildirim ve önbellek katmanları
└── package.json
```

---

## 🚀 Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın ve Bağımlılıkları Yükleyin

```bash
git clone https://github.com/aberker05/boteforum.git
cd boteforum
npm install
```

### 2. Ortam Değişkenlerini Yapılandırın (`.env`)

Proje kök dizininde bir `.env` dosyası oluşturun:

#### Seçenek A — Yerel Geliştirme (SQLite - Hızlı Başlangıç)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="guclu-ve-rastgele-bir-gizli-anahtar-belirleyin"
```

#### Seçenek B — Üretim / Bulut Ortamı (Supabase PostgreSQL & Vercel)
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="guclu-ve-rastgele-bir-gizli-anahtar-belirleyin"

# İsteğe Bağlı: Google ile Tek Tıkla Giriş (OAuth 2.0)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

> **Not:** Supabase kullanıyorsanız [`supabase/schema.sql`](supabase/schema.sql) dosyasını Supabase SQL Editor üzerinden çalıştırabilir veya `npm run db:push:supabase` komutunu kullanabilirsiniz. Teknoloji Gündemi dosyaları ve yardımcı tablolar ilk çalışmada otomatik olarak senkronize edilir.

### 3. Veritabanını Hazırlayın ve Başlatın

```bash
# Yerel SQLite şemasını oluşturmak ve örnek verileri yüklemek için:
npm run db:push
npm run db:seed

# Geliştirme sunucusunu başlatmak için:
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açarak platformu görüntüleyebilirsiniz.

---

## 📜 Kullanılabilir Komutlar

| Komut | Açıklama |
| :--- | :--- |
| `npm run dev` | Geliştirme sunucusunu `localhost:3000` üzerinde başlatır |
| `npm run build` | Veritabanı türünü algılar (`generate-smart.mjs`), Prisma istemcisini üretir ve üretim paketini derler |
| `npm run start` | Derlenmiş üretim sunucusunu başlatır |
| `npm run db:push` | Yerel SQLite veritabanı şemasını senkronize eder |
| `npm run db:push:supabase` | Supabase PostgreSQL şemasını senkronize eder ve istemciyi üretir |
| `npm run db:seed` | Yerel veritabanına örnek kategoriler, kullanıcılar ve konular yükler |

---

## 🔑 Yerel Geliştirme Demo Hesapları (`npm run db:seed` sonrası)

Yerel kurulumda örnek verileri yükledikten sonra `/giris` sayfasından aşağıdaki hesaplarla test yapabilirsiniz:

| Rol | Kullanıcı Adı | E-posta | Şifre |
| :--- | :--- | :--- | :--- |
| **Yönetici (Admin)** | `deniz_admin` | `admin@novatek.forum` | `123456` |
| **Moderatör** | `elif_dev` | `elif@novatek.forum` | `123456` |
| **Üye** | `mert_ai` | `mert@novatek.forum` | `123456` |

---

## 📄 Lisans

Bu proje eğitim, topluluk paylaşımı ve açık kaynak geliştirme amaçlarıyla geliştirilmiştir.

# 🚀 NovaForum — Modern Topluluk & Forum Platformu

**Next.js 15 (App Router)**, **Tailwind CSS v4** ve **SQLite (Prisma ORM)** ile geliştirilmiş modern, tam kapsamlı (full-stack) forum ve tartışma platformu.

## ✨ Özellikler

- **Kategoriler & Konu Yönetimi:** Kategorilere göre filtreleme, sabitlenmiş (pinned), kilitli (locked) ve çözüldü (solved) konu durumları.
- **Zengin Markdown Editörü:** Konu ve yorumlarda canlı önizleme, kod blokları, başlıklar, alıntılar ve listeler için araç çubuğu.
- **Oylama (Upvote / Downvote) & İtibar Sistemi:** Konu ve yorumları oylama, yazarlara otomatik itibar puanı kazandırma.
- **İç İçe Yorumlar & Çözüm İşaretleme:** Yorumlara yanıt verme ve konu sahibi veya moderatör tarafından doğru cevabı **Kabul Edilen Çözüm** olarak seçme.
- **Arama & Etiket (Tag) Sistemi:** Başlık, içerik ve etiketlerde anlık arama, popüler etiket bulutu.
- **Kullanıcı Kimlik Doğrulama & Profiller:** JWT tabanlı güvenli oturum, profil düzenleme (isim, biyografi, avatar rengi), kaydedilen konular (bookmarks).
- **Karanlık / Aydınlık Mod:** Göz yormayan modern koyu ve açık tema geçişi.

## 🛠️ Çalıştırma Komutları

Geliştirme sunucusunu başlatmak için:

```bash
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açarak forumu kullanabilirsiniz.

### Veritabanı Komutları

- Şemayı senkronize etmek için: `npm run db:push`
- Örnek başlangıç verilerini sıfırlayıp yeniden yüklemek için: `npm run db:seed`

## 🔑 Hazır Demo Hesaplar

Giriş sayfasında (`/giris`) tek tıkla giriş yapabilir veya aşağıdaki bilgileri kullanabilirsiniz:

| Rol | Kullanıcı Adı | E-posta | Şifre |
| :--- | :--- | :--- | :--- |
| **Yönetici (Admin)** | `deniz_admin` | `admin@novatek.forum` | `123456` |
| **Moderatör** | `elif_dev` | `elif@novatek.forum` | `123456` |
| **Üye** | `mert_ai` | `mert@novatek.forum` | `123456` |

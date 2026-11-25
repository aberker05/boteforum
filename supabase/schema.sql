-- ============================================================================
-- BÖTEFORUM / NOVAFORUM - SUPABASE (POSTGRESQL) VERİTABANI ŞEMASI
-- Bu dosyayı doğrudan Supabase Dashboard -> SQL Editor içerisine yapıştırıp
-- "Run" butonuna basarak tüm tabloları, indeksleri, RLS güvenlik katmanını
-- ve başlangıç kategorilerini tek tıkla oluşturabilirsiniz.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "bio" TEXT,
  "avatarColor" TEXT NOT NULL DEFAULT '#6366f1',
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "reputation" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL DEFAULT 'MessageSquare',
  "color" TEXT NOT NULL DEFAULT '#6366f1',
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Thread" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "content" TEXT NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "isSolved" BOOLEAN NOT NULL DEFAULT false,
  "tags" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "categoryId" TEXT NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Comment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "isAccepted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "threadId" TEXT NOT NULL REFERENCES "Thread"("id") ON DELETE CASCADE,
  "parentId" TEXT REFERENCES "Comment"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Vote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "value" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "threadId" TEXT REFERENCES "Thread"("id") ON DELETE CASCADE,
  "commentId" TEXT REFERENCES "Comment"("id") ON DELETE CASCADE,
  UNIQUE("userId", "threadId"),
  UNIQUE("userId", "commentId")
);

CREATE TABLE IF NOT EXISTS "Bookmark" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "threadId" TEXT NOT NULL REFERENCES "Thread"("id") ON DELETE CASCADE,
  UNIQUE("userId", "threadId")
);

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
);

ALTER TABLE "TechNews" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "TechNewsComment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "newsId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "parentId" TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "ThreadPoll" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "threadId" TEXT NOT NULL UNIQUE,
  "question" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ThreadPollOption" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pollId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "ThreadPollVote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pollId" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("pollId", "userId")
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "actorUsername" TEXT NOT NULL,
  "actorDisplayName" TEXT NOT NULL,
  "actorAvatarColor" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "link" TEXT NOT NULL,
  "isRead" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ContentReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reporterId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "threadSlug" TEXT NOT NULL,
  "targetSummary" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "PasswordReset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "SiteSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "siteNamePrimary" TEXT NOT NULL,
  "siteNameAccent" TEXT NOT NULL,
  "siteTagline" TEXT NOT NULL,
  "logoType" TEXT NOT NULL DEFAULT 'icon',
  "logoIcon" TEXT NOT NULL DEFAULT 'Terminal',
  "logoText" TEXT NOT NULL DEFAULT 'NF',
  "logoImageUrl" TEXT NOT NULL DEFAULT '',
  "brandColor" TEXT NOT NULL DEFAULT '#10B981',
  "footerDescription" TEXT NOT NULL,
  "copyrightText" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

-- ============================================================================
-- PERFORMANS İNDEKSLERİ (Foreign Key & Sorgu Optimizasyonu)
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_thread_category" ON "Thread"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_thread_author" ON "Thread"("authorId");
CREATE INDEX IF NOT EXISTS "idx_thread_updated" ON "Thread"("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_comment_thread" ON "Comment"("threadId");
CREATE INDEX IF NOT EXISTS "idx_comment_author" ON "Comment"("authorId");
CREATE INDEX IF NOT EXISTS "idx_vote_thread" ON "Vote"("threadId");
CREATE INDEX IF NOT EXISTS "idx_vote_comment" ON "Vote"("commentId");
CREATE INDEX IF NOT EXISTS "idx_bookmark_user" ON "Bookmark"("userId");
CREATE INDEX IF NOT EXISTS "idx_notification_user" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "idx_technews_comment_news" ON "TechNewsComment"("newsId");

-- ============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) KORUMASI
-- Sunucu tarafı Prisma (postgres rolü) tam erişime devam ederken,
-- dışarıya açık PostgREST / Data API (anon) üzerinden doğrudan erişim kapatılır.
-- ============================================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Thread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bookmark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TechNews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TechNewsComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ThreadPoll" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ThreadPollOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ThreadPollVote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordReset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteSettings" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'SUPPORT',
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "adminReply" TEXT NOT NULL DEFAULT '',
  "repliedAt" TEXT NOT NULL DEFAULT '',
  "createdAt" TEXT NOT NULL
);
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VARSAYILAN FORUM KATEGORİLERİ (İlk Kurulum İçin Otomatik Yüklenir)
-- ============================================================================
INSERT INTO "Category" ("id", "name", "slug", "description", "icon", "color", "order")
VALUES
  ('cat_genel', 'Genel Tartışma & Duyurular', 'genel-tartisma', 'Topluluk duyuruları, tanışma, teknoloji dünyasından güncel haberler ve sohbet.', 'Megaphone', '#6366f1', 1),
  ('cat_web', 'Web & Mobil Geliştirme', 'web-mobil-gelistirme', 'React, Next.js, Vue, Node.js, React Native, Flutter ve modern web mimarileri.', 'Code2', '#3b82f6', 2),
  ('cat_ai', 'Yapay Zeka & Veri Bilimi', 'yapay-zeka-veri', 'LLM modelleri, otonom ajanlar, makine öğrenmesi, Python ve veri mühendisliği.', 'Sparkles', '#10b981', 3),
  ('cat_tasarim', 'UI/UX & Ürün Tasarımı', 'ui-ux-tasarim', 'Arayüz tasarımı, Figma, tasarım sistemleri, CSS sanatları ve kullanıcı deneyimi.', 'Palette', '#ec4899', 4),
  ('cat_kariyer', 'Kariyer & Proje Vitrin', 'kariyer-proje-vitrin', 'Kendi projelerinizi tanıtın, geri bildirim alın, mülakat deneyimleri ve kariyer tavsiyeleri.', 'Rocket', '#f59e0b', 5),
  ('cat_yardim', 'Soru & Cevap (Teknik Yardım)', 'soru-cevap', 'Kodunuzda takıldığınız noktalar, hata çözümleri ve mimari danışmanlık soruları.', 'HelpCircle', '#8b5cf6', 6),
  ('cat_edtech', 'Eğitim Teknolojileri', 'egitim-teknolojileri', 'Dijital öğrenme araçları, öğretim tasarımı, LMS sistemleri ve eğitimde yapay zeka uygulamaları.', 'BookOpen', '#6366f1', 7),
  ('cat_bote', 'BÖTE & Akademi', 'bote-ve-akademi', 'Bilgisayar ve Öğretim Teknolojileri Eğitimi akademik çalışmaları, öğretmenlik deneyimleri ve bölüm topluluğu.', 'GraduationCap', '#0ea5e9', 8)
ON CONFLICT ("slug") DO NOTHING;

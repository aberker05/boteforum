import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, invalidateUserCache } from '@/lib/auth';
import { invalidateHomeCache } from '@/lib/homeCache';
import { slugify } from '@/lib/utils';
import { checkContentModeration } from '@/lib/moderation';
import { createPollForThread } from '@/lib/polls';
import { createNotification, extractMentions } from '@/lib/notifications';
import { isSafeVideoUrl, formatVideoMarkdown } from '@/lib/videoUtils';
import {
  checkActionCooldown,
  validateContentLength,
  validateMarkdownContent,
  verifyRequestOrigin,
} from '@/lib/security';

export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Yeni konu açmak için giriş yapmalısınız.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      categoryId,
      tags,
      customTopic,
      poll,
      videoUrl,
      videoTitle,
      videoSource,
    } = body;

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: 'Başlık, kategori ve içerik alanları zorunludur.' },
        { status: 400 }
      );
    }

    if (videoUrl && !isSafeVideoUrl(String(videoUrl))) {
      return NextResponse.json(
        {
          error:
            'Geçersiz video bağlantısı. Lütfen geçerli bir YouTube, Vimeo, Loom veya MP4/WebM adresi girin.',
        },
        { status: 400 }
      );
    }

    const titleLenCheck = validateContentLength(title, 160, 'Konu başlığı');
    if (!titleLenCheck.valid) {
      return NextResponse.json({ error: titleLenCheck.error }, { status: 400 });
    }

    const contentLenCheck = validateMarkdownContent(content, 25000, 4, 'Konu içeriği');
    if (!contentLenCheck.valid) {
      return NextResponse.json({ error: contentLenCheck.error }, { status: 400 });
    }

    const cooldown = checkActionCooldown(user.id, 'thread', 15000);
    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          error: `Spam koruması: Yeni bir konu açmadan önce lütfen ${cooldown.waitSeconds} saniye bekleyin.`,
        },
        { status: 429 }
      );
    }

    if (categoryId === 'OTHER' && (!customTopic || !customTopic.trim())) {
      return NextResponse.json(
        { error: 'Diğer seçeneği için lütfen konunun ait olduğu alanı/başlığı yazın.' },
        { status: 400 }
      );
    }

    if (title.trim().length < 5) {
      return NextResponse.json(
        { error: 'Konu başlığı en az 5 karakter olmalıdır.' },
        { status: 400 }
      );
    }

    const modTitle = checkContentModeration(title);
    const modContent = checkContentModeration(content);
    if (!modTitle.isClean || !modContent.isClean) {
      return NextResponse.json(
        { error: modTitle.reason || modContent.reason },
        { status: 400 }
      );
    }

    if (poll && poll.question && Array.isArray(poll.options)) {
      const modPollText = `${poll.question} ${poll.options.join(' ')}`;
      const modPoll = checkContentModeration(modPollText);
      if (!modPoll.isClean) {
        return NextResponse.json({ error: modPoll.reason }, { status: 400 });
      }
    }

    let targetCategoryId = categoryId;
    let finalTitle = title.trim();

    if (categoryId === 'OTHER') {
      let otherCategory = await prisma.category.findUnique({
        where: { slug: 'diger-konular' },
      });

      if (!otherCategory) {
        otherCategory = await prisma.category.create({
          data: {
            name: 'Diğer',
            slug: 'diger-konular',
            description: 'Mevcut kategorilerin dışında kalan farklı alanlardaki konular ve tartışmalar.',
            icon: 'Layers',
            color: '#64748b',
            order: 99,
          },
        });
      }

      targetCategoryId = otherCategory.id;
      const cleanCustomTopic = customTopic.trim();
      if (!finalTitle.startsWith(`[${cleanCustomTopic}]`)) {
        finalTitle = `[${cleanCustomTopic}] ${finalTitle}`;
      }
    }

    const baseSlug = slugify(finalTitle) || 'konu';
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${randomSuffix}`;

    const rawTagList = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? tags.split(',')
      : [];

    if (categoryId === 'OTHER' && customTopic?.trim()) {
      rawTagList.unshift(customTopic.trim().toLowerCase());
    }

    const cleanTags = Array.from(
      new Set(rawTagList.map((t: string) => t.trim().toLowerCase()).filter(Boolean))
    )
      .slice(0, 5)
      .join(',');

    let finalContent = content.trim();
    if (
      typeof videoUrl === 'string' &&
      videoUrl.trim() &&
      videoUrl.trim() !== 'none' &&
      !finalContent.includes(videoUrl.trim())
    ) {
      const cleanVidTitle =
        typeof videoTitle === 'string' && videoTitle.trim()
          ? videoTitle.trim()
          : finalTitle;
      const cleanVidSource =
        typeof videoSource === 'string' && videoSource.trim()
          ? videoSource.trim()
          : undefined;
      finalContent = `${finalContent}\n\n${formatVideoMarkdown(
        videoUrl.trim(),
        cleanVidTitle,
        cleanVidSource
      )}`;
    }

    const thread = await prisma.thread.create({
      data: {
        title: finalTitle,
        slug,
        content: finalContent,
        categoryId: targetCategoryId,
        authorId: user.id,
        tags: cleanTags,
      },
    });

    // Varsa anketi kaydet
    if (
      poll &&
      typeof poll.question === 'string' &&
      poll.question.trim() &&
      Array.isArray(poll.options)
    ) {
      await createPollForThread(thread.id, poll.question, poll.options);
    }

    // Puan artırma ve @etiket bildirimlerini yanıtı geciktirmeden arka planda yürüt
    void (async () => {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { reputation: { increment: 10 } },
        });
        invalidateUserCache(user.id);

        const mentionedUsernames = extractMentions(content);
        if (mentionedUsernames.length > 0) {
          const mentionedUsers = await prisma.user.findMany({
            where: { username: { in: mentionedUsernames } },
            select: { id: true },
          });
          const shortTitle =
            finalTitle.length > 48 ? `${finalTitle.slice(0, 48)}...` : finalTitle;

          for (const mu of mentionedUsers) {
            if (mu.id !== user.id) {
              await createNotification({
                userId: mu.id,
                type: 'MENTION',
                actorUsername: user.username,
                actorDisplayName: user.displayName,
                actorAvatarColor: user.avatarColor,
                message: `"${shortTitle}" başlıklı yeni konusunda sizden bahsetti.`,
                link: `/konu/${thread.slug}`,
              });
            }
          }
        }
      } catch (bgErr) {
        console.error('Thread background task error:', bgErr);
      }
    })();

    invalidateHomeCache();
    return NextResponse.json({ thread });
  } catch (error) {
    console.error('Create thread error:', error);
    return NextResponse.json(
      { error: 'Konu oluşturulurken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

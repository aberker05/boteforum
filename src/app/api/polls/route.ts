import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { voteInPoll } from '@/lib/polls';
import { checkActionCooldown, verifyRequestOrigin } from '@/lib/security';

export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Ankette oy kullanmak için giriş yapmalısınız.' },
        { status: 401 }
      );
    }

    const cooldown = checkActionCooldown(user.id, 'poll-vote', 1500);
    if (!cooldown.allowed) {
      return NextResponse.json(
        { error: 'Çok hızlı işlem yapıyorsunuz, lütfen birkaç saniye bekleyin.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { pollId, optionId } = body;

    if (!pollId || !optionId) {
      return NextResponse.json(
        { error: 'Anket ve seçenek bilgisi zorunludur.' },
        { status: 400 }
      );
    }

    const updatedPoll = await voteInPoll(pollId, optionId, user.id);
    if (!updatedPoll) {
      return NextResponse.json(
        { error: 'Anket veya seçenek bulunamadı.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ poll: updatedPoll });
  } catch (error) {
    console.error('Poll vote error:', error);
    return NextResponse.json(
      { error: 'Oy kaydedilirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}


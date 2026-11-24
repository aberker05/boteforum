'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp } from 'lucide-react';

interface VoteButtonsProps {
  threadId?: string;
  commentId?: string;
  initialScore: number;
  initialUserVote: number;
  vertical?: boolean;
  compact?: boolean;
  isLoggedIn: boolean;
}

export function VoteButtons({
  threadId,
  commentId,
  initialScore,
  initialUserVote,
  compact = false,
  isLoggedIn,
}: VoteButtonsProps) {
  const router = useRouter();
  const [score, setScore] = useState(Math.max(0, initialScore));
  const [liked, setLiked] = useState(initialUserVote === 1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push('/giris');
      return;
    }

    if (loading) return;

    const prevScore = score;
    const prevLiked = liked;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setScore(nextLiked ? score + 1 : Math.max(0, score - 1));
    setFeedback('');

    setLoading(true);
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, commentId, value: 1 }),
      });

      const data = await res.json();
      if (res.ok) {
        setScore(Math.max(0, data.score));
        setLiked(data.userVote === 1);
      } else {
        setScore(prevScore);
        setLiked(prevLiked);
        if (data.error) {
          setFeedback(data.error);
          setTimeout(() => setFeedback(''), 2500);
        }
      }
    } catch {
      setScore(prevScore);
      setLiked(prevLiked);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggleLike}
        title={feedback || (liked ? 'Beğeniyi Geri Çek' : 'Faydalı Buldum / Beğen')}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-medium border transition-colors cursor-pointer ${
          liked
            ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#10B981]'
            : 'bg-[#0D0F12] border-[#232730] text-[#8B949E] hover:border-[#10B981]/40 hover:text-[#E6EDF3]'
        }`}
      >
        <ThumbsUp
          className={`w-3 h-3 ${liked ? 'fill-current text-[#10B981]' : ''}`}
        />
        <span className="tabular-nums">{score}</span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggleLike}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
          liked
            ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#10B981]'
            : 'bg-[#0D0F12] border-[#232730] text-[#8B949E] hover:border-[#10B981]/40 hover:text-[#E6EDF3]'
        }`}
      >
        <ThumbsUp
          className={`w-3.5 h-3.5 ${liked ? 'fill-current text-[#10B981]' : ''}`}
        />
        <span>{liked ? 'Faydalı Bulundu' : 'Faydalı'}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold tabular-nums border ${
            liked
              ? 'bg-[#10B981] text-[#0D0F12] border-[#10B981]'
              : 'bg-[#15181E] text-[#E6EDF3] border-[#232730]'
          }`}
        >
          {score}
        </span>
      </button>

      {feedback && (
        <span className="text-[11px] font-mono font-medium text-[#F59E0B]">
          {feedback}
        </span>
      )}
    </div>
  );
}

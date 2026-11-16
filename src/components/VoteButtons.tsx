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

    // Optimistic UI güncellemesi
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
          liked
            ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400'
        }`}
      >
        <ThumbsUp
          className={`w-3.5 h-3.5 transition-transform ${
            liked ? 'fill-current scale-110' : ''
          }`}
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
          liked
            ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 shadow-2xs'
            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400'
        }`}
      >
        <ThumbsUp
          className={`w-3.5 h-3.5 transition-transform ${
            liked ? 'fill-current scale-110 text-indigo-600 dark:text-indigo-400' : ''
          }`}
        />
        <span>{liked ? 'Faydalı Bulundu' : 'Faydalı'}</span>
        <span
          className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
            liked
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-200/70 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200'
          }`}
        >
          {score}
        </span>
      </button>

      {feedback && (
        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 animate-pulse">
          {feedback}
        </span>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, CheckCircle2, Users } from 'lucide-react';
import type { ThreadPollView } from '@/lib/polls';

interface ThreadPollCardProps {
  initialPoll: ThreadPollView;
  isLoggedIn: boolean;
}

export function ThreadPollCard({ initialPoll, isLoggedIn }: ThreadPollCardProps) {
  const router = useRouter();
  const [poll, setPoll] = useState<ThreadPollView>(initialPoll);
  const [loadingOptionId, setLoadingOptionId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(!!initialPoll.userVotedOptionId);
  const [error, setError] = useState('');

  const hasVoted = !!poll.userVotedOptionId;
  const displayBars = hasVoted || showResults;

  const handleVote = async (optionId: string) => {
    if (!isLoggedIn) {
      router.push('/giris');
      return;
    }

    setError('');
    setLoadingOptionId(optionId);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll.id,
          optionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Oyunuz kaydedilemedi.');
      } else if (data.poll) {
        setPoll(data.poll);
        setShowResults(true);
      }
    } catch {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setLoadingOptionId(null);
    }
  };

  return (
    <div className="my-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Topluluk Anketi
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {poll.question}
            </h3>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-indigo-500" />
          {poll.totalVotes} oy
        </span>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="space-y-2.5">
        {poll.options.map((opt) => {
          const isUserChoice = poll.userVotedOptionId === opt.id;
          const isLoading = loadingOptionId === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={!!loadingOptionId}
              onClick={() => handleVote(opt.id)}
              className={`relative w-full text-left rounded-xl border overflow-hidden transition-all p-3 sm:p-3.5 ${
                isUserChoice
                  ? 'border-indigo-500 bg-white dark:bg-slate-900 ring-2 ring-indigo-500/20'
                  : 'border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:border-indigo-400 dark:hover:border-indigo-500'
              }`}
            >
              {/* Yüzdelik Doluluk Çubuğu */}
              {displayBars && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isUserChoice
                      ? 'bg-indigo-500/20 dark:bg-indigo-500/25'
                      : 'bg-slate-200/60 dark:bg-slate-800/70'
                  }`}
                  style={{ width: `${opt.percentage}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isUserChoice
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isUserChoice && <CheckCircle2 className="w-3 h-3" />}
                  </span>
                  <span
                    className={`text-xs sm:text-sm truncate ${
                      isUserChoice
                        ? 'font-bold text-indigo-700 dark:text-indigo-300'
                        : 'font-medium text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {opt.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isLoading ? (
                    <span className="text-xs text-indigo-500 font-semibold">
                      Kaydediliyor...
                    </span>
                  ) : (
                    displayBars && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          %{opt.percentage}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          ({opt.voteCount})
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          {hasVoted
            ? 'Oyunuz kaydedildi. Farklı bir seçeneğe tıklayarak oyunuzu değiştirebilirsiniz.'
            : 'Oy kullanmak için bir seçeneğe tıklayın.'}
        </span>

        {!hasVoted && (
          <button
            type="button"
            onClick={() => setShowResults(!showResults)}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {showResults ? 'Sonuçları Gizle' : 'Sonuçları Gör'}
          </button>
        )}
      </div>
    </div>
  );
}


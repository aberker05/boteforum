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
    <div className="my-4 rounded-md border border-[#232730] bg-[#0D0F12] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#15181E] border border-[#232730] text-[#10B981] flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#10B981] block">
              POLL // TOPLULUK ANKETİ
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#E6EDF3]">
              {poll.question}
            </h3>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm font-mono text-xs font-semibold bg-[#15181E] border border-[#232730] text-[#E6EDF3]">
          <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
          {poll.totalVotes} oy
        </span>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {poll.options.map((opt) => {
          const isUserChoice = poll.userVotedOptionId === opt.id;
          const isLoading = loadingOptionId === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={!!loadingOptionId}
              onClick={() => handleVote(opt.id)}
              className={`relative w-full text-left rounded-md border overflow-hidden transition-colors p-3 cursor-pointer ${
                isUserChoice
                  ? 'border-[#10B981] bg-[#15181E]'
                  : 'border-[#232730] bg-[#15181E] hover:border-[#10B981]/50'
              }`}
            >
              {displayBars && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isUserChoice ? 'bg-[#10B981]/20' : 'bg-[#232730]/70'
                  }`}
                  style={{ width: `${opt.percentage}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                      isUserChoice
                        ? 'border-[#10B981] bg-[#10B981] text-[#0D0F12]'
                        : 'border-[#232730] bg-[#0D0F12]'
                    }`}
                  >
                    {isUserChoice && <CheckCircle2 className="w-3 h-3" />}
                  </span>
                  <span
                    className={`text-xs sm:text-sm truncate ${
                      isUserChoice
                        ? 'font-bold text-[#10B981]'
                        : 'font-medium text-[#E6EDF3]'
                    }`}
                  >
                    {opt.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono">
                  {isLoading ? (
                    <span className="text-xs text-[#10B981] font-semibold">
                      ...
                    </span>
                  ) : (
                    displayBars && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-[#E6EDF3] tabular-nums">
                          %{opt.percentage}
                        </span>
                        <span className="text-[#8B949E] text-[11px] tabular-nums">
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

      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#8B949E]">
        <span>
          {hasVoted
            ? 'Oyunuz kaydedildi. Farklı bir şıkka tıklayarak değiştirebilirsiniz.'
            : 'Oy kullanmak için bir seçeneğe tıklayın.'}
        </span>

        {!hasVoted && (
          <button
            type="button"
            onClick={() => setShowResults(!showResults)}
            className="font-semibold text-[#10B981] hover:underline cursor-pointer"
          >
            {showResults ? 'Sonuçları Gizle' : 'Sonuçları Gör'}
          </button>
        )}
      </div>
    </div>
  );
}

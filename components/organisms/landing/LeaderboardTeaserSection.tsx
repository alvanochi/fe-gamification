'use client'

import Link from 'next/link'
import LeaderboardTable from '@/components/organisms/LeaderboardTable'
import { useLeaderboardQuery } from '@/hooks/use-leaderboard'

export default function LeaderboardTeaserSection() {
  // Landing page tidak perlu sesegar layar pit stop.
  const { data, isLoading } = useLeaderboardQuery(60_000)
  const topRows = (data ?? []).slice(0, 5)

  return (
    <section id="leaderboard" className="bg-scoreboard py-24 text-scoreboard-ink">
      <div className="mx-auto max-w-4xl px-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Mode Pit Stop</p>
        <h2 className="mt-2 font-display text-3xl text-scoreboard-ink sm:text-5xl">LEADERBOARD</h2>
        <p className="mt-3 max-w-lg text-scoreboard-ink/70">
          Poin tantangan, rantai barter, dan engagement media sosial masuk otomatis ke satu papan
          skor begitu panitia menyetujui bukti.
        </p>

        <div className="mt-10 rounded-lg border-brut-lg border-primary bg-scoreboard-raised p-4 shadow-brutal-lg sm:p-6">
          {isLoading ? (
            <p className="px-2 py-8 text-center text-sm text-scoreboard-ink/50">Memuat klasemen…</p>
          ) : (
            <LeaderboardTable rows={topRows} />
          )}
        </div>

        <Link
          href="/leaderboard"
          className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-primary underline"
        >
          Lihat klasemen lengkap →
        </Link>
      </div>
    </section>
  )
}

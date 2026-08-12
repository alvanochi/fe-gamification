'use client'

import { LeaderboardRow } from '@/types/leaderboard'

const MEDALS = ['🥇', '🥈', '🥉']

/**
 * Tabel klasemen yang dipakai bersama oleh halaman /leaderboard dan cuplikan di
 * landing page, supaya keduanya tidak pernah berbeda tampilan maupun urutan.
 */
export default function LeaderboardTable({
  rows,
  highlightGroupId,
}: {
  rows: LeaderboardRow[]
  highlightGroupId?: string | null
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border-brut border-primary/30 bg-[#1f1b16] px-6 py-8 text-center text-sm text-paper/60">
        Belum ada poin yang masuk. Klasemen akan terisi begitu misi pertama disetujui panitia.
      </p>
    )
  }

  return (
    <ul className="divide-y-2 divide-primary/20">
      {rows.map((row, index) => {
        const isMe = highlightGroupId === row.id

        return (
          <li
            key={row.id}
            className={`flex items-center justify-between gap-4 py-3 ${
              isMe ? 'rounded-md bg-primary/10 px-3' : ''
            }`}
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="w-8 shrink-0 font-display text-lg text-primary">{index + 1}</span>
              <span className="shrink-0 text-lg">{MEDALS[index] ?? ''}</span>
              <span className="truncate font-bold text-paper">
                {row.name}
                {isMe && <span className="ml-2 font-mono text-[10px] text-primary">TIM KAMU</span>}
              </span>
            </div>
            <span className="shrink-0 font-display text-lg text-primary">
              {row.score.toLocaleString('id-ID')}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

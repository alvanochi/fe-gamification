'use client'

import { useEffect, useState } from 'react'
import { Group } from '@/types/group'

const mmss = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`

/**
 * Hitung mundur pembentukan kelompok.
 *
 * Server mengirim sisa detik saat data kelompok dibaca; komponen ini hanya
 * menghitung turun secara lokal supaya angkanya bergerak halus tanpa memanggil
 * API tiap detik. Pemanggil memberi `key={formationSecondsLeft}` sehingga
 * angka baru dari server memulai ulang hitungan tanpa menyalin prop ke state.
 */
function Countdown({ initial, group }: { initial: number; group: Group }) {
  const [left, setLeft] = useState(initial)

  useEffect(() => {
    const timer = setInterval(() => setLeft(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  const rule = group.formationRule
  if (!rule) return null

  const habis = left <= 0

  return (
    <div
      className={`mt-4 rounded-md border-brut px-4 py-3 text-center ${
        habis ? '!border-danger bg-paper' : 'bg-paper'
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
        Sisa waktu pembentukan kelompok
      </p>
      <p className={`mt-1 font-display text-3xl ${habis ? 'text-danger' : 'text-ink'}`}>
        {mmss(left)}
      </p>
      <p className="mt-1 text-xs text-ink/55">
        {habis
          ? 'Lewat batas — poin berkurang. Selesaikan segera sebelum hangus.'
          : `Selesai tepat waktu = ${rule.fullPoint} poin. Telat sampai ${rule.graceMinutes} menit = ${rule.latePoint} poin.`}
      </p>
    </div>
  )
}

export default function FormationCountdown({ group }: { group: Group }) {
  // Sudah dinamai berarti tahap pembentukan selesai — tidak ada yang dihitung.
  if (group.nameSetAt || !group.formationRule) return null

  return (
    <Countdown
      key={group.formationSecondsLeft}
      initial={group.formationSecondsLeft ?? 0}
      group={group}
    />
  )
}

'use client'

import { useEffect, useState } from 'react'
import { YelYelState } from '@/types/group'

/** Sisa waktu dalam bentuk "5 jam 12 menit" — jendela yel-yel diukur dalam jam. */
const humanise = (total: number) => {
  if (total <= 0) return 'Waktu habis'
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) return `${hours} jam ${minutes} menit`
  if (minutes > 0) return `${minutes} menit ${seconds} detik`
  return `${seconds} detik`
}

/**
 * Hitung mundur tenggat yel-yel.
 *
 * Sama seperti hitung mundur pembentukan kelompok, sisa waktunya berasal dari
 * server dan hanya diturunkan secara lokal; `key` dari pemanggil membuat angka
 * baru memulai ulang hitungan tanpa menyalin prop ke state.
 */
function Countdown({ initial, deadlineHours }: { initial: number; deadlineHours: number }) {
  const [left, setLeft] = useState(initial)

  useEffect(() => {
    const timer = setInterval(() => setLeft(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  const habis = left <= 0

  return (
    <div className={`rounded-md border-brut px-4 py-3 text-center ${habis ? '!border-danger' : ''} bg-paper`}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
        Batas pengumpulan yel-yel
      </p>
      <p className={`mt-1 font-display text-2xl ${habis ? 'text-danger' : 'text-ink'}`}>
        {humanise(left)}
      </p>
      <p className="mt-1 text-xs text-ink/55">
        {habis
          ? 'Batas waktu sudah lewat — yel-yel tidak lagi bernilai poin.'
          : `Jendela pengumpulan ${deadlineHours} jam sejak nama kelompok tersimpan.`}
      </p>
    </div>
  )
}

export default function YelYelCountdown({ yelYel }: { yelYel: YelYelState }) {
  return (
    <Countdown
      key={yelYel.secondsLeft}
      initial={yelYel.secondsLeft}
      deadlineHours={yelYel.deadlineHours}
    />
  )
}

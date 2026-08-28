'use client'

import { useEffect, useState } from 'react'

/** "12:05" — di pos, detik masih berarti; jam tidak pernah terpakai. */
const mmss = (total: number) => {
  const safe = Math.max(0, total)
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

/**
 * Hitung mundur durasi pengerjaan di pos.
 *
 * Jamnya berjalan sejak petugas memindai QR kedatangan — bukan sejak misinya
 * dibuka di layar. Itu satu-satunya penanda yang tersedia dan sekaligus yang
 * paling adil: kelompok yang mengantre di belakang tidak kehilangan waktunya
 * hanya karena membuka kartu misi lebih awal.
 *
 * Sisa waktunya dihitung dari selisih waktu kedatangan, bukan dari angka yang
 * dikurangi tiap detik. Ponsel yang layarnya mati menghentikan setInterval,
 * dan hitungan yang diturunkan akan tertinggal jauh saat layarnya menyala lagi.
 */
export default function PostDurationCountdown({
  checkedInAt,
  durationMinutes,
}: {
  checkedInAt: string
  durationMinutes: number
}) {
  const deadline = new Date(checkedInAt).getTime() + durationMinutes * 60_000
  const remaining = () => Math.round((deadline - Date.now()) / 1000)

  const [left, setLeft] = useState(remaining)

  useEffect(() => {
    const timer = setInterval(() => setLeft(remaining()), 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedInAt, durationMinutes])

  const habis = left <= 0
  // Satu menit terakhir diberi warna berbeda: itu saat kelompok masih sempat
  // menyelesaikan yang sedang dikerjakan kalau diberi tahu.
  const genting = !habis && left <= 60

  return (
    <div
      className={`rounded-md border-brut px-4 py-3 text-center ${
        habis ? '!border-danger bg-danger/10' : genting ? '!border-warning bg-warning/10' : 'bg-paper'
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
        Waktu pengerjaan di pos
      </p>
      <p
        className={`mt-1 font-display text-3xl tabular-nums ${
          habis ? 'text-danger' : genting ? 'text-warning' : 'text-ink'
        }`}
      >
        {habis ? '00:00' : mmss(left)}
      </p>
      <p className="mt-1 text-xs text-ink/55">
        {habis
          ? `Jatah ${durationMinutes} menit sudah lewat. Petugas yang menentukan hasil akhirnya.`
          : `Dari ${durationMinutes} menit sejak petugas memindai kedatangan kelompokmu.`}
      </p>
    </div>
  )
}

'use client'

import { useState } from 'react'
import RaceShell from '@/components/fragments/RaceShell'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import RadarSearch from '@/components/elements/RadarSearch'
import { useAutoGroupMutation } from '@/hooks/use-group'
import { AppError } from '@/libs/api'

/**
 * Radar sengaja ditahan selama ini sebelum hasilnya ditampilkan. Panggilan API
 * selesai dalam ratusan milidetik, dan tanpa jeda animasinya hanya berkedip —
 * momen "dicarikan kelompok" jadi tidak terasa sama sekali.
 */
const RADAR_DURATION_MS = 10_000

export default function NoGroupStep() {
  const { mutate: autoGroup, error } = useAutoGroupMutation()
  const apiError = error as AppError | null
  const [isSearching, setIsSearching] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(RADAR_DURATION_MS / 1000)

  const handleSearch = () => {
    setIsSearching(true)
    setSecondsLeft(RADAR_DURATION_MS / 1000)

    const countdown = setInterval(() => {
      setSecondsLeft(prev => (prev > 1 ? prev - 1 : 0))
    }, 1000)

    // Hasil baru diterapkan setelah animasi selesai. Kalau permintaannya gagal,
    // radar dihentikan supaya pesan kesalahan terlihat.
    const timer = setTimeout(() => {
      clearInterval(countdown)
      autoGroup(undefined, { onError: () => setIsSearching(false) })
    }, RADAR_DURATION_MS)

    return () => {
      clearInterval(countdown)
      clearTimeout(timer)
    }
  }

  return (
    <RaceShell
      eyebrow="Checkpoint 1 · Kelompok"
      title="GABUNG KELOMPOK"
      subtitle="Sistem akan mengacak kamu ke dalam kelompok berisi maksimal 6 orang."
    >
      {/* SRS 5.3: pembentukan kelompok dijalankan panitia dari dashboard, bukan
          dipicu peserta satu per satu. Peserta menunggu di sini. */}
      <div className="mb-4 rounded-md border-brut border-dashed bg-paper px-4 py-3 text-sm text-ink/70">
        Panitia akan membentuk kelompok dari seluruh peserta yang sudah hadir. Layar ini lanjut
        sendiri begitu kamu mendapat kelompok.
      </div>

      {isSearching ? (
        <RadarSearch
          label={
            secondsLeft > 0
              ? `Mencari kelompokmu di sekitar… ${secondsLeft}`
              : 'Kelompok ditemukan!'
          }
        />
      ) : (
        <Button size="lg" className="w-full" onClick={handleSearch}>
          Cek Kelompokku Sekarang
        </Button>
      )}
      <ErrorMessage message={apiError?.message} className="mt-3" />
    </RaceShell>
  )
}

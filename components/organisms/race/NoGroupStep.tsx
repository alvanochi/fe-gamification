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
          Cari Kelompokku
        </Button>
      )}
      <ErrorMessage message={apiError?.message} className="mt-3" />
    </RaceShell>
  )
}

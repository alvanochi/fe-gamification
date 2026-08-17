'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useVerifyLocationMutation } from '@/hooks/use-missions'
import { AppError } from '@/libs/api'

/**
 * Gerbang lokasi untuk misi berpertanyaan yang dipagari koordinat.
 *
 * Soalnya baru terbuka setelah kelompok membuktikan berada di lokasi, supaya
 * jawaban tidak bisa disiapkan dari rumah. Perhitungan jaraknya dilakukan
 * server — perangkat peserta hanya menyerahkan koordinat.
 */
export default function LocationGate({ missionId }: { missionId: string }) {
  const verify = useVerifyLocationMutation(missionId)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  const apiError = verify.error as AppError | null

  const check = () => {
    setGeoError(null)

    if (!navigator.geolocation) {
      setGeoError('Perangkat ini tidak mendukung deteksi lokasi.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false)
        verify.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setLocating(false)
        setGeoError(
          'Lokasi tidak terbaca. Izinkan akses lokasi di browser, nyalakan GPS, lalu coba lagi.',
        )
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  }

  return (
    <div className="mt-4 rounded-md border-brut border-dashed bg-paper px-4 py-6 text-center">
      <p className="text-3xl">📍</p>
      <p className="mt-2 font-bold text-ink">Soal terkunci</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-ink/60">
        Datangi lokasi misi bersama timmu, lalu tekan tombol di bawah untuk membuka pertanyaannya.
      </p>

      <Button
        size="sm"
        className="mt-4"
        loading={locating || verify.isPending}
        onClick={check}
      >
        Saya sudah di lokasi
      </Button>

      <ErrorMessage message={geoError ?? apiError?.message} className="mt-3 text-left" />
    </div>
  )
}

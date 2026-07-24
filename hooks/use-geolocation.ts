'use client'

import { useState } from 'react'

interface GeoCoords {
  lat: string
  lng: string
}

export const useGeolocation = () => {
  const [coords, setCoords] = useState<GeoCoords | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Perangkatmu tidak mendukung GPS.')
      return
    }

    setIsLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      position => {
        setCoords({
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString(),
        })
        setIsLocating(false)
      },
      err => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi di browser untuk melanjutkan.'
            : 'Gagal mengambil lokasi. Coba lagi.',
        )
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return { coords, error, isLocating, requestLocation }
}

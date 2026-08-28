'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import RaceShell from '@/components/fragments/RaceShell'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { authService } from '@/services/auth.service'
import { AppError } from '@/libs/api'

/**
 * Penukaran QR cetak menjadi sesi.
 *
 * QR yang dicetak panitia mengarah ke halaman ini dengan token di query.
 * Peserta tidak perlu mengetik apa pun — memindai dengan kamera bawaan HP
 * sudah cukup untuk masuk.
 */
function QrExchange() {
  const params = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const token = params.get('t') ?? params.get('token')
  // QR tanpa token bukan keadaan yang berubah seiring waktu — cukup dihitung
  // saat render, tidak perlu ditulis ke state lewat effect.
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const error = token ? exchangeError : 'QR tidak memuat token. Minta bantuan panitia.'
  // Menjaga agar penukaran hanya dijalankan sekali, meski komponen dirender
  // ulang oleh React.
  const startedRef = useRef(false)

  useEffect(() => {
    if (!token || startedRef.current) return
    startedRef.current = true

    authService
      .loginByQr(token)
      .then(res => {
        const { accessToken, refreshToken } = res.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        queryClient.clear()
        router.replace('/race')
      })
      .catch((e: AppError) => setExchangeError(e.message || 'QR tidak dikenali.'))
  }, [token, router, queryClient])

  return (
    <RaceShell
      eyebrow="MMBC Race"
      title={error ? 'QR TIDAK DIKENALI' : 'MEMBUKA AKUNMU'}
      subtitle={error ? undefined : 'Sebentar, kami sedang memasukkanmu ke akun.'}
    >
      {error ? (
        <>
          <ErrorMessage message={error} />
          <Button size="lg" className="mt-4 w-full" onClick={() => router.replace('/')}>
            Kembali ke Beranda
          </Button>
        </>
      ) : (
        <p className="flex items-center justify-center gap-2 text-sm font-bold text-ink/70">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Memproses…
        </p>
      )}
    </RaceShell>
  )
}

export default function QrLoginPage() {
  return (
    <Suspense fallback={null}>
      <QrExchange />
    </Suspense>
  )
}

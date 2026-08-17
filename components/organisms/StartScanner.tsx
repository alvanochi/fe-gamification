'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import jsQR from 'jsqr'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { authService } from '@/services/auth.service'
import { AppError } from '@/libs/api'
import { extractToken } from '@/libs/qr-token'

/**
 * Tombol Mulai di beranda: membuka kamera, memindai QR cetak peserta, lalu
 * langsung memasukkannya ke akun.
 *
 * Peserta didaftarkan panitia sebelum acara, jadi tidak ada pendaftaran mandiri
 * di sini. Pemindaian dilakukan di perangkat peserta — tidak ada gambar yang
 * dikirim ke server.
 */
export default function StartScanner({ autoStart = false }: { autoStart?: boolean }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const busyRef = useRef(false)

  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  // Kamera harus mati saat komponen dilepas, bukan hanya saat ditutup manual.
  useEffect(() => stop, [stop])

  const signIn = useCallback(
    async (token: string) => {
      setStatus('QR terbaca — membuka akunmu…')
      try {
        const res = await authService.loginByQr(token)
        const { accessToken, refreshToken } = res.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        queryClient.clear()
        stop()
        router.replace('/race')
      } catch (e) {
        setError((e as AppError).message || 'QR tidak dikenali.')
        setStatus(null)
        busyRef.current = false
      }
    },
    [queryClient, router, stop],
  )

  const tick = useCallback(function loop() {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!busyRef.current && video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const found = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
        const token = found?.data ? extractToken(found.data) : null
        if (token) {
          busyRef.current = true
          void signIn(token)
        }
      }
    }

    frameRef.current = requestAnimationFrame(loop)
  }, [signIn])

  const start = async () => {
    setError(null)
    setStatus(null)
    busyRef.current = false
    setIsOpen(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      frameRef.current = requestAnimationFrame(tick)
    } catch {
      setError('Tidak bisa membuka kamera. Izinkan akses kamera, lalu coba lagi.')
    }
  }

  if (!isOpen) {
    return (
      <Button size="lg" variant="primary" onClick={start}>
        {autoStart ? 'Buka Kamera' : 'Mulai — Pindai QR'}
      </Button>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="overflow-hidden rounded-md border-brut bg-ink/90">
        <video ref={videoRef} playsInline muted className="aspect-square w-full object-cover" />
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <p className="mt-3 text-center text-sm font-bold text-ink/70">
        {status ?? 'Arahkan kamera ke QR yang diberikan panitia'}
      </p>
      <ErrorMessage message={error ?? undefined} className="mt-2" />

      <Button
        variant="secondary"
        size="sm"
        className="mt-3 w-full"
        onClick={() => {
          stop()
          setIsOpen(false)
        }}
      >
        Batal
      </Button>
    </div>
  )
}

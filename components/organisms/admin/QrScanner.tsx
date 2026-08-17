'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useCheckInByQrMutation } from '@/hooks/use-checkin'
import { AppError } from '@/libs/api'
import { extractToken } from '@/libs/qr-token'

type ScanState = 'idle' | 'starting' | 'scanning'

/**
 * FR-01 — panitia memindai boarding pass peserta untuk check-in.
 *
 * Dekode dilakukan sepenuhnya di perangkat: frame video digambar ke canvas lalu
 * dibaca jsQR. Tidak ada gambar yang dikirim ke mana pun, dan kamera dimatikan
 * begitu komponen dilepas atau pemindaian dihentikan.
 */
export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  // Menahan token yang baru saja terkirim supaya satu kartu tidak dipindai
  // berkali-kali dalam hitungan milidetik selagi kamera masih mengarah padanya.
  const lastTokenRef = useRef<string | null>(null)

  const [state, setState] = useState<ScanState>('idle')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const { mutate: checkIn, isPending, error } = useCheckInByQrMutation()
  const apiError = error as AppError | null

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    setState('idle')
  }, [])

  // Kamera wajib berhenti saat pindah halaman, bukan hanya saat tombol ditekan.
  useEffect(() => stop, [stop])

  // Ekspresi fungsi bernama: `loop` terlihat di dalam dirinya sendiri, sehingga
  // pemanggilan rekursif lewat requestAnimationFrame tidak perlu ref tambahan.
  const tick = useCallback(function loop() {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const found = jsQR(image.data, image.width, image.height, {
          inversionAttempts: 'dontInvert',
        })

        const token = found?.data ? extractToken(found.data) : null
        if (token && token !== lastTokenRef.current) {
          lastTokenRef.current = token
          checkIn(token, {
            onSuccess: res => setFeedback(res.message),
            // Token yang gagal dilepas lagi agar bisa dicoba ulang.
            onError: () => {
              lastTokenRef.current = null
            },
          })
        }
      }
    }

    frameRef.current = requestAnimationFrame(loop)
  }, [checkIn])

  const start = async () => {
    setCameraError(null)
    setFeedback(null)
    setState('starting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setState('scanning')
      frameRef.current = requestAnimationFrame(tick)
    } catch {
      setState('idle')
      setCameraError(
        'Tidak bisa membuka kamera. Pastikan izin kamera diberikan dan situs diakses lewat HTTPS.',
      )
    }
  }

  return (
    <div className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
      <h3 className="font-display text-xl text-ink">Check-in Peserta (QR)</h3>
      <p className="mt-1 text-sm text-ink/60">
        Arahkan kamera ke boarding pass peserta. Check-in tercatat otomatis begitu kode terbaca.
      </p>

      <div className="mt-4 overflow-hidden rounded-md border-brut bg-ink/90">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`aspect-video w-full object-cover ${state === 'scanning' ? '' : 'hidden'}`}
        />
        {state !== 'scanning' && (
          <div className="flex aspect-video w-full items-center justify-center text-sm font-bold text-paper/50">
            Kamera mati
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-4">
        {state === 'scanning' ? (
          <Button variant="secondary" size="sm" className="w-full" onClick={stop}>
            Hentikan Pemindaian
          </Button>
        ) : (
          <Button size="sm" className="w-full" loading={state === 'starting'} onClick={start}>
            Mulai Pemindaian
          </Button>
        )}
      </div>

      {isPending && <p className="mt-3 text-sm font-bold text-ink/60">Mencatat check-in…</p>}
      {feedback && (
        <p className="mt-3 rounded-md border-brut !border-success bg-paper px-4 py-3 text-sm font-bold text-success">
          {feedback}
        </p>
      )}
      <ErrorMessage message={cameraError ?? apiError?.message} className="mt-3" />
    </div>
  )
}

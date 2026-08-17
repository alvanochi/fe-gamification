'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import Select from '@/components/elements/Select'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useMissionsQuery } from '@/hooks/use-missions'
import { usePostScanMutation, type PostScanResult } from '@/hooks/use-post-scan'
import { AppError } from '@/libs/api'
import { extractToken } from '@/libs/qr-token'

type ScanState = 'idle' | 'starting' | 'scanning'

const waktu = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

/**
 * Layar petugas pos.
 *
 * Sebelumnya kedatangan di pos dicatat peserta sendiri dari ponselnya, jadi
 * kelompok bisa mengaku hadir tanpa benar-benar datang. Sekarang petugas yang
 * memindai QR peserta: sistem menemukan kelompoknya, lalu mencatat kedatangan
 * atau kepergian atas nama petugas.
 *
 * Petugas memilih posnya sekali di awal sesi, lalu tinggal mengarahkan kamera
 * sepanjang acara.
 */
export default function PostGuardScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastTokenRef = useRef<string | null>(null)
  // Nilai terbaru untuk dibaca dari dalam loop kamera, yang tidak ikut
  // dirender ulang saat pilihan pos atau mode berubah.
  const configRef = useRef<{
    missionId: string
    action: 'CHECK_IN' | 'CHECK_OUT'
    queueNumber: string
  }>({ missionId: '', action: 'CHECK_IN', queueNumber: '' })

  const [state, setState] = useState<ScanState>('idle')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [missionId, setMissionId] = useState('')
  const [action, setAction] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN')
  const [queueNumber, setQueueNumber] = useState('')
  const [log, setLog] = useState<Array<{ at: string; text: string; ok: boolean }>>([])

  const { data: missions } = useMissionsQuery()
  const scan = usePostScanMutation()

  // Hanya pos berpetugas yang relevan di sini; misi mandiri tidak punya meja.
  const posts = (missions ?? []).filter(m => m.requiresCheckIn)

  useEffect(() => {
    configRef.current = { missionId, action, queueNumber }
  }, [missionId, action, queueNumber])

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setState('idle')
  }, [])

  useEffect(() => stop, [stop])

  const record = useCallback(
    (qrToken: string) => {
      const { missionId: mId, action: act, queueNumber: queue } = configRef.current
      scan.mutate(
        { qrToken, missionId: mId, action: act, queueNumber: queue || undefined },
        {
          onSuccess: res => {
            const d = res.data as PostScanResult
            setLog(prev =>
              [
                {
                  at: waktu(),
                  ok: true,
                  text: `${d.action === 'CHECK_IN' ? 'Masuk' : 'Keluar'} · ${d.groupName ?? 'Kelompok'} — dipindai dari ${d.participantName}`,
                },
                ...prev,
              ].slice(0, 20),
            )
            // Dilepas setelah jeda supaya kartu yang sama tidak terbaca
            // berulang selagi kamera masih mengarah padanya.
            setTimeout(() => {
              lastTokenRef.current = null
            }, 2500)
          },
          onError: (err: unknown) => {
            setLog(prev =>
              [
                { at: waktu(), ok: false, text: (err as AppError).message || 'Gagal mencatat' },
                ...prev,
              ].slice(0, 20),
            )
            lastTokenRef.current = null
          },
        },
      )
    },
    [scan],
  )

  const tick = useCallback(
    function loop() {
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
          // Kartu cetak berisi URL; QR di layar peserta berisi token telanjang.
          // Keduanya harus sampai ke server sebagai token.
          const token = found?.data ? extractToken(found.data) : null
          if (token && token !== lastTokenRef.current) {
            lastTokenRef.current = token
            record(token)
          }
        }
      }

      frameRef.current = requestAnimationFrame(loop)
    },
    [record],
  )

  const start = async () => {
    setCameraError(null)
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

  const selectedPost = posts.find(p => p.id === missionId)

  return (
    <div className="space-y-5">
      <div className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
        <Label htmlFor="pos">Pos yang kamu jaga</Label>
        <Select
          id="pos"
          value={missionId}
          onChange={e => setMissionId(e.target.value)}
          className="mt-2"
        >
          <option value="">— Pilih pos —</option>
          {posts.map(p => (
            <option key={p.id} value={p.id}>
              {p.title}
              {p.locationName ? ` · ${p.locationName}` : ''}
            </option>
          ))}
        </Select>

        {posts.length === 0 && (
          <p className="mt-2 text-xs text-ink/55">
            Belum ada misi yang ditandai wajib lapor pos. Super Admin bisa mengaturnya di Kelola
            Misi.
          </p>
        )}

        <div className="mt-4 flex gap-2">
          {(
            [
              ['CHECK_IN', 'Kedatangan'],
              ['CHECK_OUT', 'Kepergian'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAction(value)}
              aria-pressed={action === value}
              className={`flex-1 rounded-md border-brut-sm px-4 py-2 font-display text-xs uppercase shadow-brutal-sm brutal-press-sm ${
                action === value ? 'bg-primary text-primary-ink' : 'bg-paper text-ink/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {action === 'CHECK_IN' && (
          <div className="mt-4">
            <Label htmlFor="antrean">Nomor antrean (opsional)</Label>
            <Input
              id="antrean"
              value={queueNumber}
              onChange={e => setQueueNumber(e.target.value)}
              placeholder="mis. A-07"
              className="mt-2"
            />
          </div>
        )}
      </div>

      <div className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
        <h3 className="font-display text-xl text-ink">
          {selectedPost ? selectedPost.title : 'Pindai QR Peserta'}
        </h3>
        <p className="mt-1 text-sm text-ink/60">
          {missionId
            ? `Arahkan kamera ke QR peserta untuk mencatat ${action === 'CHECK_IN' ? 'kedatangan' : 'kepergian'} kelompoknya.`
            : 'Pilih pos terlebih dahulu, lalu mulai memindai.'}
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
            <Button
              size="sm"
              className="w-full"
              disabled={!missionId}
              loading={state === 'starting'}
              onClick={start}
            >
              Mulai Pemindaian
            </Button>
          )}
        </div>

        <ErrorMessage message={cameraError ?? undefined} className="mt-3" />
      </div>

      {log.length > 0 && (
        <div className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
          <h3 className="font-display text-lg text-ink">Catatan Pemindaian</h3>
          <ul className="mt-3 space-y-2">
            {log.map((row, i) => (
              <li
                key={`${row.at}-${i}`}
                className={`flex gap-3 rounded-md border-brut-sm px-3 py-2 text-sm ${
                  row.ok ? 'bg-success/10 text-ink' : 'bg-danger/10 text-danger'
                }`}
              >
                <span className="shrink-0 font-mono text-xs text-ink/45">{row.at}</span>
                <span className="min-w-0">{row.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

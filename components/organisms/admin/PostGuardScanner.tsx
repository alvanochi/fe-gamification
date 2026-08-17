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

/** AUTO membiarkan server menyimpulkan datang atau pergi dari keadaan kelompok. */
type ActionMode = 'AUTO' | 'CHECK_IN' | 'CHECK_OUT'

interface Flash {
  ok: boolean
  title: string
  detail: string
}

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
    action: ActionMode
    queueNumber: string
  }>({ missionId: '', action: 'AUTO', queueNumber: '' })

  const [state, setState] = useState<ScanState>('idle')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [missionId, setMissionId] = useState('')
  const [action, setAction] = useState<ActionMode>('AUTO')
  // Umpan balik sebesar layar: di bawah terik matahari, dengan antrean di
  // depan, satu baris teks di daftar tidak akan terbaca.
  const [flash, setFlash] = useState<Flash | null>(null)
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

  // Kilat hasil pemindaian hilang sendiri; petugas tidak perlu menutupnya
  // sebelum melayani orang berikutnya.
  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(null), flash.ok ? 2000 : 4000)
    return () => clearTimeout(timer)
  }, [flash])

  const record = useCallback(
    (qrToken: string) => {
      const { missionId: mId, action: act, queueNumber: queue } = configRef.current
      scan.mutate(
        {
          qrToken,
          missionId: mId,
          action: act === 'AUTO' ? undefined : act,
          queueNumber: queue || undefined,
        },
        {
          onSuccess: res => {
            const d = res.data as PostScanResult
            setFlash({
              ok: true,
              title: d.action === 'CHECK_IN' ? 'DATANG' : 'PERGI',
              detail: d.groupName ?? 'Kelompok',
            })
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
            setFlash({
              ok: false,
              title: 'GAGAL',
              detail: (err as AppError).message || 'Tidak tercatat',
            })
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
              ['AUTO', 'Otomatis'],
              ['CHECK_IN', 'Datang'],
              ['CHECK_OUT', 'Pergi'],
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

        <p className="mt-2 text-xs text-ink/55">
          {action === 'AUTO'
            ? 'Kelompok yang belum tercatat di pos ini dianggap datang; yang sudah, dianggap pergi. Kamu tidak perlu menekan apa pun antar peserta.'
            : 'Mode dikunci manual. Kembalikan ke Otomatis bila antreannya campur datang dan pergi.'}
        </p>

        {action !== 'CHECK_OUT' && (
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
            ? 'Arahkan kamera ke kartu QR peserta — kartu cetak dari panitia, atau QR di layar ponselnya. Cukup satu orang dari tiap kelompok; sisanya ikut tercatat.'
            : 'Pilih pos terlebih dahulu, lalu mulai memindai.'}
        </p>

        <div className="relative mt-4 overflow-hidden rounded-md border-brut bg-ink/90">
          {flash && (
            <div
              role="status"
              aria-live="assertive"
              className={`absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center ${
                flash.ok ? 'bg-success' : 'bg-danger'
              }`}
            >
              <p className="font-display text-5xl text-white drop-shadow sm:text-6xl">
                {flash.title}
              </p>
              <p className="mt-2 max-w-xs text-base font-bold text-white/90">{flash.detail}</p>
            </div>
          )}
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

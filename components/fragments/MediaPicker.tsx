'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'

interface MediaPickerProps {
  onPick: (file: File) => void
  previewUrl: string | null
  /** Daftar `accept` untuk berkas dari galeri. */
  accept: string
  /** Bukti yang diminta misi menentukan tombol mana yang muncul di kamera. */
  allowPhoto?: boolean
  allowVideo?: boolean
  /** Berkas yang sudah dipilih berupa video — pratinjaunya perlu <video>. */
  previewIsVideo?: boolean
  /** Kamera depan untuk selfie, belakang untuk bukti di lapangan. */
  facing?: 'user' | 'environment'
  label?: string
}

/** Berkas hasil rekaman diberi nama yang masuk akal saat panitia mengunduhnya. */
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-')

/** Perekam video memakai wadah yang benar-benar didukung peramban ini. */
const pickRecorderMime = () => {
  const candidates = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']
  return candidates.find(type => MediaRecorder.isTypeSupported(type)) ?? ''
}

/**
 * Pengambil foto & video dengan kamera sungguhan.
 *
 * Sebelumnya "Ketuk untuk membuka kamera" hanyalah `<input type="file">`: di
 * ponsel ia memunculkan pilihan aplikasi, dan di peramban desktop ia membuka
 * penjelajah berkas — kamera tidak pernah benar-benar menyala. Di sini
 * kameranya dibuka langsung lewat getUserMedia, persis seperti layar pemindai
 * pos, dan jalur galeri tetap tersedia untuk foto yang sudah diambil duluan.
 */
export default function MediaPicker({
  onPick,
  previewUrl,
  accept,
  allowPhoto = true,
  allowVideo = false,
  previewIsVideo = false,
  facing = 'environment',
  label = 'Ketuk untuk membuka kamera',
}: MediaPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Kamera mana yang sedang menyala. Bukti misi hampir selalu butuh kamera
  // belakang, tetapi foto tim justru butuh yang depan — dan menutup lalu
  // membuka lagi hanya untuk berpindah sisi adalah langkah yang tidak perlu.
  const [facingNow, setFacingNow] = useState<'user' | 'environment'>(facing)

  const stopStream = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    recorderRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    setIsRecording(false)
  }, [])

  // Kamera yang tetap menyala setelah komponennya hilang membuat lampu kamera
  // terus menyala dan menahan perangkat lain memakainya.
  useEffect(() => stopStream, [stopStream])

  const closeCamera = () => {
    stopStream()
    setIsCameraOpen(false)
  }

  const openCamera = async (side: 'user' | 'environment' = facingNow) => {
    setError(null)
    setIsStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: side },
        audio: allowVideo,
      })
      // Aliran lama dihentikan setelah yang baru berhasil dibuka — kalau
      // dihentikan lebih dulu, kamera yang diminta bisa saja ditolak dan
      // peserta tertinggal dengan layar hitam.
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = stream
      setFacingNow(side)
      setIsCameraOpen(true)
      // Elemen <video> baru ada setelah render berikutnya.
      requestAnimationFrame(() => {
        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        void videoRef.current.play()
      })
    } catch {
      setError(
        'Tidak bisa membuka kamera. Beri izin kamera untuk situs ini, atau pilih berkas dari galeri.',
      )
    } finally {
      setIsStarting(false)
    }
  }

  /** Balik depan/belakang tanpa menutup kamera. Tidak dilakukan saat merekam. */
  const flipCamera = () => openCamera(facingNow === 'user' ? 'environment' : 'user')

  const takePhoto = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      blob => {
        if (!blob) return
        onPick(new File([blob], `foto-${stamp()}.jpg`, { type: 'image/jpeg' }))
        closeCamera()
      },
      'image/jpeg',
      0.92,
    )
  }

  const startRecording = () => {
    if (!streamRef.current) return
    const mimeType = pickRecorderMime()
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)

    chunksRef.current = []
    recorder.ondataavailable = event => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      const type = recorder.mimeType || 'video/webm'
      const extension = type.includes('mp4') ? 'mp4' : 'webm'
      onPick(new File([new Blob(chunksRef.current, { type })], `video-${stamp()}.${extension}`, { type }))
      closeCamera()
    }

    recorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          // Memilih berkas yang sama dua kali berturut-turut tidak memicu
          // onChange kalau nilainya tidak dikosongkan.
          e.target.value = ''
        }}
      />

      <button
        type="button"
        onClick={() => openCamera()}
        className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border-brut bg-paper"
      >
        {previewUrl ? (
          previewIsVideo ? (
            <video src={previewUrl} className="h-full w-full object-cover" muted playsInline controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Pratinjau bukti" className="h-full w-full object-cover" />
          )
        ) : (
          <span className="px-4 text-center text-sm font-bold text-ink/50">{label}</span>
        )}
      </button>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button size="sm" variant="secondary" loading={isStarting} onClick={() => openCamera()}>
          Buka Kamera
        </Button>
        <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
          Pilih dari Galeri
        </Button>
      </div>

      <ErrorMessage message={error ?? undefined} />

      {isCameraOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-ink/90 p-4">
          <video
            ref={videoRef}
            playsInline
            muted
            className="max-h-[70vh] w-full max-w-xl rounded-md border-brut object-contain"
          />

          <div className="mt-3 flex w-full max-w-xl items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-paper/70">
              Kamera {facingNow === 'user' ? 'depan' : 'belakang'}
            </span>
            <Button
              size="sm"
              variant="ghost"
              loading={isStarting}
              disabled={isRecording}
              onClick={flipCamera}
            >
              ⟲ Balik Kamera
            </Button>
          </div>

          <div className="mt-3 flex w-full max-w-xl gap-2">
            <Button variant="ghost" size="sm" className="flex-1" onClick={closeCamera}>
              Batal
            </Button>

            {isRecording ? (
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={() => recorderRef.current?.stop()}
              >
                Stop &amp; Pakai
              </Button>
            ) : (
              <>
                {allowPhoto && (
                  <Button size="sm" className="flex-1" onClick={takePhoto}>
                    Ambil Foto
                  </Button>
                )}
                {allowVideo && (
                  <Button size="sm" variant="secondary" className="flex-1" onClick={startRecording}>
                    Rekam Video
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

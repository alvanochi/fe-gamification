'use client'

import { useEffect } from 'react'
import Button from '@/components/elements/Button'
import { useLatestToast, clearToast } from '@/hooks/use-toast-feed'

const TONE_CLASS = {
  success: '!border-success bg-success/15',
  danger: '!border-danger bg-danger/15',
  info: '!border-secondary bg-secondary/15',
} as const

/** Versi tengah layar memakai latar pekat, bukan tembus pandang. */
const MODAL_TONE_CLASS = {
  success: '!border-success',
  danger: '!border-danger',
  info: '!border-secondary',
} as const

/**
 * Kabar dari panitia, muncul di layar peserta seketika.
 *
 * Dua hal yang sebelumnya terjadi tanpa tanda apa pun di sisi peserta: bukti
 * yang diperiksa panitia, dan QR yang dipindai petugas pos. Keduanya berakhir
 * di sini, karena keduanya sama-sama menjawab pertanyaan yang membuat kelompok
 * berdiri menunggu di depan layar — "sudah masuk belum?".
 */
export default function AppToast() {
  const toast = useLatestToast()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(clearToast, toast.duration ?? 6000)
    return () => clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  if (toast.display === 'modal') {
    return (
      <div
        role="status"
        aria-live="assertive"
        className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      >
        <button
          type="button"
          aria-label="Tutup"
          onClick={clearToast}
          className="absolute inset-0 cursor-default bg-ink/70"
        />

        <div
          className={`relative w-full max-w-sm rounded-lg border-brut-lg bg-paper-raised p-6 text-center shadow-brutal-lg ${
            MODAL_TONE_CLASS[toast.tone]
          }`}
        >
          <span className="block text-5xl">{toast.icon}</span>
          <p className="mt-3 font-display text-2xl text-ink">{toast.title}</p>
          {toast.subject && (
            <p className="mt-1 font-bold text-ink/75">{toast.subject}</p>
          )}
          {toast.detail && <p className="mt-2 text-sm text-ink/60">{toast.detail}</p>}

          <Button size="lg" className="mt-5 w-full" onClick={clearToast}>
            Oke
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-sm sm:inset-x-auto sm:right-4"
    >
      <div className={`rounded-lg border-brut p-4 shadow-brutal ${TONE_CLASS[toast.tone]}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{toast.icon}</span>

          <div className="min-w-0 flex-1">
            <p className="font-display text-lg text-ink">{toast.title}</p>
            {toast.subject && (
              <p className="mt-0.5 truncate text-sm font-bold text-ink/75">{toast.subject}</p>
            )}
            {toast.detail && <p className="mt-1 text-sm text-ink/70">{toast.detail}</p>}
          </div>

          <button
            type="button"
            aria-label="Tutup"
            onClick={clearToast}
            className="shrink-0 rounded-sm px-2 font-mono text-sm text-ink/45"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

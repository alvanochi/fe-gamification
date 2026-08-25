'use client'

import { useEffect } from 'react'
import { useLatestToast, clearToast } from '@/hooks/use-toast-feed'

const TONE_CLASS = {
  success: '!border-success bg-success/15',
  danger: '!border-danger bg-danger/15',
  info: '!border-secondary bg-secondary/15',
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

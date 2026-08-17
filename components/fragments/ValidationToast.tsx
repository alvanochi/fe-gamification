'use client'

import { useEffect } from 'react'
import { useLatestValidation, clearValidation } from '@/hooks/use-validation-feed'

/**
 * Kabar hasil validasi panitia, muncul di layar peserta seketika.
 *
 * Sebelumnya satu-satunya tanda bahwa bukti sudah diperiksa adalah angka skor
 * yang bergeser diam-diam — dan bukti yang ditolak tidak memberi tanda apa
 * pun. Kelompok berdiri menunggu di depan layar yang tidak berubah.
 */
export default function ValidationToast() {
  const event = useLatestValidation()

  // Menutup sendiri; penolakan diberi waktu lebih lama karena ada alasan yang
  // perlu dibaca.
  useEffect(() => {
    if (!event) return
    const timer = setTimeout(clearValidation, event.status === 'APPROVED' ? 6000 : 12000)
    return () => clearTimeout(timer)
  }, [event])

  if (!event) return null

  const approved = event.status === 'APPROVED'

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-sm sm:inset-x-auto sm:right-4"
    >
      <div
        className={`rounded-lg border-brut p-4 shadow-brutal ${
          approved ? '!border-success bg-success/15' : '!border-danger bg-danger/15'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{approved ? '🎉' : '↩️'}</span>

          <div className="min-w-0 flex-1">
            <p className="font-display text-lg text-ink">
              {approved ? 'Bukti Diterima' : 'Bukti Dikembalikan'}
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-ink/75">{event.missionTitle}</p>

            {approved ? (
              event.point != null && (
                <p className="mt-1 text-sm font-bold text-success">+{event.point} poin</p>
              )
            ) : (
              <p className="mt-1 text-sm text-ink/70">
                {event.rejectReason
                  ? event.rejectReason
                  : 'Panitia tidak menyertakan catatan. Perbaiki lalu kirim ulang.'}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Tutup"
            onClick={clearValidation}
            className="shrink-0 rounded-sm px-2 font-mono text-sm text-ink/45"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

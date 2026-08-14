'use client'

import { useState } from 'react'
import ParticipantQrCard from '@/components/organisms/race/ParticipantQrCard'
import { useHasSession, useProfileQuery } from '@/hooks/use-profile'

/**
 * Boarding pass mengambang, tersedia di seluruh checkpoint /race.
 *
 * Check-in di lokasi terjadi saat peserta baru tiba — jauh sebelum kelompok
 * terbentuk. Sebelumnya kartu QR hanya dirender di layar sukses (checkpoint 6),
 * sehingga panitia tidak punya apa pun untuk dipindai di meja registrasi.
 */
export default function BoardingPassPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: profile } = useProfileQuery({ enabled: useHasSession() })

  // Panitia tidak ikut di-check-in lewat QR peserta.
  if (!profile?.qrToken || profile.role !== 'PARTICIPANT') return null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className="fixed bottom-4 right-4 z-50 rounded-md border-brut bg-primary px-4 py-3 font-display text-xs uppercase text-primary-ink shadow-brutal brutal-press"
      >
        {isOpen ? 'Tutup' : profile.checkInAt ? 'Boarding Pass ✓' : 'Boarding Pass'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 p-4 sm:items-center">
          {/* Klik latar untuk menutup, tanpa menelan klik di dalam kartu. */}
          <button
            type="button"
            aria-label="Tutup boarding pass"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-sm pb-20 sm:pb-0">
            <ParticipantQrCard />
          </div>
        </div>
      )}
    </>
  )
}

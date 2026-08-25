'use client'

import { useState } from 'react'
import ParticipantQrCard from '@/components/organisms/race/ParticipantQrCard'
import { useHasSession, useProfileQuery } from '@/hooks/use-profile'

/**
 * QR pos mengambang, tersedia di seluruh checkpoint /race.
 *
 * Kode ini dipakai sepanjang perlombaan — petugas memindainya saat kelompok
 * datang ke pos dan saat pergi darinya — jadi ia harus terjangkau dari layar
 * mana pun, bukan hanya dari layar sukses di ujung rangkaian checkpoint.
 */
export default function QrPosPanel() {
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
        {isOpen ? 'Tutup' : profile.lastPostScan ? 'QR POS ✓' : 'QR POS'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 p-4 sm:items-center">
          {/* Klik latar untuk menutup, tanpa menelan klik di dalam kartu. */}
          <button
            type="button"
            aria-label="Tutup QR pos"
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

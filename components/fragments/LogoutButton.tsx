'use client'

import { useState } from 'react'
import { FiPower } from 'react-icons/fi'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import { useLogoutMutation } from '@/hooks/use-auth'

/**
 * Tombol keluar akun.
 *
 * `floating` menempelkannya di pojok layar (dipakai di alur peserta yang
 * tanpa header), selain itu tampil sebagai tombol biasa di dalam navigasi.
 */
export default function LogoutButton({ floating = false }: { floating?: boolean }) {
  const [isConfirming, setIsConfirming] = useState(false)
  const { mutate: logout, isPending } = useLogoutMutation()

  const className = floating
    ? 'fixed left-4 top-4 z-50 flex items-center gap-2 rounded-md border-brut bg-paper-raised px-3 py-2 font-display text-xs uppercase text-ink shadow-brutal-sm brutal-press-sm'
    : 'flex items-center gap-2 rounded-md border-brut-sm bg-paper-raised px-4 py-2 font-display text-xs uppercase text-ink shadow-brutal-sm brutal-press-sm'

  return (
    <>
      <button type="button" onClick={() => setIsConfirming(true)} className={className}>
        <FiPower aria-hidden className="h-4 w-4" />
        Keluar
      </button>

      <ConfirmModal
        open={isConfirming}
        title="Keluar dari akun?"
        description={
          <>
            <p>Kamu akan dikembalikan ke halaman utama.</p>
            <p className="mt-2">
              Progres kelompok dan misimu <strong>tidak hilang</strong> — cukup masuk lagi dengan
              nama dan nomor telepon yang sama untuk melanjutkan.
            </p>
          </>
        }
        confirmLabel="Ya, Keluar"
        confirmVariant="danger"
        loading={isPending}
        onConfirm={() => logout()}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  )
}

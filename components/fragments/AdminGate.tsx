'use client'

import Link from 'next/link'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import { useProfileQuery } from '@/hooks/use-profile'

/**
 * Penjaga halaman panel.
 *
 * `requireSuperAdmin` dipakai halaman yang mengubah konten permainan — sesuai
 * BRD Bab 4, panitia lapangan hanya bertugas memvalidasi unggahan.
 */
export default function AdminGate({
  children,
  requireSuperAdmin = false,
}: {
  children: React.ReactNode
  requireSuperAdmin?: boolean
}) {
  const profileQuery = useProfileQuery()

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4">
        <CardSkeleton className="w-full max-w-xl" />
      </div>
    )
  }

  const profile = profileQuery.data
  const isPanitia = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN'
  const isAllowed = requireSuperAdmin ? profile?.role === 'SUPER_ADMIN' : isPanitia

  if (!isAllowed) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
        <h1 className="font-display text-3xl text-ink">Akses Ditolak</h1>
        <p className="max-w-sm text-sm text-ink/60">
          {isPanitia
            ? 'Halaman ini hanya untuk Super Admin. Hubungi penanggung jawab teknis acara bila kamu perlu mengubah konten permainan.'
            : 'Halaman ini hanya untuk panitia. Akunmu tidak punya akses.'}
        </p>
        <Link
          href={isPanitia ? '/admin/validation' : '/race'}
          className="rounded-md border-brut bg-primary px-5 py-3 font-display uppercase text-primary-ink shadow-brutal brutal-press"
        >
          {isPanitia ? 'Ke Validasi' : 'Kembali ke Race'}
        </Link>
      </div>
    )
  }

  return <>{children}</>
}

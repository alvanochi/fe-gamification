'use client'

import Link from 'next/link'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import { useProfileQuery } from '@/hooks/use-profile'
import type { UserRole } from '@/types/group'

/**
 * Penjaga halaman panel.
 *
 * `requireSuperAdmin` dipakai halaman yang mengubah konten permainan — sesuai
 * BRD Bab 4, panitia lapangan hanya bertugas memvalidasi unggahan.
 *
 * `roles` dipakai halaman yang bukan urusan panitia lapangan sama sekali:
 * layar pos, yang milik penjaga pos.
 */
export default function AdminGate({
  children,
  requireSuperAdmin = false,
  roles,
}: {
  children: React.ReactNode
  requireSuperAdmin?: boolean
  roles?: UserRole[]
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
  const allowed: UserRole[] = roles ?? (requireSuperAdmin ? ['SUPER_ADMIN'] : ['ADMIN', 'SUPER_ADMIN'])
  const isPanitia =
    profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN' || profile?.role === 'POST_GUARD'
  const isAllowed = !!profile && allowed.includes(profile.role)

  // Penjaga pos hanya punya satu layar; mengembalikannya ke Validasi yang tidak
  // bisa ia buka hanya akan memantulkannya bolak-balik.
  const fallbackHref = profile?.role === 'POST_GUARD' ? '/admin/post' : '/admin/validation'

  if (!isAllowed) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
        <h1 className="font-display text-3xl text-ink">Akses Ditolak</h1>
        <p className="max-w-sm text-sm text-ink/60">
          {profile?.role === 'POST_GUARD'
            ? 'Akunmu ditugaskan menjaga pos. Layar pos adalah satu-satunya halaman panel yang kamu perlukan.'
            : isPanitia
              ? 'Halaman ini hanya untuk Super Admin. Hubungi penanggung jawab teknis acara bila kamu perlu mengubah konten permainan.'
              : 'Halaman ini hanya untuk panitia. Akunmu tidak punya akses.'}
        </p>
        <Link
          href={isPanitia ? fallbackHref : '/race'}
          className="rounded-md border-brut bg-primary px-5 py-3 font-display uppercase text-primary-ink shadow-brutal brutal-press"
        >
          {!isPanitia
            ? 'Kembali ke Race'
            : profile?.role === 'POST_GUARD'
              ? 'Ke Layar Pos'
              : 'Ke Validasi'}
        </Link>
      </div>
    )
  }

  return <>{children}</>
}

'use client'

import Link from 'next/link'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import { useProfileQuery } from '@/hooks/use-profile'

const ALLOWED_ROLES = ['ADMIN', 'SUPER_ADMIN']

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const profileQuery = useProfileQuery()

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4">
        <CardSkeleton className="w-full max-w-xl" />
      </div>
    )
  }

  const profile = profileQuery.data

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
        <h1 className="font-display text-3xl text-ink">Akses Ditolak</h1>
        <p className="max-w-sm text-sm text-ink/60">
          Halaman ini hanya untuk panitia (admin). Akunmu tidak punya akses.
        </p>
        <Link
          href="/race"
          className="rounded-md border-brut bg-primary px-5 py-3 font-display uppercase text-primary-ink shadow-brutal brutal-press"
        >
          Kembali ke Race
        </Link>
      </div>
    )
  }

  return <>{children}</>
}

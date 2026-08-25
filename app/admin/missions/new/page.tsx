'use client'

import Link from 'next/link'
import AdminPageShell from '@/components/fragments/AdminPageShell'
import MissionForm from '@/components/organisms/admin/MissionForm'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import { useMissionsQuery } from '@/hooks/use-missions'

export default function AdminNewMissionPage() {
  // Daftar misi yang sudah ada dipakai untuk memilih misi prasyarat.
  const missionsQuery = useMissionsQuery()

  return (
    <AdminPageShell
      requireSuperAdmin
      title="Buat Misi Baru"
      description="Satu layar penuh untuk menyusun misi, tanpa daftar misi yang ikut bergulir di sebelahnya."
      width="lg"
    >
      <Link
        href="/admin/missions"
        className="font-mono text-xs uppercase tracking-widest text-secondary"
      >
        ← Kembali ke daftar misi
      </Link>

      <div className="mt-4">
        {missionsQuery.isLoading ? (
          <CardSkeleton />
        ) : (
          <MissionForm existingMissions={missionsQuery.data ?? []} />
        )}
      </div>
    </AdminPageShell>
  )
}

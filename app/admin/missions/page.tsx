'use client'

import Link from 'next/link'
import AdminGate from '@/components/fragments/AdminGate'
import MissionForm from '@/components/organisms/admin/MissionForm'
import MissionList from '@/components/organisms/admin/MissionList'
import { useMissionsQuery } from '@/hooks/use-missions'

export default function AdminMissionsPage() {
  const missionsQuery = useMissionsQuery()

  return (
    <AdminGate>
      <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">Panel Panitia</p>
              <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Kelola Misi</h1>
            </div>
            <Link
              href="/admin/validation"
              className="rounded-md border-brut-sm bg-secondary px-4 py-2 font-display text-xs uppercase text-secondary-ink shadow-brutal-sm brutal-press-sm"
            >
              Validasi Submission
            </Link>
          </div>
          <p className="mt-2 text-sm text-ink/60">
            Buat & pantau misi Tantangan, Bigger Better, dan Soal Lokasi untuk peserta.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <MissionForm existingMissions={missionsQuery.data ?? []} />
            <MissionList />
          </div>
        </div>
      </div>
    </AdminGate>
  )
}

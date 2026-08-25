'use client'

import Link from 'next/link'
import AdminPageShell from '@/components/fragments/AdminPageShell'
import MissionList from '@/components/organisms/admin/MissionList'

/**
 * Daftar misi berdiri sendiri, terpisah dari form pembuatannya.
 *
 * Sebelumnya keduanya berbagi satu layar berkolom dua: form sepanjang tiga
 * layar di kiri, daftar berisi puluhan misi di kanan, dan keduanya bergulir
 * bersamaan. Memeriksa satu misi berarti kehilangan tempat di form, dan
 * sebaliknya.
 */
export default function AdminMissionsPage() {
  return (
    <AdminPageShell
      requireSuperAdmin
      title="Kelola Misi"
      description="Daftar seluruh misi Tantangan, Bigger Better, Soal Lokasi, dan Kuis untuk peserta."
    >
      <div className="mb-6">
        <Link
          href="/admin/missions/new"
          className="inline-flex rounded-md border-brut bg-primary px-5 py-3 font-display text-sm uppercase text-primary-ink shadow-brutal brutal-press"
        >
          + Buat Misi Baru
        </Link>
      </div>

      <MissionList />
    </AdminPageShell>
  )
}

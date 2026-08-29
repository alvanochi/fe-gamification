'use client'

import Link from 'next/link'
import { use } from 'react'
import AdminPageShell from '@/components/fragments/AdminPageShell'
import MissionForm from '@/components/organisms/admin/MissionForm'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import { useMissionsQuery } from '@/hooks/use-missions'

export default function AdminEditMissionPage({
  params,
}: {
  params: Promise<{ missionId: string }>
}) {
  const { missionId } = use(params)

  // Satu permintaan untuk dua keperluan: misi yang disunting, dan daftar misi
  // lain sebagai pilihan prasyarat. Daftarnya sudah tersimpan di cache dari
  // halaman Kelola Misi, jadi berpindah ke sini tidak menunggu apa pun.
  const missionsQuery = useMissionsQuery()
  const mission = missionsQuery.data?.find(m => m.id === missionId)

  return (
    <AdminPageShell
      requireSuperAdmin
      title="Sunting Misi"
      description="Seluruh isi misi bisa diubah di sini. Soal kuis punya layarnya sendiri di daftar misi."
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
        ) : !mission ? (
          <p className="rounded-md border-brut !border-danger bg-paper-raised p-4 text-sm font-bold text-danger">
            Misi tidak ditemukan. Mungkin sudah dihapus panitia lain.
          </p>
        ) : (
          <MissionForm
            // Form menyusun isian awalnya sekali saat dipasang. Tanpa key ini,
            // berpindah dari satu misi ke misi lain akan menyisakan isian misi
            // sebelumnya di layar.
            key={mission.id}
            mission={mission}
            existingMissions={(missionsQuery.data ?? []).filter(m => m.id !== mission.id)}
          />
        )}
      </div>
    </AdminPageShell>
  )
}

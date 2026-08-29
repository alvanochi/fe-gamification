'use client'

import AdminPageShell from '@/components/fragments/AdminPageShell'
import FinalScoreBoard from '@/components/organisms/admin/FinalScoreBoard'

export default function AdminFinalScorePage() {
  return (
    <AdminPageShell
      title="Nilai Akhir"
      description="Poin sistem digabung dengan data media sosial dari pihak eksternal. Ketuk satu kelompok untuk melihat asal-usul angkanya."
      width="lg"
    >
      <FinalScoreBoard />
    </AdminPageShell>
  )
}

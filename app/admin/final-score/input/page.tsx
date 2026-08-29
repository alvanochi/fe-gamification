'use client'

import Link from 'next/link'
import AdminPageShell from '@/components/fragments/AdminPageShell'
import ManualScoreForm from '@/components/organisms/admin/ManualScoreForm'

export default function AdminManualScorePage() {
  return (
    <AdminPageShell
      requireSuperAdmin
      title="Input Nilai Media Sosial"
      description="Cadangan bila pihak pemantau tidak mengirim datanya lewat API. Nilai akhir tidak boleh bergantung pada integrasi yang mungkin tidak pernah jadi."
      width="lg"
    >
      <Link
        href="/admin/final-score"
        className="font-mono text-xs uppercase tracking-widest text-secondary"
      >
        ← Kembali ke nilai akhir
      </Link>

      <div className="mt-4">
        <ManualScoreForm />
      </div>
    </AdminPageShell>
  )
}

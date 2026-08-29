'use client'

import AdminPageShell from '@/components/fragments/AdminPageShell'
import ManualSubmissionForm from '@/components/organisms/admin/ManualSubmissionForm'

export default function AdminManualSubmissionPage() {
  return (
    <AdminPageShell
      requireSuperAdmin
      title="Kirim Bukti Manual"
      description="Mengirim bukti misi atas nama peserta, untuk kelompok yang kehilangan kesempatannya karena kendala di luar permainan. Seluruh batas waktu dan syarat check-in dilewati di sini."
      width="lg"
    >
      <ManualSubmissionForm />
    </AdminPageShell>
  )
}

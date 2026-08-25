'use client'

import AdminPageShell from '@/components/fragments/AdminPageShell'
import ValidationQueue from '@/components/organisms/admin/ValidationQueue'

export default function AdminValidationPage() {
  return (
    <AdminPageShell
      title="Validasi Submission"
      description="Setujui atau tolak bukti misi yang dikirim peserta. Halaman ini otomatis diperbarui tiap 5 detik."
      width="lg"
    >
      <ValidationQueue />
    </AdminPageShell>
  )
}

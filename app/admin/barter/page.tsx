'use client'

import AdminPageShell from '@/components/fragments/AdminPageShell'
import BarterQueue from '@/components/organisms/admin/BarterQueue'

export default function AdminBarterPage() {
  return (
    <AdminPageShell
      title="Validasi Barter"
      description="Kelompok tidak bisa menukar lagi sebelum pertukaran terakhirnya divalidasi."
      width="md"
    >
      <BarterQueue />
    </AdminPageShell>
  )
}

'use client'

import AdminPageShell from '@/components/fragments/AdminPageShell'
import SponsorManager from '@/components/organisms/admin/SponsorManager'

export default function AdminSponsorsPage() {
  return (
    <AdminPageShell
      requireSuperAdmin
      title="Kelola Sponsor"
      description="Logo sponsor tampil di seksi sponsor beranda, halaman kelompok, dan sebagai penanda pada misi yang ditautkan ke sponsor tersebut."
    >
      <SponsorManager />
    </AdminPageShell>
  )
}

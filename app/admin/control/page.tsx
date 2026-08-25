'use client'

import AdminPageShell from '@/components/fragments/AdminPageShell'
import EventControlPanel from '@/components/organisms/admin/EventControlPanel'

export default function AdminControlPage() {
  return (
    <AdminPageShell
      title="Kendali Acara"
      description="Mulai permainan, kirim pengumuman, dan atur batas waktu serta poin."
      width="lg"
    >
      <EventControlPanel />
    </AdminPageShell>
  )
}

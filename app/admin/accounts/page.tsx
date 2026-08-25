'use client'

import AdminPageShell from '@/components/fragments/AdminPageShell'
import AccountManager from '@/components/organisms/admin/AccountManager'

export default function AdminAccountsPage() {
  return (
    <AdminPageShell
      requireSuperAdmin
      title="Akun & Kelompok"
      description="Semua akun acara ini dalam satu daftar. Buat satu per satu atau unggah dari lembar kerja, lalu pilih beberapa sekaligus untuk mencetak kartu QR, menyusun kelompok, atau menghapusnya."
      width="lg"
    >
      <AccountManager />
    </AdminPageShell>
  )
}

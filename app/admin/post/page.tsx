'use client'

import AdminPageShell from '@/components/fragments/AdminPageShell'
import PostGuardScanner from '@/components/organisms/admin/PostGuardScanner'

export default function AdminPostGuardPage() {
  return (
    <AdminPageShell
      title="Pos"
      description="Pilih pos yang kamu jaga, lalu pindai QR peserta. Kelompoknya langsung muncul di daftar di bawah, siap diberi nilai di tempat — tanpa berpindah halaman atau mencari namanya sendiri."
      width="lg"
    >
      <PostGuardScanner />
    </AdminPageShell>
  )
}

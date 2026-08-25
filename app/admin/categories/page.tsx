'use client'

import Link from 'next/link'
import AdminPageShell from '@/components/fragments/AdminPageShell'
// Fitur kategori kelompok sedang dinonaktifkan di seluruh aplikasi: kelompok
// berlomba tanpa dipecah rombongan, jadi warnanya hanya menambah satu hal lagi
// yang harus diurus panitia sebelum acara. Panel aslinya dibiarkan utuh —
// menghidupkannya kembali cukup dengan membuka komentar di bawah ini dan
// mengembalikan tautannya di AdminNav.
// import CategoryManager from '@/components/organisms/admin/CategoryManager'

export default function AdminCategoriesPage() {
  return (
    <AdminPageShell requireSuperAdmin title="Kategori Kelompok" width="lg">
      <div className="rounded-lg border-brut bg-paper-raised p-6 text-sm text-ink/70">
        <p className="font-bold text-ink">Fitur kategori sedang dinonaktifkan.</p>
        <p className="mt-2">
          Kelompok berlomba tanpa dibagi rombongan, jadi kategori tidak lagi tampil di layar
          peserta, pemantauan, maupun lembar kerja.
        </p>
        <Link
          href="/admin/monitoring"
          className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-secondary underline"
        >
          Ke Monitoring →
        </Link>
      </div>

      {/* <CategoryManager /> */}
    </AdminPageShell>
  )
}

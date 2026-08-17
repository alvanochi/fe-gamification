'use client'

import AdminGate from '@/components/fragments/AdminGate'
import AdminNav from '@/components/fragments/AdminNav'
import CategoryManager from '@/components/organisms/admin/CategoryManager'

export default function AdminCategoriesPage() {
  return (
    <AdminGate requireSuperAdmin>
      <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
                Panel Panitia
              </p>
              <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Kategori Kelompok</h1>
            </div>
            <AdminNav />
          </div>
          <p className="mt-2 text-sm text-ink/60">
            Pecah peserta jadi beberapa rombongan bila diperlukan. Warna kategori ikut tampil di
            layar peserta dan di pemantauan.
          </p>

          <div className="mt-8">
            <CategoryManager />
          </div>
        </div>
      </div>
    </AdminGate>
  )
}

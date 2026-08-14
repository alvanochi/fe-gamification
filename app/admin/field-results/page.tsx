'use client'

import AdminGate from '@/components/fragments/AdminGate'
import AdminNav from '@/components/fragments/AdminNav'
import FieldResultForm from '@/components/organisms/admin/FieldResultForm'

export default function AdminFieldResultsPage() {
  return (
    <AdminGate>
      <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
                Panel Panitia
              </p>
              <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Hasil Pos</h1>
            </div>
            <AdminNav />
          </div>
          <p className="mt-2 text-sm text-ink/60">
            Untuk misi yang dinilai langsung petugas di lokasi — jemparingan, biliar, pickleball,
            dan sejenisnya.
          </p>

          <div className="mt-8">
            <FieldResultForm />
          </div>
        </div>
      </div>
    </AdminGate>
  )
}

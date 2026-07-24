'use client'

import Link from 'next/link'
import AdminGate from '@/components/fragments/AdminGate'
import ValidationQueue from '@/components/organisms/admin/ValidationQueue'

export default function AdminValidationPage() {
  return (
    <AdminGate>
      <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">Panel Panitia</p>
              <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Validasi Submission</h1>
            </div>
            <Link
              href="/admin/missions"
              className="rounded-md border-brut-sm bg-secondary px-4 py-2 font-display text-xs uppercase text-secondary-ink shadow-brutal-sm brutal-press-sm"
            >
              Kelola Misi
            </Link>
          </div>
          <p className="mt-2 text-sm text-ink/60">
            Setujui atau tolak bukti misi yang dikirim peserta. Halaman ini otomatis diperbarui tiap 5 detik.
          </p>

          <div className="mt-8">
            <ValidationQueue />
          </div>
        </div>
      </div>
    </AdminGate>
  )
}

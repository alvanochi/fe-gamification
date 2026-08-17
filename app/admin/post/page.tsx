'use client'

import AdminGate from '@/components/fragments/AdminGate'
import AdminNav from '@/components/fragments/AdminNav'
import PostGuardScanner from '@/components/organisms/admin/PostGuardScanner'

export default function AdminPostGuardPage() {
  return (
    <AdminGate>
      <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
                Panel Panitia
              </p>
              <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Pos</h1>
            </div>
            <AdminNav />
          </div>
          <p className="mt-2 text-sm text-ink/60">
            Pilih pos yang kamu jaga, lalu pindai QR peserta. Kelompoknya langsung muncul di
            daftar di bawah, siap diberi nilai di tempat — tanpa berpindah halaman atau mencari
            namanya sendiri.
          </p>

          <div className="mt-8">
            <PostGuardScanner />
          </div>
        </div>
      </div>
    </AdminGate>
  )
}

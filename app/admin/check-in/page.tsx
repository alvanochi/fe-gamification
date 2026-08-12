'use client'

import AdminGate from '@/components/fragments/AdminGate'
import AdminNav from '@/components/fragments/AdminNav'
import QrScanner from '@/components/organisms/admin/QrScanner'

export default function AdminCheckInPage() {
  return (
    <AdminGate>
      <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
                Panel Panitia
              </p>
              <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Check-in Peserta</h1>
            </div>
            <AdminNav />
          </div>
          <p className="mt-2 text-sm text-ink/60">
            Pindai boarding pass QR peserta di meja registrasi. Kode dibaca langsung di perangkat
            ini — tidak ada gambar yang dikirim ke server.
          </p>

          <div className="mt-8">
            <QrScanner />
          </div>
        </div>
      </div>
    </AdminGate>
  )
}

'use client'

import AdminGate from '@/components/fragments/AdminGate'
import AdminNav from '@/components/fragments/AdminNav'
import QrCardSheet from '@/components/organisms/admin/QrCardSheet'

export default function AdminQrCardsPage() {
  return (
    <AdminGate>
      <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8 print:p-0">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
                Panel Panitia
              </p>
              <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Kartu QR Peserta</h1>
            </div>
            <AdminNav />
          </div>
          <p className="mt-2 text-sm text-ink/60 print:hidden">
            Cetak kartu ini sebelum acara, gunting per peserta, lalu bagikan di meja registrasi.
            Peserta memindainya untuk masuk, dan menunjukkannya lagi untuk check-in dan di setiap
            pos.
          </p>

          <div className="mt-8">
            <QrCardSheet />
          </div>
        </div>
      </div>
    </AdminGate>
  )
}

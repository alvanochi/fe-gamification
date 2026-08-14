'use client'

import AdminGate from '@/components/fragments/AdminGate'
import AdminNav from '@/components/fragments/AdminNav'
import AccountManager from '@/components/organisms/admin/AccountManager'

export default function AdminAccountsPage() {
  return (
    <AdminGate requireSuperAdmin>
      <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
                Panel Panitia
              </p>
              <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Kelola Akun</h1>
            </div>
            <AdminNav />
          </div>
          <p className="mt-2 text-sm text-ink/60">
            Angkat peserta menjadi panitia lapangan, atau cabut aksesnya kembali.
          </p>

          <div className="mt-8">
            <AccountManager />
          </div>
        </div>
      </div>
    </AdminGate>
  )
}

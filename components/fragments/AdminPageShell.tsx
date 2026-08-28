'use client'

import AdminGate from '@/components/fragments/AdminGate'
import AdminNav from '@/components/fragments/AdminNav'
import type { UserRole } from '@/types/group'

interface AdminPageShellProps {
  title: string
  description?: React.ReactNode
  /** Halaman yang mengubah konten permainan (BRD Bab 4). */
  requireSuperAdmin?: boolean
  /** Daftar peran yang boleh membuka halaman ini, bila bukan aturan bawaan. */
  roles?: UserRole[]
  /** Lebar isi; menyesuaikan padatnya tabel di tiap halaman. */
  width?: 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const WIDTH_CLASS = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
} as const

/**
 * Kerangka halaman panel panitia.
 *
 * Kepala halaman — penjaga akses, judul, navigasi antarpanel — sebelumnya
 * disalin utuh di sembilan halaman, sehingga menambah satu menu berarti
 * menyunting sembilan berkas dan berharap tidak ada yang terlewat.
 */
export default function AdminPageShell({
  title,
  description,
  requireSuperAdmin = false,
  roles,
  width = 'xl',
  children,
}: AdminPageShellProps) {
  return (
    <AdminGate requireSuperAdmin={requireSuperAdmin} roles={roles}>
      <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
        <div className={`mx-auto ${WIDTH_CLASS[width]}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
                Panel Panitia
              </p>
              <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{title}</h1>
            </div>
            <AdminNav />
          </div>
          {description && <p className="mt-2 text-sm text-ink/60">{description}</p>}

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </AdminGate>
  )
}

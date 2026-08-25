'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/fragments/LogoutButton'
import { useProfileQuery } from '@/hooks/use-profile'
import { usePendingCountsQuery } from '@/hooks/use-submissions'

/**
 * `superOnly` menandai halaman yang mengubah konten permainan (BRD Bab 4).
 *
 * `badge` menunjuk ke angka antrean yang relevan bagi menu itu — lihat
 * komentar di bawah.
 *
 * Menu Kategori disembunyikan bersama seluruh fitur kategori kelompok —
 * masternya masih ada di /admin/categories bila suatu saat dinyalakan lagi.
 */
const LINKS: Array<{
  href: string
  label: string
  superOnly?: boolean
  badge?: 'submissions' | 'barterSteps'
}> = [
  { href: '/admin/control', label: 'Kendali Acara' },
  { href: '/admin/monitoring', label: 'Monitoring' },
  { href: '/admin/validation', label: 'Validasi', badge: 'submissions' },
  { href: '/admin/post', label: 'Pos' },
  { href: '/admin/barter', label: 'Barter', badge: 'barterSteps' },
  { href: '/admin/missions', label: 'Kelola Misi', superOnly: true },
  // { href: '/admin/categories', label: 'Kategori', superOnly: true },
  { href: '/admin/sponsors', label: 'Sponsor', superOnly: true },
  // Master akun & kelompok memegang identitas seluruh peserta, jadi ia
  // sepenuhnya milik Super Admin — termasuk membacanya.
  { href: '/admin/accounts', label: 'Akun & Kelompok', superOnly: true },
  { href: '/leaderboard', label: 'Klasemen' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const { data: profile } = useProfileQuery()
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN'
  const isPanitia = profile?.role === 'ADMIN' || isSuperAdmin

  /**
   * Lencana angka: berapa bukti dan pertukaran yang menunggu diperiksa.
   *
   * Tanpa ini panitia harus membuka halaman validasi untuk tahu apakah ada
   * pekerjaan — dan bukti yang masuk selagi mereka berada di layar lain tidak
   * memberi tanda apa pun, padahal kelompok yang mengirimnya sedang menunggu
   * di lapangan.
   */
  const { data: counts } = usePendingCountsQuery(!!isPanitia)

  // Menu yang tidak bisa dibuka panitia lapangan disembunyikan, bukan
  // ditampilkan lalu ditolak saat diklik.
  const links = LINKS.filter(link => !link.superOnly || isSuperAdmin)

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map(link => {
        const isActive = pathname === link.href
        const pending = link.badge ? (counts?.[link.badge] ?? 0) : 0

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`relative rounded-md border-brut-sm px-4 py-2 font-display text-xs uppercase shadow-brutal-sm brutal-press-sm ${
              isActive ? 'bg-primary text-primary-ink' : 'bg-secondary text-secondary-ink'
            }`}
          >
            {link.label}
            {pending > 0 && (
              <span
                aria-label={`${pending} menunggu`}
                className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-brut-sm bg-danger px-1 font-mono text-[10px] font-bold text-white"
              >
                {pending > 99 ? '99+' : pending}
              </span>
            )}
          </Link>
        )
      })}
      <LogoutButton />
    </nav>
  )
}

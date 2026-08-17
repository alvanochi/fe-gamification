'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/fragments/LogoutButton'
import { useProfileQuery } from '@/hooks/use-profile'

/** `superOnly` menandai halaman yang mengubah konten permainan (BRD Bab 4). */
const LINKS = [
  { href: '/admin/control', label: 'Kendali Acara' },
  { href: '/admin/monitoring', label: 'Monitoring' },
  { href: '/admin/validation', label: 'Validasi' },
  { href: '/admin/check-in', label: 'Check-in QR' },
  { href: '/admin/post', label: 'Jaga Pos' },
  { href: '/admin/field-results', label: 'Hasil Pos' },
  { href: '/admin/barter', label: 'Barter' },
  { href: '/admin/missions', label: 'Kelola Misi', superOnly: true },
  { href: '/admin/categories', label: 'Kategori', superOnly: true },
  { href: '/admin/sponsors', label: 'Sponsor', superOnly: true },
  { href: '/admin/accounts', label: 'Akun & Kartu QR' },
  { href: '/leaderboard', label: 'Klasemen' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const { data: profile } = useProfileQuery()
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN'

  // Menu yang tidak bisa dibuka panitia lapangan disembunyikan, bukan
  // ditampilkan lalu ditolak saat diklik.
  const links = LINKS.filter(link => !link.superOnly || isSuperAdmin)

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map(link => {
        const isActive = pathname === link.href

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-md border-brut-sm px-4 py-2 font-display text-xs uppercase shadow-brutal-sm brutal-press-sm ${
              isActive ? 'bg-primary text-primary-ink' : 'bg-secondary text-secondary-ink'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
      <LogoutButton />
    </nav>
  )
}

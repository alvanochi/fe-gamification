'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/fragments/LogoutButton'

const LINKS = [
  { href: '/admin/missions', label: 'Kelola Misi' },
  { href: '/admin/validation', label: 'Validasi' },
  { href: '/admin/sponsors', label: 'Sponsor' },
  { href: '/admin/check-in', label: 'Check-in QR' },
  { href: '/leaderboard', label: 'Klasemen' },
]

/** Navigasi antar halaman panel panitia, dipakai semua halaman /admin. */
export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map(link => {
        const isActive = pathname === link.href

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-md border-brut-sm px-4 py-2 font-display text-xs uppercase shadow-brutal-sm brutal-press-sm ${
              isActive
                ? 'bg-primary text-primary-ink'
                : 'bg-secondary text-secondary-ink'
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

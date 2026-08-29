'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/fragments/LogoutButton'
import { useProfileQuery } from '@/hooks/use-profile'
import { usePendingCountsQuery } from '@/hooks/use-submissions'
import type { UserRole } from '@/types/group'

/**
 * `superOnly` menandai halaman yang mengubah konten permainan (BRD Bab 4).
 *
 * `badge` menunjuk ke angka antrean yang relevan bagi menu itu — lihat
 * komentar di bawah.
 *
 * Menu Kategori disembunyikan bersama seluruh fitur kategori kelompok —
 * masternya masih ada di /admin/categories bila suatu saat dinyalakan lagi.
 */
const PANITIA: UserRole[] = ['ADMIN', 'SUPER_ADMIN']
const SUPER: UserRole[] = ['SUPER_ADMIN']
/** Layar pos milik penjaga pos; Super Admin ikut agar bisa menggantikan. */
const POST: UserRole[] = ['POST_GUARD', 'SUPER_ADMIN']

const LINKS: Array<{
  href: string
  label: string
  roles: UserRole[]
  badge?: 'submissions' | 'barterSteps'
}> = [
  { href: '/admin/control', label: 'Kendali Acara', roles: PANITIA },
  { href: '/admin/monitoring', label: 'Monitoring', roles: PANITIA },
  { href: '/admin/validation', label: 'Validasi', roles: PANITIA, badge: 'submissions' },
  { href: '/admin/post', label: 'Pos', roles: POST },
  { href: '/admin/barter', label: 'Barter', roles: PANITIA, badge: 'barterSteps' },
  { href: '/admin/missions', label: 'Kelola Misi', roles: SUPER },
  // { href: '/admin/categories', label: 'Kategori', roles: SUPER },
  { href: '/admin/sponsors', label: 'Sponsor', roles: SUPER },
  // Master akun & kelompok memegang identitas seluruh peserta, jadi ia
  // sepenuhnya milik Super Admin — termasuk membacanya.
  { href: '/admin/accounts', label: 'Akun & Kelompok', roles: SUPER },
  // Nilai akhir menggabungkan poin sistem dengan data media sosial dari pihak
  // luar; seluruh panitia boleh membacanya, tidak ada yang bisa diubah dari sana.
  { href: '/admin/final-score', label: 'Nilai Akhir', roles: PANITIA },
  // Jalur pemulihan: mengirim bukti atas nama peserta yang kehilangan
  // kesempatannya karena sesuatu di luar kendali mereka.
  { href: '/admin/submissions/new', label: 'Kirim Bukti', roles: SUPER },
  { href: '/leaderboard', label: 'Klasemen', roles: [...PANITIA, 'POST_GUARD'] },
]

export default function AdminNav() {
  const pathname = usePathname()
  const { data: profile } = useProfileQuery()
  const role = profile?.role

  /**
   * Lencana angka: berapa bukti dan pertukaran yang menunggu diperiksa.
   *
   * Tanpa ini panitia harus membuka halaman validasi untuk tahu apakah ada
   * pekerjaan — dan bukti yang masuk selagi mereka berada di layar lain tidak
   * memberi tanda apa pun, padahal kelompok yang mengirimnya sedang menunggu
   * di lapangan.
   */
  // Penjaga pos tidak punya akses ke antrean validasi, jadi angkanya pun tidak
  // perlu diambil dari server.
  const { data: counts } = usePendingCountsQuery(role === 'ADMIN' || role === 'SUPER_ADMIN')

  // Menu yang tidak bisa dibuka perannya disembunyikan, bukan ditampilkan lalu
  // ditolak saat diklik.
  const links = LINKS.filter(link => !!role && link.roles.includes(role))

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

'use client'

import { FiShare2 } from 'react-icons/fi'

/**
 * Pintu kembali ke Checkpoint 0 dari tengah perlombaan.
 *
 * Profil usaha ditanyakan sekali di awal, saat peserta masih duduk menunggu.
 * Yang melewatinya waktu itu — atau salah mengetik nama akunnya — tidak punya
 * jalan untuk membetulkannya sendiri: gerbangnya hanya muncul selagi
 * `socialProfileAt` masih kosong, dan begitu terisi ia tertutup selamanya.
 * Satu-satunya obatnya adalah meminta panitia mengubahkannya dari panel akun.
 *
 * Menempel di pojok kanan bawah, berseberangan dengan tombol keluar di kiri
 * atas: dua tindakan yang sama-sama harus selalu terjangkau, dan sama-sama
 * tidak boleh tertukar dengan yang lain.
 */
export default function SocialProfileButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Isi atau ubah akun media sosialmu"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md border-brut bg-primary px-4 py-3 font-display text-xs uppercase text-primary-ink shadow-brutal brutal-press-sm"
    >
      <FiShare2 aria-hidden className="h-4 w-4" />
      Akun Sosmed
    </button>
  )
}

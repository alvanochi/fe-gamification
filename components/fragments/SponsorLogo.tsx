'use client'

import { useState } from 'react'

/**
 * Logo sponsor beserta jaring pengamannya.
 *
 * Dua hal yang sebelumnya merusak tampilan. Pertama, logo yang gagal dimuat —
 * mis. berkas lama yang alamatnya sudah tidak berlaku — menyisakan ikon gambar
 * rusak bawaan peramban, yang jauh lebih buruk daripada sekadar menuliskan
 * nama sponsornya. Kedua, kebanyakan logo berupa PNG gelap beralas tembus
 * pandang; di mode gelap ia menghilang ke dalam latarnya. Karena itu alasnya
 * selalu putih, di tema mana pun.
 */
export default function SponsorLogo({
  src,
  name,
  className = '',
}: {
  src: string | null | undefined
  name: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <span
        className={`flex items-center justify-center px-2 text-center text-xs font-bold text-ink/70 ${className}`}
      >
        {name}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      title={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-contain ${className}`}
    />
  )
}

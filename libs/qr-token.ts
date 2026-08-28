/**
 * Isi QR peserta.
 *
 * Kartu cetak memuat URL, bukan token telanjang, supaya kamera bawaan ponsel
 * pun bisa membukanya — peserta tidak perlu diajari membuka halaman tertentu
 * lebih dulu. Pemindai di dalam aplikasi tetap menerima keduanya, karena QR
 * lama dan QR di layar peserta masih berisi token apa adanya.
 */

/**
 * Isi QR pos: pos yang dituju dan pemilik QR-nya sekaligus.
 *
 * Dengan misinya ikut tertulis, petugas tidak perlu memilih pos lebih dulu —
 * dan tidak bisa salah memilih, yang dulu mencatat kelompok di pos yang tidak
 * pernah mereka datangi.
 */
export const postQrPayload = (missionId: string, token: string) => `POS:${missionId}:${token}`

/** URL yang ditanam ke kartu cetak. */
export const qrLoginUrl = (token: string) => {
  // Di server (saat prerender) window tidak ada; kartu hanya digambar di
  // browser, jadi jalur ini cukup aman sebagai cadangan.
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  return `${origin}/auth/qr?t=${encodeURIComponent(token)}`
}

/**
 * Ambil isi QR apa adanya untuk dikirim ke server.
 *
 * Tiga bentuk yang mungkin terbaca kamera: QR pos ("POS:<misi>:<token>"), URL
 * dari kartu cetak, dan token telanjang dari QR lama. Yang pertama diteruskan
 * utuh — server yang memecahnya, karena di sanalah pos itu diverifikasi.
 */
export const extractToken = (raw: string): string | null => {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('POS:')) return trimmed

  try {
    const url = new URL(trimmed)
    return url.searchParams.get('t') ?? url.searchParams.get('token')
  } catch {
    // Bukan URL — anggap isinya token itu sendiri.
    return trimmed
  }
}

/**
 * Isi QR peserta.
 *
 * Kartu cetak memuat URL, bukan token telanjang, supaya kamera bawaan ponsel
 * pun bisa membukanya — peserta tidak perlu diajari membuka halaman tertentu
 * lebih dulu. Pemindai di dalam aplikasi tetap menerima keduanya, karena QR
 * lama dan QR di layar peserta masih berisi token apa adanya.
 */

/** URL yang ditanam ke kartu cetak. */
export const qrLoginUrl = (token: string) => {
  // Di server (saat prerender) window tidak ada; kartu hanya digambar di
  // browser, jadi jalur ini cukup aman sebagai cadangan.
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  return `${origin}/auth/qr?t=${encodeURIComponent(token)}`
}

/** Ambil token dari isi QR — baik berupa URL maupun token telanjang. */
export const extractToken = (raw: string): string | null => {
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    return url.searchParams.get('t') ?? url.searchParams.get('token')
  } catch {
    // Bukan URL — anggap isinya token itu sendiri.
    return trimmed
  }
}

/**
 * Mengunduh berkas dari API yang butuh sesi login.
 *
 * Tautan biasa tidak bisa dipakai: peramban tidak menyertakan header
 * Authorization pada navigasi <a href>, jadi server membalas 401 dan yang
 * tersimpan justru berkas berisi pesan galat. Berkasnya karena itu diambil
 * lewat fetch, lalu diserahkan ke peramban sebagai blob.
 */
export const downloadSheet = async (path: string, filename: string) => {
  const base = process.env.NEXT_PUBLIC_API_URL || '/api'
  const token = localStorage.getItem('accessToken')

  const headers: Record<string, string> = { 'ngrok-skip-browser-warning': 'true' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${base}${path}`, { headers })
  if (!res.ok) throw new Error('Gagal mengunduh berkas')

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

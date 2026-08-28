/**
 * Semua waktu ditampilkan dalam WIB.
 *
 * Acaranya berlangsung di Yogyakarta, tetapi pesertanya datang dari berbagai
 * kota — ponsel yang jamnya disetel WITA akan menampilkan jam sesi dan jam
 * kehadiran satu jam meleset dari papan yang mereka lihat di lapangan. Zona
 * penampilnya karena itu ditetapkan di sini, tidak diwariskan dari perangkat.
 */
const EVENT_TIME_ZONE = 'Asia/Jakarta'

export const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: EVENT_TIME_ZONE,
  }).format(new Date(dateString))

export const formatDateTime = (dateString: string): string =>
  new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: EVENT_TIME_ZONE,
  })

/**
 * Jam saja (HH.MM) — satu-satunya bagian yang berguna di layar panitia selama
 * acara berlangsung, karena semuanya terjadi pada hari yang sama.
 */
export const formatTime = (dateString: string | null | undefined) =>
  dateString
    ? new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: EVENT_TIME_ZONE,
      })
    : '—'

export const formatDateYMD = (dateString: string) => {
  const date = new Date(dateString)

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

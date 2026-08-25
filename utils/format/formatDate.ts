export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
  return new Intl.DateTimeFormat('id-ID', options).format(date)
}

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Jam saja (HH.MM) — satu-satunya bagian yang berguna di layar panitia selama
 * acara berlangsung, karena semuanya terjadi pada hari yang sama.
 */
export const formatTime = (dateString: string | null | undefined) =>
  dateString
    ? new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '—'

export const formatDateYMD = (dateString: string) => {
  const date = new Date(dateString)

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

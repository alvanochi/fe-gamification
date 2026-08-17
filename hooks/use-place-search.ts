import { useQuery } from '@tanstack/react-query'

export interface PlaceResult {
  id: string
  label: string
  lat: number
  lng: number
}

interface NominatimRow {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

/**
 * Pencarian nama tempat lewat Nominatim (OpenStreetMap).
 *
 * Dipakai panitia saat menentukan titik misi: mengetik "Tugu Yogyakarta" jauh
 * lebih cepat daripada menggeser peta mencari koordinatnya. Permintaannya
 * langsung dari browser panitia — bukan lewat server kita — dan hanya berjalan
 * setelah kata kuncinya cukup panjang, mengikuti aturan pemakaian layanan itu.
 */
export const usePlaceSearch = (query: string) => {
  const trimmed = query.trim()

  return useQuery({
    queryKey: ['place-search', trimmed],
    enabled: trimmed.length >= 3,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PlaceResult[]> => {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('q', trimmed)
      url.searchParams.set('format', 'json')
      url.searchParams.set('limit', '6')
      // Membatasi ke Indonesia memangkas hasil yang tidak relevan.
      url.searchParams.set('countrycodes', 'id')

      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error('Pencarian lokasi gagal')

      const rows = (await res.json()) as NominatimRow[]
      return rows.map(r => ({
        id: String(r.place_id),
        label: r.display_name,
        lat: Number(r.lat),
        lng: Number(r.lon),
      }))
    },
  })
}

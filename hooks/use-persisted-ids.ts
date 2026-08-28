'use client'

import { useState, useSyncExternalStore } from 'react'

// localStorage adalah sumber di luar React; dibaca lewat useSyncExternalStore
// supaya nilainya konsisten antara render server dan klien tanpa effect —
// pola yang sama dipakai AnnouncementPopup.
const noopSubscribe = () => () => {}

const parse = (raw: string | null): string[] => {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
  } catch {
    // Isi yang rusak (mis. sisa versi lama) tidak boleh membuat layarnya gagal
    // dirender — cukup dianggap belum ada pilihan.
    return []
  }
}

/**
 * Sekumpulan id pilihan yang bertahan di peramban ini.
 *
 * Dipakai untuk pembagian tugas yang melekat pada orangnya, bukan pada
 * datanya: panitia menentukan misi apa saja yang ia validasi sekali di awal
 * acara, lalu pilihannya tetap ada walau halaman dimuat ulang berkali-kali —
 * dan tidak ikut terbawa ke perangkat panitia lain.
 */
export const usePersistedIds = (storageKey: string) => {
  const read = () => (typeof window === 'undefined' ? null : localStorage.getItem(storageKey))
  const stored = useSyncExternalStore(noopSubscribe, read, () => null)

  // Bayangan lokal supaya perubahan terlihat seketika; useSyncExternalStore
  // sendiri tidak tahu kapan kita menulis ke localStorage.
  const [local, setLocal] = useState<string[] | null>(null)
  const ids = local ?? parse(stored)

  const save = (next: string[]) => {
    setLocal(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // Mode penyamaran menolak penyimpanan. Pilihannya tetap berlaku selama
      // tab ini terbuka; hanya tidak bertahan setelah ditutup.
    }
  }

  const toggle = (id: string) =>
    save(ids.includes(id) ? ids.filter(existing => existing !== id) : [...ids, id])

  return { ids, save, toggle, clear: () => save([]) }
}

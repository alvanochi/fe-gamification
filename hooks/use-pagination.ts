'use client'

import { useState } from 'react'

/** Semua daftar berhalaman di aplikasi ini mulai dari sepuluh baris. */
export const DEFAULT_PER_PAGE = 10

/**
 * Pemenggalan daftar yang sudah ada di memori.
 *
 * Dipakai layar yang menerima seluruh daftarnya sekaligus dari server (misi
 * peserta, antrean validasi). Nomor halaman dijepit saat render: hasil
 * penyaringan bisa menyusut sementara pembaca masih berada di halaman jauh,
 * dan layar yang tiba-tiba kosong terbaca sebagai kehilangan data.
 */
export const usePagination = <T,>(items: T[], perPageDefault = DEFAULT_PER_PAGE) => {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(perPageDefault)

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)

  return {
    page: safePage,
    perPage,
    total,
    totalPages,
    pageItems: items.slice((safePage - 1) * perPage, safePage * perPage),
    setPage,
    setPerPage,
    /** Dipanggil saat saringan berubah — daftarnya lain, jadi mulai dari awal. */
    resetPage: () => setPage(1),
  }
}

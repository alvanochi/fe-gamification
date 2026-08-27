'use client'

import { useSyncExternalStore } from 'react'

export interface ToastMessage {
  /** Membedakan kabar baik dari kabar yang perlu ditindaklanjuti. */
  tone: 'success' | 'danger' | 'info'
  icon: string
  title: string
  /** Baris tebal di bawah judul — biasanya nama misi atau nama pos. */
  subject?: string
  detail?: string
  /**
   * `toast` menempel di sudut layar; `modal` berdiri di tengah layar dengan
   * latar penuh. Yang kedua dipakai untuk kabar yang tidak boleh terlewat —
   * pemindaian di pos terjadi saat ponsel masih di tangan petugas, dan peserta
   * baru melihat layarnya beberapa detik kemudian.
   */
  display?: 'toast' | 'modal'
  /** Milidetik sebelum menutup sendiri. */
  duration?: number
}

/**
 * Kabar yang datang sendiri dari server, di luar React Query.
 *
 * Hasil validasi panitia dan pemindaian QR di pos sama-sama tiba lewat socket,
 * bukan lewat permintaan yang dikirim peserta — jadi keduanya disimpan di
 * penyimpanan kecil ini dan dibaca lewat useSyncExternalStore, bukan lewat
 * setState di dalam effect yang akan memicu render berantai tiap ada siaran.
 */
let current: ToastMessage | null = null
const listeners = new Set<() => void>()

const emit = () => listeners.forEach(l => l())

export const pushToast = (message: ToastMessage) => {
  current = message
  emit()
}

export const clearToast = () => {
  current = null
  emit()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => current
// Di server belum ada kejadian apa pun.
const getServerSnapshot = () => null

export const useLatestToast = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

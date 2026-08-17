'use client'

import { useSyncExternalStore } from 'react'

export interface ValidationEvent {
  submissionId: string
  missionId: string
  missionTitle: string
  status: 'APPROVED' | 'REJECTED'
  point: number | null
  rejectReason: string | null
}

/**
 * Kabar validasi terbaru dari panitia, di luar React Query.
 *
 * Ini bukan data yang diambil dari server melainkan kejadian yang datang
 * sendiri lewat socket, jadi disimpan di penyimpanan kecil sendiri dan dibaca
 * lewat useSyncExternalStore — bukan lewat setState di dalam effect, yang akan
 * membuat render berantai setiap kali ada siaran.
 */
let current: ValidationEvent | null = null
const listeners = new Set<() => void>()

const emit = () => listeners.forEach(l => l())

export const pushValidation = (event: ValidationEvent) => {
  current = event
  emit()
}

export const clearValidation = () => {
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

export const useLatestValidation = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

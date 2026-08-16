'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'

/**
 * Satu koneksi socket dipakai bersama seluruh halaman.
 *
 * Dibuat malas dan tidak pernah diputus selama tab terbuka — membuka koneksi
 * baru di tiap komponen akan memberatkan server saat 300 peserta online.
 */
let socket: Socket | null = null

const getSocket = () => {
  if (socket) return socket

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
  // NEXT_PUBLIC_API_URL menunjuk ke /api; socket.io menempel di akar domain.
  const origin = apiUrl.replace(/\/api\/?$/, '')

  socket = io(origin, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
  })
  return socket
}

/**
 * Berlangganan kejadian realtime dan menyegarkan query yang terpengaruh.
 *
 * `groupId` membuat perangkat ikut kanal kelompoknya, sehingga kejadian foto,
 * voting, dan ketua terpilih hanya sampai ke kelompok yang bersangkutan.
 */
export const useRealtime = (groupId?: string | null) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const s = getSocket()

    const refresh = (keys: string[][]) => () =>
      keys.forEach(key => queryClient.invalidateQueries({ queryKey: key }))

    const handlers: Array<[string, () => void]> = [
      ['leaderboard:changed', refresh([['leaderboard'], ['monitoring']])],
      ['missions:released', refresh([['settings'], ['missions']])],
      ['announcement', refresh([['settings']])],
      ['settings:updated', refresh([['settings']])],
      ['group:photo', refresh([['group', groupId ?? ''], ['profile']])],
      ['group:vote', refresh([['group', groupId ?? '']])],
      ['group:leader-elected', refresh([['group', groupId ?? '']])],
      ['group:revote', refresh([['group', groupId ?? '']])],
      ['group:updated', refresh([['group', groupId ?? '']])],
      ['barter:validated', refresh([['barter-steps'], ['my-assignments']])],
    ]

    handlers.forEach(([event, handler]) => s.on(event, handler))
    if (groupId) s.emit('group:join', groupId)

    return () => {
      handlers.forEach(([event, handler]) => s.off(event, handler))
      if (groupId) s.emit('group:leave', groupId)
    }
  }, [groupId, queryClient])
}

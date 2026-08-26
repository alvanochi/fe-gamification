'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { pushToast } from '@/hooks/use-toast-feed'

interface ValidationEvent {
  missionTitle: string
  status: 'APPROVED' | 'REJECTED'
  point: number | null
  rejectReason: string | null
}

/** Petugas pos memindai QR salah satu anggota — berlaku untuk seluruh kelompok. */
interface PostScanEvent {
  action: 'CHECK_IN' | 'CHECK_OUT'
  postName: string
  participantName: string
}

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
    extraHeaders: {
      'ngrok-skip-browser-warning': 'true'
    }
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

    // Panitia menyetujui atau menolak bukti: daftar misi, riwayat kiriman, dan
    // skor kelompok semuanya berubah — dan peserta perlu diberi tahu, bukan
    // hanya melihat angkanya bergeser diam-diam.
    const onValidated = (payload: ValidationEvent) => {
      queryClient.invalidateQueries({ queryKey: ['my-group-submissions'] })
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      queryClient.invalidateQueries({ queryKey: ['mission-board'] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId ?? ''] })

      const approved = payload.status === 'APPROVED'
      pushToast({
        tone: approved ? 'success' : 'danger',
        icon: approved ? '🎉' : '↩️',
        title: approved ? 'Bukti Diterima' : 'Bukti Dikembalikan',
        subject: payload.missionTitle,
        detail: approved
          ? payload.point != null
            ? `+${payload.point} poin`
            : undefined
          : payload.rejectReason ??
          'Panitia tidak menyertakan catatan. Perbaiki lalu kirim ulang.',
        // Penolakan diberi waktu lebih lama: ada alasan yang perlu dibaca.
        duration: approved ? 6000 : 12000,
      })
    }

    // Kedatangan dan kepergian di pos dicatat petugas, bukan peserta. Tanpa
    // kabar ini kelompok hanya melihat petugas menyorot ponselnya, lalu tidak
    // tahu apakah pemindaiannya berhasil.
    const onPostScanned = (payload: PostScanEvent) => {
      queryClient.invalidateQueries({ queryKey: ['mission-checkins'] })
      queryClient.invalidateQueries({ queryKey: ['mission-board'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })

      const arriving = payload.action === 'CHECK_IN'
      pushToast({
        tone: 'success',
        icon: arriving ? '📍' : '✅',
        title: arriving ? 'Berhasil Check-in' : 'Berhasil Check-out',
        subject: `Pos ${payload.postName}`,
        detail: `Dipindai dari QR ${payload.participantName}. Berlaku untuk seluruh kelompok.`,
      })
    }

    // Sebagian penangan menerima muatan, sebagian tidak — socket.io memanggil
    // keduanya dengan cara yang sama.
    const handlers: Array<[string, (...args: unknown[]) => void]> = [
      ['submission:validated', payload => onValidated(payload as ValidationEvent)],
      ['post:scanned', payload => onPostScanned(payload as PostScanEvent)],
      ['leaderboard:changed', refresh([['leaderboard'], ['monitoring']])],
      ['missions:released', refresh([['settings'], ['missions'], ['mission-board']])],
      ['announcement', refresh([['settings']])],
      ['settings:updated', refresh([['settings']])],
      ['group:photo', refresh([['group', groupId ?? ''], ['profile']])],
      ['group:vote', refresh([['group', groupId ?? '']])],
      ['group:leader-elected', refresh([['group', groupId ?? '']])],
      ['group:revote', refresh([['group', groupId ?? '']])],
      ['group:updated', refresh([['group', groupId ?? '']])],
      ['barter:validated', refresh([['barter-steps'], ['my-assignments'], ['mission-board']])],
    ]

    handlers.forEach(([event, handler]) => s.on(event, handler))
    if (groupId) s.emit('group:join', groupId)

    return () => {
      handlers.forEach(([event, handler]) => s.off(event, handler))
      if (groupId) s.emit('group:leave', groupId)
    }
  }, [groupId, queryClient])
}

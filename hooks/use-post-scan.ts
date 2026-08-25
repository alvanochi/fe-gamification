import { useMutation } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export interface PostScanPayload {
  qrToken: string
  missionId: string
  /** Dikosongkan berarti sistem yang menyimpulkan dari keadaan kelompok. */
  action?: 'CHECK_IN' | 'CHECK_OUT'
}

export interface PostScanResult {
  action: 'CHECK_IN' | 'CHECK_OUT'
  /** True bila arah datang/pergi disimpulkan sistem, bukan dipilih petugas. */
  inferred: boolean
  participantName: string
  groupId: string
  groupName: string | null
  missionTitle: string
}

/**
 * Petugas pos memindai QR peserta.
 *
 * Kelompok peserta ditemukan server dari token-nya, jadi petugas tidak perlu
 * tahu peserta itu dari kelompok mana — cukup arahkan kamera.
 */
export const usePostScanMutation = () => {
  return useMutation({
    mutationFn: (payload: PostScanPayload) =>
      http.post<IApiEnvelope<PostScanResult>, PostScanPayload>(endpoints.admin.postScan, payload),
  })
}

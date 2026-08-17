import { useQuery } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { ProofType, ScoringMode, SubmissionStatus } from '@/types/mission'

export interface PostQueueRow {
  checkInId: string
  groupId: string
  groupName: string
  groupScore: number
  queueNumber: string | null
  checkedInAt: string
  checkedOutAt: string | null
  /** Peserta yang QR-nya dipindai petugas. */
  scannedName: string | null
  resultStatus: SubmissionStatus | null
  awardedPoint: number | null
}

export interface PostQueue {
  mission: {
    id: string
    title: string
    locationName: string | null
    proofType: ProofType
    scoringMode: ScoringMode
    pointWeight: number
    pointMin: number | null
    pointMax: number | null
    pointPerUnit: number | null
    maxUnits: number | null
    timeTargetSeconds: number | null
  }
  active: PostQueueRow[]
  departed: PostQueueRow[]
}

/**
 * Kelompok yang sedang berada di satu pos.
 *
 * Disegarkan berkala karena petugas lain bisa memindai kelompok yang sama dari
 * perangkat berbeda — mis. satu orang memegang kamera, satu lagi menilai.
 */
export const usePostQueueQuery = (missionId: string) => {
  return useQuery({
    queryKey: ['post-queue', missionId],
    queryFn: async () =>
      (await http.get<IApiEnvelope<PostQueue>>(endpoints.admin.postQueue(missionId))).data,
    enabled: !!missionId,
    refetchInterval: 10_000,
  })
}

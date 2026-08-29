import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export const SOCIAL_PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE'] as const
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
}

export interface FinalScoreMember {
  /** Sasaran penyimpanan di layar input manual. */
  userId: string
  fullname: string
  /** Username per platform; string kosong berarti akunnya tidak didaftarkan. */
  accounts: Record<SocialPlatform, string>
  postCounts: Record<SocialPlatform, number>
  /** Jumlah ketiganya. */
  postCount: number
}

export interface FinalScoreGroup {
  groupId: string
  groupName: string
  rank: number

  /** Jumlah seluruh poin yang lahir di sistem ini. */
  systemPoint: number
  /** Jumlah postingan seluruh anggota, dikirim pihak eksternal. */
  postCount: number
  /** systemPoint + postCount, sebelum dibobot. */
  grossPoint: number
  /** Penilaian 1 setelah dikalikan 70%. */
  missionScore: number

  /** Nett likes & share apa adanya dari pihak eksternal. */
  externalNett: number
  /** Penilaian 2 sebagaimana dihitung server. */
  engagementScore: number

  finalScore: number

  /** null berarti angka itu belum pernah dikirim pihak eksternal. */
  postCountAt: string | null
  externalNettAt: string | null

  members: FinalScoreMember[]
}

export interface FinalScoreBoard {
  weights: { mission: number; engagement: number }
  groups: FinalScoreGroup[]
}

export const useFinalScoresQuery = () =>
  useQuery({
    queryKey: ['final-scores'],
    queryFn: async () =>
      (await http.get<IApiEnvelope<FinalScoreBoard>>(endpoints.admin.finalScores)).data,
    // Data media sosial datang berkala dari pihak luar, bukan detik ini juga.
    // Menyegarkan tiap 30 detik sudah membuat layarnya terasa hidup tanpa
    // membebani basis data menjelang pengumuman.
    refetchInterval: 30_000,
  })

export interface ManualScorePayload {
  groupId: string
  /** Dikosongkan berarti nett kelompok ini tidak diubah. */
  nett?: number
  members: Array<{ userId: string } & Record<SocialPlatform, number>>
}

/**
 * Menyimpan angka media sosial yang diketik panitia sendiri.
 *
 * Menulis ke kolom yang sama dengan jalur /api/external — tidak ada tempat
 * penyimpanan kedua, karena dua tempat untuk satu angka hanya melahirkan
 * pertanyaan mana yang benar.
 */
export const useSaveManualScoresMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ManualScorePayload) =>
      http.put<IApiEnvelope<{ groupId: string }>, ManualScorePayload>(
        endpoints.admin.finalScoresManual,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-scores'] })
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export interface ManualSubmissionPayload {
  userId: string
  missionId: string
  answerText?: string
  mediaUrls: string[]
  /** Melewati antrean validasi; butuh awardedPoint. */
  approve: boolean
  awardedPoint?: number
}

/**
 * Mengirim bukti misi atas nama peserta.
 *
 * Menyentuh tiga papan sekaligus — antrean validasi, monitoring, dan
 * klasemen — jadi ketiganya ditarik ulang begitu berhasil. Panitia lain yang
 * layarnya sedang terbuka tidak perlu menebak apakah datanya sudah masuk.
 */
export const useCreateManualSubmissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ManualSubmissionPayload) =>
      (
        await http.post<
          IApiEnvelope<{ submissionId: string; status: 'PENDING' | 'APPROVED' }>,
          ManualSubmissionPayload
        >(endpoints.admin.submissions, payload)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-submissions'] })
      queryClient.invalidateQueries({ queryKey: ['pending-counts'] })
      queryClient.invalidateQueries({ queryKey: ['monitoring'] })
      queryClient.invalidateQueries({ queryKey: ['monitoring-group'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}

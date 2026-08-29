import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export interface BarterQueueItem {
  id: string
  stepNo: number
  itemFrom: string
  itemTo: string
  partnerName: string | null
  mediaUrl: string | null
  createdAt: string
  groupId: string
  groupName: string
  missionTitle: string
  /** Rantai barter kelompok ini — sasaran tombol "Akhiri". */
  assignmentId: string
  /** Berapa pertukaran kelompok ini yang sudah disetujui sebelumnya. */
  approvedSteps: number
}

export const useBarterQueueQuery = () =>
  useQuery({
    queryKey: ['barter-queue'],
    queryFn: async () =>
      (await http.get<IApiEnvelope<BarterQueueItem[]>>(endpoints.admin.barterQueue)).data,
    refetchInterval: 5000,
  })

export const useValidateBarterStepMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { stepId: string; status: 'APPROVED' | 'REJECTED'; rejectReason?: string }) =>
      http.put<IApiEnvelope<{ point: number }>, { status: string; rejectReason?: string }>(
        endpoints.admin.validateBarterStep(vars.stepId),
        { status: vars.status, rejectReason: vars.rejectReason },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barter-queue'] })
      qc.invalidateQueries({ queryKey: ['leaderboard'] })
      qc.invalidateQueries({ queryKey: ['pending-counts'] })
      // Audit validasi ikut memperlihatkan rantai barter, jadi ia harus
      // menyusul berubah begitu satu rantai ditutup dari sana.
      qc.invalidateQueries({ queryKey: ['submission-history'] })
      qc.invalidateQueries({ queryKey: ['final-scores'] })
    },
  })
}

/**
 * Mengakhiri rantai barter satu kelompok dengan nilai akhir.
 *
 * Bigger Better tidak punya garis akhir alami — kelompok bisa terus menukar
 * sampai waktu habis. Panitialah yang menutupnya, dan setelah itu misinya
 * berhenti muncul sebagai tugas di layar kelompok tersebut.
 */
export const useFinishBarterMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { assignmentId: string; point: number }) =>
      http.post<IApiEnvelope<{ point: number }>, { point: number }>(
        endpoints.admin.finishBarter(vars.assignmentId),
        { point: vars.point },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barter-queue'] })
      qc.invalidateQueries({ queryKey: ['leaderboard'] })
      qc.invalidateQueries({ queryKey: ['pending-counts'] })
    },
  })
}

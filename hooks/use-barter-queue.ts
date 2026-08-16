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
    },
  })
}

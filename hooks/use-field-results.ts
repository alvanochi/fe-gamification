import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export interface AdminGroup {
  id: string
  name: string
  score: number
}

export interface FieldResultPayload {
  groupId: string
  missionId: string
  units?: number
  timeSeconds?: number
  awardedPoint?: number
  note?: string
}

export const useAdminGroupsQuery = () => {
  return useQuery({
    queryKey: ['admin-groups'],
    queryFn: async () => (await http.get<IApiEnvelope<AdminGroup[]>>(endpoints.admin.groups)).data,
  })
}

export const useSubmitFieldResultMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: FieldResultPayload) =>
      http.post<IApiEnvelope<{ point: number }>, FieldResultPayload>(
        endpoints.admin.fieldResults,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}

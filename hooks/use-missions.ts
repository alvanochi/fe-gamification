import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { missionService } from '@/services/mission.service'

export const useMissionsQuery = () => {
  return useQuery({
    queryKey: ['missions'],
    queryFn: async () => (await missionService.list()).data,
  })
}

export const useCreateMissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: missionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { missionService } from '@/services/mission.service'
import { CreateMissionPayload } from '@/types/mission'

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

export const useUpdateMissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ missionId, ...payload }: { missionId: string } & Partial<CreateMissionPayload>) =>
      missionService.update(missionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export const useDeleteMissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (missionId: string) => missionService.remove(missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export const useMyCheckInsQuery = () => {
  return useQuery({
    queryKey: ['mission-checkins'],
    queryFn: async () => (await missionService.myCheckIns()).data,
  })
}

export const useCheckInMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ missionId, queueNumber }: { missionId: string; queueNumber?: string }) =>
      missionService.checkIn(missionId, queueNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-checkins'] })
    },
  })
}

export const useCheckOutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ missionId }: { missionId: string }) => missionService.checkOut(missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-checkins'] })
      queryClient.invalidateQueries({ queryKey: ['my-group-submissions'] })
    },
  })
}

import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { groupService } from '@/services/group.service'
import { Group, Confirmation } from '@/types/group'

type RefetchInterval<T> = UseQueryOptions<T>['refetchInterval']

export const useGroupQuery = (
  groupId: string | null | undefined,
  refetchInterval?: RefetchInterval<Group>,
) => {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => (await groupService.getById(groupId as string)).data,
    enabled: !!groupId,
    refetchInterval,
    refetchOnWindowFocus: true,
  })
}

export const useConfirmationsQuery = (
  groupId: string | null | undefined,
  refetchInterval?: RefetchInterval<Confirmation[]>,
) => {
  return useQuery({
    queryKey: ['group-confirmations', groupId],
    queryFn: async () => (await groupService.getConfirmations(groupId as string)).data,
    enabled: !!groupId,
    refetchInterval,
    refetchOnWindowFocus: true,
  })
}

export const useAutoGroupMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: groupService.autoGroup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      await queryClient.refetchQueries({ queryKey: ['profile'] })
    },
  })
}

export const useConfirmMemberMutation = (groupId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (targetUserId: string) => groupService.confirmMember(groupId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-confirmations', groupId] })
    },
  })
}

export const useGroupPhotoMutation = (groupId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => groupService.completePhoto(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
  })
}

export const useVoteLeaderMutation = (groupId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (nomineeId: string) => groupService.voteLeader(groupId, nomineeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
  })
}

export const useUpdateGroupNameMutation = (groupId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => groupService.updateName(groupId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
  })
}

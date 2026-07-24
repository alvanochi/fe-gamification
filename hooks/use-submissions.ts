import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { submissionService } from '@/services/submission.service'

export const useMyGroupSubmissionsQuery = () => {
  return useQuery({
    queryKey: ['my-group-submissions'],
    queryFn: async () => (await submissionService.myGroup()).data,
  })
}

export const useSubmitMissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submissionService.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-group-submissions'] })
    },
  })
}

export const usePendingSubmissionsQuery = () => {
  return useQuery({
    queryKey: ['pending-submissions'],
    queryFn: async () => (await submissionService.pending()).data,
    refetchInterval: 5000,
  })
}

export const useValidateSubmissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ submissionId, status }: { submissionId: string; status: 'APPROVED' | 'REJECTED' }) =>
      submissionService.validate(submissionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-submissions'] })
    },
  })
}

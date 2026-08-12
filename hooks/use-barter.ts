import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { Assignment, BarterStep, SubmitBarterStepPayload } from '@/types/mission'
import { submissionService } from '@/services/submission.service'

export const useMyAssignmentsQuery = () => {
  return useQuery({
    queryKey: ['my-assignments'],
    queryFn: async () =>
      (await http.get<IApiEnvelope<Assignment[]>>(endpoints.missions.myAssignments)).data,
  })
}

export const useBarterStepsQuery = (assignmentId?: string) => {
  return useQuery({
    queryKey: ['barter-steps', assignmentId],
    queryFn: async () =>
      (await http.get<IApiEnvelope<BarterStep[]>>(endpoints.submissions.barterSteps(assignmentId!)))
        .data,
    enabled: !!assignmentId,
  })
}

export const useCreateAssignmentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ missionId }: { missionId: string }) =>
      http.post<IApiEnvelope<{ assignmentId: string }>>(
        endpoints.missions.createAssignment(missionId),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] })
    },
  })
}

export const useSubmitBarterStepMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // Video langkah barter diunggah ke R2 lebih dulu, sama seperti bukti misi.
    mutationFn: async ({ file, ...payload }: Omit<SubmitBarterStepPayload, 'videoUrl'> & { file: File }) => {
      const videoUrl = await submissionService.uploadEvidence(file)
      return http.post<IApiEnvelope<{ id: string }>, SubmitBarterStepPayload>(
        endpoints.submissions.barterStep,
        { ...payload, videoUrl },
      )
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['barter-steps', variables.assignmentId] })
    },
  })
}

import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { PendingSubmission, Submission, SubmitMissionPayload } from '@/types/mission'

export const submissionService = {
  myGroup() {
    return http.get<IApiEnvelope<Submission[]>>(endpoints.submissions.myGroup)
  },

  pending() {
    return http.get<IApiEnvelope<PendingSubmission[]>>(endpoints.submissions.pending)
  },

  submit(payload: SubmitMissionPayload) {
    return http.post<IApiEnvelope<{ id: string }>, SubmitMissionPayload>(
      endpoints.submissions.submit,
      payload,
    )
  },

  validate(submissionId: string, status: 'APPROVED' | 'REJECTED') {
    return http.put<IApiEnvelope<null>, { status: 'APPROVED' | 'REJECTED' }>(
      endpoints.submissions.validate(submissionId),
      { status },
    )
  },
}

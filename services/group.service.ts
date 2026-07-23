import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { Confirmation, Group, VoteResult } from '@/types/group'

export const groupService = {
  autoGroup() {
    return http.post<IApiEnvelope<{ groupId: string }>>(endpoints.groups.autoGroup)
  },

  getById(groupId: string) {
    return http.get<IApiEnvelope<Group>>(endpoints.groups.getById(groupId))
  },

  getConfirmations(groupId: string) {
    return http.get<IApiEnvelope<Confirmation[]>>(endpoints.groups.confirmations(groupId))
  },

  confirmMember(groupId: string, targetUserId: string) {
    return http.post<IApiEnvelope<null>>(endpoints.groups.confirmMember(groupId, targetUserId))
  },

  completePhoto(groupId: string) {
    return http.post<IApiEnvelope<null>>(endpoints.groups.photo(groupId))
  },

  voteLeader(groupId: string, nomineeId: string) {
    return http.post<IApiEnvelope<VoteResult>>(endpoints.groups.voteLeader(groupId), { nomineeId })
  },

  updateName(groupId: string, name: string) {
    return http.put<IApiEnvelope<null>>(endpoints.groups.updateName(groupId), { name })
  },
}

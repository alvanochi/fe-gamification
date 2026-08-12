import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { Profile } from '@/types/group'

export interface QrCheckInResult {
  id: string
  fullname: string
  groupId: string | null
  checkInAt: string | null
  alreadyCheckedIn: boolean
}

export const userService = {
  getProfile() {
    return http.get<IApiEnvelope<Profile>>(endpoints.users.me)
  },

  checkInByQr(qrToken: string) {
    return http.post<IApiEnvelope<QrCheckInResult>, { qrToken: string }>(
      endpoints.users.checkInByQr,
      { qrToken },
    )
  },
}

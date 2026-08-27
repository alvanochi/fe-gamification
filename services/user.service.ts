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

/** Checkpoint 0 — dikirim saat peserta mengisi, maupun saat memilih melewati. */
export interface SocialProfilePayload {
  businessName?: string
  youtubeAccount?: string
  instagramAccount?: string
  tiktokAccount?: string
  skipped?: boolean
}

export const userService = {
  getProfile() {
    return http.get<IApiEnvelope<Profile>>(endpoints.users.me)
  },

  saveSocialProfile(payload: SocialProfilePayload) {
    return http.put<IApiEnvelope<{ id: string }>, SocialProfilePayload>(
      endpoints.users.socialProfile,
      payload,
    )
  },

  checkInByQr(qrToken: string) {
    return http.post<IApiEnvelope<QrCheckInResult>, { qrToken: string }>(
      endpoints.users.checkInByQr,
      { qrToken },
    )
  },
}

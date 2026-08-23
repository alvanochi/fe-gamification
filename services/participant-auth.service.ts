import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export interface ParticipantSuggestion {
  id: string
  fullname: string
  businessName: string | null
}

export const participantAuthService = {
  /** Cari nama peserta. Terbuka tanpa sesi — peserta belum punya sesi di sini. */
  search(q: string) {
    return http.get<IApiEnvelope<ParticipantSuggestion[]>>(endpoints.users.search, {
      params: { q },
    })
  },

  login(userId: string, phoneNumber: string) {
    return http.post<
      IApiEnvelope<{ accessToken: string; refreshToken: string }>,
      { userId: string; phoneNumber: string }
    >(endpoints.auth.loginParticipant, { userId, phoneNumber })
  },
}

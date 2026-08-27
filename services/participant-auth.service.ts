import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

/**
 * Dua pintu masuk lewat nama: peserta di kaki beranda, panitia di layar admin.
 *
 * Keduanya memakai alur yang sama karena persoalannya sama — baik peserta
 * maupun panitia didaftarkan orang lain, jadi tidak ada yang menghafal email
 * yang dipakaikan untuknya.
 */
export type LoginScope = 'PARTICIPANT' | 'PANITIA'

export interface LoginSuggestion {
  id: string
  fullname: string
  businessName: string | null
}

export const participantAuthService = {
  /** Cari nama. Terbuka tanpa sesi — yang mencari memang belum punya sesi. */
  search(q: string, scope: LoginScope = 'PARTICIPANT') {
    return http.get<IApiEnvelope<LoginSuggestion[]>>(endpoints.users.search, {
      params: { q, scope },
    })
  },

  login(userId: string, phoneNumber: string, scope: LoginScope = 'PARTICIPANT') {
    return http.post<
      IApiEnvelope<{ accessToken: string; refreshToken: string }>,
      { userId: string; phoneNumber: string }
    >(scope === 'PANITIA' ? endpoints.auth.loginPanitia : endpoints.auth.loginParticipant, {
      userId,
      phoneNumber,
    })
  },
}

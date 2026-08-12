import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { Sponsor, SponsorAdmin, SponsorPayload } from '@/types/sponsor'

export const sponsorService = {
  /** Daftar sponsor aktif, dipakai di sisi peserta. Tidak butuh sesi. */
  list() {
    return http.get<IApiEnvelope<Sponsor[]>>(endpoints.sponsors.list)
  },

  /** Daftar lengkap termasuk yang nonaktif — hanya untuk panel panitia. */
  listAll() {
    return http.get<IApiEnvelope<SponsorAdmin[]>>(endpoints.admin.banners)
  },

  create(payload: SponsorPayload) {
    return http.post<IApiEnvelope<SponsorAdmin>, SponsorPayload>(endpoints.admin.banners, payload)
  },

  update(id: string, payload: Partial<SponsorPayload>) {
    return http.put<IApiEnvelope<SponsorAdmin>, Partial<SponsorPayload>>(
      endpoints.admin.banner(id),
      payload,
    )
  },

  remove(id: string) {
    return http.delete<IApiEnvelope<null>>(endpoints.admin.banner(id))
  },
}

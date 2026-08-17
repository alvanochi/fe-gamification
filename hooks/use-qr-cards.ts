import { useQuery } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export interface ParticipantQrCard {
  id: string
  fullname: string
  email: string | null
  phoneNumber: string | null
  businessName: string | null
  qrToken: string | null
  checkInAt: string | null
  groupId: string | null
}

/**
 * Daftar peserta beserta token QR-nya, untuk dicetak sebelum acara.
 *
 * Token ini kredensial, jadi datanya tidak disimpan lama-lama di cache dan
 * tidak ikut disegarkan otomatis.
 */
export const useParticipantQrCardsQuery = (search: string) => {
  return useQuery({
    queryKey: ['participant-qr-cards', search],
    queryFn: async () =>
      (
        await http.get<IApiEnvelope<ParticipantQrCard[]>>(endpoints.admin.participantQrCards, {
          params: search ? { search } : undefined,
        })
      ).data,
    staleTime: 60_000,
  })
}

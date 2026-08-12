import { useMutation } from '@tanstack/react-query'
import { userService } from '@/services/user.service'

/** Check-in peserta oleh panitia lewat pemindaian QR (FR-01). */
export const useCheckInByQrMutation = () => {
  return useMutation({
    mutationFn: (qrToken: string) => userService.checkInByQr(qrToken),
  })
}

import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { RegisterPayload } from '@/schema/auth.schema'
import { ILoginResponse, IRegisterResponse } from '@/types/auth'

export const authService = {
  register(payload: RegisterPayload) {
    return http.post<IRegisterResponse, RegisterPayload>(endpoints.users.register, payload)
  },

  /** Tukar token QR cetak menjadi sesi. */
  loginByQr(qrToken: string) {
    return http.post<ILoginResponse, { qrToken: string }>(endpoints.auth.loginQr, { qrToken })
  },

  logout(refreshToken: string) {
    return http.delete<{ message: string }>(endpoints.auth.logout, {
      data: { refreshToken },
    })
  },
}

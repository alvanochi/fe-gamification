import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { LoginPayload, RegisterPayload } from '@/schema/auth.schema'
import { ILoginResponse, IRegisterResponse } from '@/types/auth'

export const authService = {
  login(payload: LoginPayload) {
    return http.post<ILoginResponse, LoginPayload>(endpoints.auth.login, payload)
  },

  register(payload: RegisterPayload) {
    return http.post<IRegisterResponse, RegisterPayload>(endpoints.users.register, payload)
  },

  logout(refreshToken: string) {
    return http.delete<{ message: string }>(endpoints.auth.logout, {
      data: { refreshToken },
    })
  },
}

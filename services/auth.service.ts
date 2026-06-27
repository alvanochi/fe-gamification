import { http } from '@/lib/api'
import { endpoints } from '@/lib/endpoints'
import { LoginPayload, RegisterPayload } from '@/schema/auth.schema'
import { ILoginResponse, IRegisterResponse } from '@/types/auth'

export const authService = {
  login(payload: LoginPayload) {
    return http.post<ILoginResponse, LoginPayload>(endpoints.auth.login, payload)
  },

  register(payload: RegisterPayload) {
    return http.post<IRegisterResponse, RegisterPayload>(endpoints.auth.register, payload)
  },
}

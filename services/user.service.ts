import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { Profile } from '@/types/group'

export const userService = {
  getProfile() {
    return http.get<IApiEnvelope<Profile>>(endpoints.users.me)
  },
}

import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { CreateMissionPayload, Mission } from '@/types/mission'

export const missionService = {
  list() {
    return http.get<IApiEnvelope<Mission[]>>(endpoints.missions.list)
  },

  create(payload: CreateMissionPayload) {
    return http.post<IApiEnvelope<{ id: string }>, CreateMissionPayload>(
      endpoints.missions.list,
      payload,
    )
  },
}

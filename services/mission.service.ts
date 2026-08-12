import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { CreateMissionPayload, Mission, MissionCheckIn } from '@/types/mission'

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

  myCheckIns() {
    return http.get<IApiEnvelope<MissionCheckIn[]>>(endpoints.missions.myCheckIns)
  },

  checkIn(missionId: string, queueNumber?: string) {
    return http.post<IApiEnvelope<{ id: string }>, { queueNumber?: string }>(
      endpoints.missions.checkIn(missionId),
      { queueNumber },
    )
  },

  checkOut(missionId: string) {
    return http.post<IApiEnvelope<{ id: string }>>(endpoints.missions.checkOut(missionId))
  },
}

import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { CreateMissionPayload, Mission, MissionCheckIn, MissionQuestion } from '@/types/mission'

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

  update(missionId: string, payload: Partial<CreateMissionPayload>) {
    return http.put<IApiEnvelope<{ id: string }>, Partial<CreateMissionPayload>>(
      endpoints.missions.detail(missionId),
      payload,
    )
  },

  remove(missionId: string) {
    return http.delete<IApiEnvelope<null>>(endpoints.missions.detail(missionId))
  },

  questions(missionId: string) {
    // `locked` menandai soal yang belum terbuka karena kelompok belum
    // membuktikan berada di lokasi misi.
    return http.get<IApiEnvelope<{ locked: boolean; questions: MissionQuestion[] }>>(
      endpoints.missions.questions(missionId),
    )
  },

  verifyLocation(missionId: string, lat: number, lng: number) {
    return http.post<
      IApiEnvelope<{ verified: boolean; distance: number; alreadyVerified: boolean }>,
      { lat: number; lng: number }
    >(endpoints.missions.verifyLocation(missionId), { lat, lng })
  },

  setQuestions(missionId: string, questions: unknown[]) {
    return http.put<IApiEnvelope<{ total: number }>, { questions: unknown[] }>(
      endpoints.missions.questions(missionId),
      { questions },
    )
  },

  myCheckIns() {
    return http.get<IApiEnvelope<MissionCheckIn[]>>(endpoints.missions.myCheckIns)
  },

  checkIn(missionId: string) {
    return http.post<IApiEnvelope<{ id: string }>>(endpoints.missions.checkIn(missionId))
  },

  checkOut(missionId: string) {
    return http.post<IApiEnvelope<{ id: string }>>(endpoints.missions.checkOut(missionId))
  },
}

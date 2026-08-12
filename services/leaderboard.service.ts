import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { LeaderboardRow } from '@/types/leaderboard'

export const leaderboardService = {
  get() {
    return http.get<IApiEnvelope<LeaderboardRow[]>>(endpoints.leaderboard.get)
  },
}

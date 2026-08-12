import { useQuery } from '@tanstack/react-query'
import { leaderboardService } from '@/services/leaderboard.service'

/**
 * Papan skor. Belum push realtime (WebSocket) — untuk sekarang data disegarkan
 * berkala dan bisa ditarik manual, yang sudah cukup untuk layar pit stop.
 */
export const useLeaderboardQuery = (refetchIntervalMs = 30_000) => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => (await leaderboardService.get()).data,
    refetchInterval: refetchIntervalMs,
  })
}

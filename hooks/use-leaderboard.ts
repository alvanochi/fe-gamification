import { useQuery } from '@tanstack/react-query'
import { leaderboardService } from '@/services/leaderboard.service'

/**
 * Papan skor.
 *
 * Poin masuk lewat siaran WebSocket, jadi tabel diperbarui begitu ada
 * perubahan. Penyegaran berkala tetap dipasang longgar sebagai jaring pengaman
 * bila koneksi socket sempat terputus.
 */
export const useLeaderboardQuery = (refetchIntervalMs = 60_000) => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => (await leaderboardService.get()).data,
    refetchInterval: refetchIntervalMs,
  })
}

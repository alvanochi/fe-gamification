import { useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/user.service'

export const useProfileQuery = (options?: { enabled?: boolean; refetchInterval?: number }) => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await userService.getProfile()).data,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  })
}

/**
 * Ada token di perangkat ini?
 *
 * Dipakai halaman yang boleh dibuka tanpa login (mis. /leaderboard) untuk
 * menahan permintaan profil. Tanpa penjagaan ini, respons 401 akan memicu
 * interceptor di libs/api.ts yang melempar pengunjung ke halaman login.
 */
const hasSession = () =>
  typeof window !== 'undefined' && !!window.localStorage.getItem('accessToken')

// Token tidak berubah selama halaman terbuka, jadi tidak ada yang perlu
// dilanggan; snapshot server sengaja false agar HTML hasil prerender cocok.
const noopSubscribe = () => () => {}

export const useHasSession = () => useSyncExternalStore(noopSubscribe, hasSession, () => false)

import { useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userService, type SocialProfilePayload } from '@/services/user.service'

export const useProfileQuery = (options?: { enabled?: boolean; refetchInterval?: number }) => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await userService.getProfile()).data,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  })
}

/**
 * Checkpoint 0 — simpan profil usaha & akun media sosial, atau lewati.
 *
 * Profil disegarkan setelahnya karena penanda `socialProfileAt`-lah yang
 * menentukan checkpoint ini masih ditampilkan atau tidak.
 */
export const useSaveSocialProfileMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SocialProfilePayload) => userService.saveSocialProfile(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
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

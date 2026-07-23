import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'

export const useLoginMutation = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async response => {
      const { accessToken, refreshToken } = response.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      // Also set a cookie so Next.js middleware can read it for route protection
      document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

      // The QueryClient is a single shared instance for the whole tab — without
      // clearing it, switching accounts in the same browser tab would show the
      // PREVIOUS user's cached profile/group data until a background refetch
      // happens to overwrite it (a real cross-account data leak, not just a
      // cosmetic flicker).
      queryClient.clear()

      router.push('/race')
    },
    onError: (error: Error) => {
      console.error(error)
    },
  })
}

export const useRegisterMutation = () => {
  const router = useRouter()

  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      router.push('/auth/login')
    },
    onError: (error: Error) => {
      console.error(error)
    },
  })
}

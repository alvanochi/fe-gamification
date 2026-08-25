import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { userService } from '@/services/user.service'
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

      // Halaman masuk ini sekarang khusus panitia — peserta masuk lewat kolom
      // nama & nomor telepon di beranda. Mengantar mereka ke /race berarti
      // mendaratkan panitia di layar peserta yang tidak berlaku bagi mereka,
      // lalu memaksa mencari sendiri tautan ke panelnya.
      const profile = (await userService.getProfile()).data
      const isPanitia = profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN'
      router.replace(isPanitia ? '/admin/monitoring' : '/race')
    },
    onError: (error: Error) => {
      console.error(error)
    },
  })
}

export const useLogoutMutation = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const clearSession = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax'
    // Sama alasannya dengan login: cache dibersihkan supaya data akun
    // sebelumnya tidak sempat terlihat oleh akun berikutnya di tab yang sama.
    queryClient.clear()
  }

  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    },
    // Sesi lokal dibersihkan apa pun hasilnya — kalau token sudah kedaluwarsa
    // di server, pengguna tetap harus bisa keluar dari perangkatnya.
    // Beranda, bukan layar masuk panitia: peserta masuk lewat kolom nama &
    // nomor telepon di kaki beranda, jadi ke sanalah jalan kembalinya.
    onSettled: () => {
      clearSession()
      router.push('/')
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

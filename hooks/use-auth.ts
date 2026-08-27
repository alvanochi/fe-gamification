import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'

/**
 * Masuk lewat nama & nomor telepon ditangani NameLoginForm secara langsung —
 * peserta di kaki beranda, panitia di /auth/login. Tidak ada lagi jalur masuk
 * lewat email di sisi peramban.
 */

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

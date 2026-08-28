import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { submissionService } from '@/services/submission.service'
import { SubmitMissionPayload, ValidateSubmissionPayload } from '@/types/mission'

export const useMyGroupSubmissionsQuery = () => {
  return useQuery({
    queryKey: ['my-group-submissions'],
    queryFn: async () => (await submissionService.myGroup()).data,
  })
}

export const useSubmitMissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submissionService.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-group-submissions'] })
    },
  })
}

export const usePendingSubmissionsQuery = () => {
  return useQuery({
    queryKey: ['pending-submissions'],
    queryFn: async () => (await submissionService.pending()).data,
    refetchInterval: 5000,
  })
}

/**
 * Berapa banyak yang menunggu panitia.
 *
 * Ringan dengan sengaja: navigasi panel ada di setiap halaman, dan menarik
 * seluruh antrean beserta URL buktinya tiap sepuluh detik hanya untuk
 * menampilkan satu angka jelas terlalu mahal.
 */
export const usePendingCountsQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['pending-counts'],
    queryFn: async () => (await submissionService.pendingCounts()).data,
    enabled,
    refetchInterval: 10_000,
  })
}

/**
 * Jawaban kuis untuk kartu validasi.
 *
 * Diambil hanya saat kartunya memang misi kuis: menyeret seluruh jawaban tiap
 * lima detik untuk semua kartu di antrean jelas terlalu mahal.
 */
export const useQuizReviewQuery = (submissionId: string, enabled = true) => {
  return useQuery({
    queryKey: ['quiz-review', submissionId],
    queryFn: async () => (await submissionService.quizReview(submissionId)).data,
    enabled,
  })
}

export const useValidateSubmissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ submissionId, ...payload }: { submissionId: string } & ValidateSubmissionPayload) =>
      submissionService.validate(submissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-submissions'] })
      queryClient.invalidateQueries({ queryKey: ['pending-counts'] })
    },
  })
}

/**
 * Kirim bukti misi: unggah file ke R2 lebih dulu (bila ada), lalu simpan
 * submission dengan mediaUrl hasil unggahan. Sebelumnya file yang dipilih
 * peserta tidak pernah ikut terkirim sama sekali.
 */
export const useSubmitMissionWithEvidenceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, ...payload }: SubmitMissionPayload & { file?: File | null }) => {
      const mediaUrl = file ? await submissionService.uploadEvidence(file) : payload.mediaUrl
      return submissionService.submit({ ...payload, mediaUrl })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-group-submissions'] })
    },
  })
}

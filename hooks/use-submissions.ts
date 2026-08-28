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
 * Kirim bukti misi: unggah berkasnya lebih dulu, lalu simpan submission dengan
 * URL hasil unggahannya.
 *
 * Berkasnya diunggah berbarengan, bukan satu per satu — misi yang meminta lima
 * foto akan terasa seperti menunggu lima kali lipat kalau dijalankan berurutan,
 * dan peserta menunggu itu sambil berdiri di lapangan.
 */
export const useSubmitMissionWithEvidenceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ files, ...payload }: SubmitMissionPayload & { files?: File[] }) => {
      const uploaded = files?.length
        ? await Promise.all(files.map(file => submissionService.uploadEvidence(file)))
        : []

      return submissionService.submit({
        ...payload,
        mediaUrls: uploaded.length ? uploaded : payload.mediaUrls,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-group-submissions'] })
    },
  })
}

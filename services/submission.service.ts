import { AppError, http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import {
  PendingSubmission,
  QuizReview,
  SubmissionHistory,
  Submission,
  SubmitMissionPayload,
  ValidateSubmissionPayload,
} from '@/types/mission'

/**
 * Unggah bukti ke server, lalu kembalikan URL-nya.
 *
 * Sebelumnya berkas dikirim langsung ke Cloudflare R2 lewat presigned URL, dan
 * ditampilkan kembali dari domain publik R2 — yang ternyata diblokir sebagian
 * jaringan peserta, sehingga foto yang berhasil terunggah tetap tidak pernah
 * tampil. Sekarang berkas singgah di server yang sama dengan API-nya, jadi apa
 * pun yang bisa memanggil API pasti bisa memuat medianya.
 */
export const uploadEvidence = async (file: File): Promise<string> => {
  const form = new FormData()
  form.append('file', file)

  try {
    const { data } = await http.post<IApiEnvelope<{ url: string }>, FormData>(
      endpoints.uploads.create,
      form,
    )
    return data.url
  } catch (e) {
    // Pesan dari server (mis. berkas terlalu besar) lebih berguna daripada
    // kalimat umum, jadi diteruskan apa adanya bila ada.
    const message = (e as AppError)?.message
    throw new AppError(message || 'Gagal mengunggah bukti. Periksa koneksi lalu coba lagi.')
  }
}

export const submissionService = {
  uploadEvidence,

  myGroup() {
    return http.get<IApiEnvelope<Submission[]>>(endpoints.submissions.myGroup)
  },

  pending() {
    return http.get<IApiEnvelope<PendingSubmission[]>>(endpoints.submissions.pending)
  },

  /** Meninjau ulang keputusan yang sudah dibuat — status sekaligus nilainya. */
  review(
    submissionId: string,
    payload: { status: 'APPROVED' | 'REJECTED'; awardedPoint?: number; rejectReason?: string },
  ) {
    return http.put<IApiEnvelope<{ submissionId: string }>, typeof payload>(
      endpoints.admin.submissionReview(submissionId),
      payload,
    )
  },

  /** Seluruh kiriman beserta keputusannya, plus ringkasan rantai barter. */
  history() {
    return http.get<IApiEnvelope<SubmissionHistory>>(endpoints.submissions.history)
  },

  /** Hanya angkanya — dibaca lencana navigasi di setiap halaman panel. */
  pendingCounts() {
    return http.get<IApiEnvelope<{ submissions: number; barterSteps: number; total: number }>>(
      endpoints.submissions.pendingCount,
    )
  },

  submit(payload: SubmitMissionPayload) {
    return http.post<IApiEnvelope<{ id: string }>, SubmitMissionPayload>(
      endpoints.submissions.submit,
      payload,
    )
  },

  /** Jawaban kuis satu submission — hanya dibaca kartu validasi misi kuis. */
  quizReview(submissionId: string) {
    return http.get<IApiEnvelope<QuizReview>>(endpoints.submissions.quizReview(submissionId))
  },

  validate(submissionId: string, payload: ValidateSubmissionPayload) {
    return http.put<IApiEnvelope<null>, ValidateSubmissionPayload>(
      endpoints.submissions.validate(submissionId),
      payload,
    )
  },
}

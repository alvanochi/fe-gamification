import axios from 'axios'
import { AppError, http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import {
  PendingSubmission,
  PresignedUpload,
  Submission,
  SubmitMissionPayload,
  ValidateSubmissionPayload,
} from '@/types/mission'

/**
 * Unggah bukti ke Cloudflare R2 lalu kembalikan URL publiknya.
 *
 * Dua langkah: minta presigned URL ke backend, lalu PUT file mentah langsung ke
 * R2. Langkah kedua sengaja memakai axios telanjang — bukan `http` — karena
 * tujuannya bukan API kita, sehingga tidak boleh membawa Authorization header
 * maupun baseURL, dan interceptor 401 di sana akan salah memaksa logout.
 */
export const uploadEvidence = async (file: File): Promise<string> => {
  const { data } = await http.get<IApiEnvelope<PresignedUpload>>(endpoints.submissions.uploadUrl, {
    params: { fileName: file.name, mimeType: file.type || 'application/octet-stream' },
  })

  try {
    await axios.put(data.uploadUrl, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    })
  } catch {
    throw new AppError('Gagal mengunggah bukti. Periksa koneksi lalu coba lagi.')
  }

  return data.publicUrl
}

export const submissionService = {
  uploadEvidence,

  myGroup() {
    return http.get<IApiEnvelope<Submission[]>>(endpoints.submissions.myGroup)
  },

  pending() {
    return http.get<IApiEnvelope<PendingSubmission[]>>(endpoints.submissions.pending)
  },

  submit(payload: SubmitMissionPayload) {
    return http.post<IApiEnvelope<{ id: string }>, SubmitMissionPayload>(
      endpoints.submissions.submit,
      payload,
    )
  },

  validate(submissionId: string, payload: ValidateSubmissionPayload) {
    return http.put<IApiEnvelope<null>, ValidateSubmissionPayload>(
      endpoints.submissions.validate(submissionId),
      payload,
    )
  },
}

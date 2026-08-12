export type MissionType = 'TANTANGAN' | 'BIGGER_BETTER' | 'SOAL_LOKASI'

/** Dua kategori besar simulasi di MR6. */
export type MissionCategory = 'TERSTRUKTUR' | 'MANDIRI'

/** Bentuk petunjuk lokasi (kolom "PETUNJUK" di MR6). */
export type ClueType = 'NONE' | 'TEKS' | 'MORSE' | 'SANDI_ANGKA' | 'GPS' | 'FOTO' | 'MAP'

/** Bentuk bukti yang diminta (kolom "PEMBUKTIAN" di MR6). */
export type ProofType =
  | 'FOTO'
  | 'VIDEO'
  | 'FOTO_VIDEO'
  | 'LINK_SOSMED'
  | 'LAPORAN_PETUGAS'
  | 'INPUT_HASIL'

export interface Mission {
  id: string
  title: string
  description: string
  type: MissionType
  isMandatory: boolean
  pointWeight: number
  sponsorId: string | null
  openAt: string | null
  prerequisiteId: string | null
  participantCount: number
  geoLat: string | null
  geoLng: string | null
  geoRadius: number | null
  pointRules: Record<string, unknown> | null
  category: MissionCategory
  clueType: ClueType
  clue: string | null
  locationName: string | null
  /** "HH:MM" waktu lokal acara. */
  sessionStart: string | null
  sessionEnd: string | null
  durationMinutes: number | null
  proofType: ProofType
  /** Bila keduanya terisi, panitia menilai dalam rentang ini saat Approve. */
  pointMin: number | null
  pointMax: number | null
  requiresCheckIn: boolean
  createdAt: string
  updatedAt: string
}

export type AssignmentStatus = 'TODO' | 'DOING' | 'REVIEW' | 'ACCEPTED' | 'REJECTED'

export interface Assignment {
  id: string
  missionId: string
  groupId: string
  assigneeUserId: string | null
  status: AssignmentStatus
  rejectReason: string | null
  createdAt: string
  updatedAt: string
}

export interface BarterStep {
  id: string
  assignmentId: string
  stepNo: number
  itemFrom: string
  itemTo: string
  partnerName: string | null
  videoUrl: string
  isValid: boolean
  createdAt: string
  updatedAt: string
}

export interface SubmitBarterStepPayload {
  assignmentId: string
  stepNo: number
  itemFrom: string
  itemTo: string
  partnerName?: string
  videoUrl: string
}

export interface MissionCheckIn {
  id: string
  missionId: string
  groupId: string
  checkedInBy: string
  checkedOutBy: string | null
  queueNumber: string | null
  checkedInAt: string
  checkedOutAt: string | null
}

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Submission {
  id: string
  missionId: string
  groupId: string
  submittedBy: string
  status: SubmissionStatus
  mediaUrl: string | null
  answerText: string | null
  selectedOptionId: string | null
  awardedPoint: number | null
  rejectReason: string | null
  validatedBy: string | null
  validatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PendingSubmission {
  id: string
  status: SubmissionStatus
  mediaUrl: string | null
  answerText: string | null
  createdAt: string
  missionId: string
  missionTitle: string
  missionType: MissionType
  pointWeight: number
  pointMin: number | null
  pointMax: number | null
  proofType: ProofType
  missionCategory: MissionCategory
  locationName: string | null
  groupId: string
  groupName: string
  submittedById: string
  submittedByName: string
}

export interface SubmitMissionPayload {
  missionId: string
  mediaUrl?: string
  answerText?: string
  geoLat?: string
  geoLng?: string
}

export interface ValidateSubmissionPayload {
  status: 'APPROVED' | 'REJECTED'
  awardedPoint?: number
  rejectReason?: string
}

export interface PresignedUpload {
  uploadUrl: string
  fileKey: string
  publicUrl: string
}

export interface CreateMissionPayload {
  title: string
  description: string
  type: MissionType
  isMandatory: boolean
  pointWeight: number
  sponsorId?: string
  openAt?: string
  prerequisiteId?: string
  participantCount: number
  geoLat?: string
  geoLng?: string
  geoRadius?: number
  category: MissionCategory
  clueType: ClueType
  clue?: string
  locationName?: string
  sessionStart?: string
  sessionEnd?: string
  durationMinutes?: number
  proofType: ProofType
  pointMin?: number
  pointMax?: number
  requiresCheckIn: boolean
}

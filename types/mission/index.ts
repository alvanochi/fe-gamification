export type MissionType = 'TANTANGAN' | 'BIGGER_BETTER' | 'SOAL_LOKASI'

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
  createdAt: string
  updatedAt: string
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
}

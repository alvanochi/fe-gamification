export type MissionType = 'TANTANGAN' | 'BIGGER_BETTER' | 'SOAL_LOKASI' | 'KUIS'

/** Cara skor dihitung — lihat utils/scoring.ts di backend. */
export type ScoringMode = 'FLAT' | 'RANGE' | 'PER_UNIT' | 'TIME_BASED' | 'AUTO_QUIZ'

export type QuestionType = 'PILIHAN_GANDA' | 'ISIAN_SINGKAT'

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
  /** Misi yel-yel — satu-satunya yang ikut muncul di rangkaian checkpoint. */
  isYelYel: boolean
  equipment: string | null
  scoringMode: ScoringMode
  pointPerUnit: number | null
  maxUnits: number | null
  timeTargetSeconds: number | null
  createdAt: string
  updatedAt: string
}

/** Keadaan sebuah misi bagi satu kelompok — dihitung server. */
export type MissionBoardStatus = 'BELUM' | 'MENUNGGU' | 'SELESAI'

export interface BoardMission extends Mission {
  groupStatus: MissionBoardStatus
  /** Panitia belum membuka misi: judulnya tampil, isinya belum bisa dibuka. */
  locked: boolean
  /** Sesinya hampir tutup, atau misi ini menahan misi lain. */
  urgent: boolean
  /** Sisa menit sampai sesi misi tutup; null bila misinya tanpa sesi. */
  minutesToSessionEnd: number | null
  /** Rantai barter yang sudah diakhiri panitia. */
  barterClosed: boolean
}

/** Papan misi peserta: sudah dicari, disaring, diurutkan, dan dipenggal server. */
export interface MissionBoard {
  page: number
  perPage: number
  total: number
  totalPages: number
  /** false berarti panitia belum menekan "Munculkan Misi". */
  missionsReleased: boolean
  counts: Record<'SEMUA' | MissionBoardStatus, number>
  typeCounts: Record<MissionType, number>
  urgentCount: number
  urgentWindowMinutes: number
  items: BoardMission[]
}

export interface MissionBoardParams {
  search?: string
  status?: 'SEMUA' | MissionBoardStatus
  type?: 'SEMUA' | MissionType
  urgent?: boolean
  page?: number
  perPage?: number
}

export interface MissionQuestionOption {
  id: string
  optionText: string
  /** Hanya terisi untuk panitia. */
  isCorrect?: boolean
}

export interface MissionQuestion {
  id: string
  orderNo: number
  questionText: string
  imageUrl: string | null
  type: QuestionType
  point: number
  answerKey?: string
  options: MissionQuestionOption[]
}

export interface QuestionAnswer {
  questionId: string
  selectedOptionId?: string
  answerText?: string
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
  /** Tiap pertukaran divalidasi panitia satu per satu. */
  status: SubmissionStatus
  awardedPoint: number | null
  rejectReason: string | null
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
  scoringMode: ScoringMode
  pointPerUnit: number | null
  maxUnits: number | null
  timeTargetSeconds: number | null
  locationName: string | null
  groupId: string
  groupName: string
  submittedById: string
  submittedByName: string
}

/** Satu jawaban kuis beserta soal & kuncinya, untuk layar validasi. */
export interface QuizReviewAnswer {
  questionId: string
  orderNo: number
  questionText: string
  type: QuestionType
  point: number
  answerKey: string | null
  answerText: string | null
  selectedOptionId: string | null
  selectedOptionText: string | null
  isCorrect: boolean
}

export interface QuizReview {
  answers: QuizReviewAnswer[]
  /** Poin pilihan ganda yang sudah dihitung sistem. */
  autoPoint: number
  /** Poin yang masih tergantung di isian singkat. */
  manualPoint: number
  maxPoint: number
}

export interface SubmitMissionPayload {
  missionId: string
  mediaUrl?: string
  answerText?: string
  geoLat?: string
  geoLng?: string
  answers?: QuestionAnswer[]
}

/** Balasan submit misi kuis — dinilai seketika oleh server. */
export interface QuizSubmitResult {
  id: string
  autoGraded?: boolean
  correctCount?: number
  totalQuestions?: number
  point?: number
}

export interface ValidateSubmissionPayload {
  status: 'APPROVED' | 'REJECTED'
  /** Mana yang dipakai bergantung scoringMode misi. */
  awardedPoint?: number
  units?: number
  timeSeconds?: number
  rejectReason?: string
}

/** Satu soal misi kuis, disusun bersamaan dengan misinya. */
export interface MissionQuestionPayload {
  questionText: string
  imageUrl?: string
  type: QuestionType
  answerKey?: string
  point: number
  options?: Array<{ optionText: string; isCorrect: boolean }>
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
  isYelYel: boolean
  equipment?: string
  scoringMode: ScoringMode
  pointPerUnit?: number
  maxUnits?: number
  timeTargetSeconds?: number
  /** Wajib untuk misi KUIS — soalnya ikut dikirim saat misi dibuat. */
  questions?: MissionQuestionPayload[]
}

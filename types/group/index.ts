/** Lapor pos terakhir kelompok — ditampilkan di kartu QR peserta. */
export interface LastPostScan {
  postName: string
  action: 'CHECK_IN' | 'CHECK_OUT'
  at: string
}

export interface Profile {
  id: string
  email: string
  fullname: string
  role: 'PARTICIPANT' | 'ADMIN' | 'SUPER_ADMIN'
  groupId: string | null
  /** Token QR pos milik sendiri; hanya dikembalikan lewat profil. */
  qrToken: string | null
  checkInAt: string | null
  /** null bila kelompoknya belum pernah lapor ke pos mana pun. */
  lastPostScan: LastPostScan | null
  createdAt: string
  updatedAt: string
}

export interface GroupCategory {
  id: string
  name: string
  color: string
  sortOrder?: number
  /** Hanya terisi di panel panitia. */
  groupCount?: number
}

/** Keadaan misi yel-yel untuk satu kelompok. */
export interface YelYelState {
  missionId: string
  title: string
  description: string
  deadlineAt: string | null
  secondsLeft: number
  deadlineHours: number
  expired: boolean
  skipped: boolean
  submissionStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  /** Checkpoint yel-yel tidak perlu ditampilkan lagi. */
  done: boolean
}

export interface GroupMember {
  id: string
  fullname: string
  role: string
}

export interface Group {
  id: string
  name: string
  leaderId: string | null
  score: number
  photoCompletedAt: string | null
  photoUrl: string | null
  /** Siapa yang pertama mengunggah selfie kelompok. */
  photoBy: string | null
  photoByName: string | null
  categoryId: string | null
  category: GroupCategory | null
  nameSetAt: string | null
  startedAt: string | null
  formationPoint: number | null
  /** Sisa detik pembentukan kelompok, dihitung server saat data dibaca. */
  formationSecondsLeft: number
  formationRule: {
    limitMinutes: number
    graceMinutes: number
    fullPoint: number
    latePoint: number
  } | null
  createdAt: string
  updatedAt: string
  members: GroupMember[]
  /** null bila panitia belum menandai satu pun misi sebagai yel-yel. */
  yelYel: YelYelState | null
  /** Bila terisi, pemilihan ketua sedang di putaran kedua. */
  runoffCandidateIds: string[] | null
}

export interface Confirmation {
  id: string
  groupId: string
  confirmerId: string
  confirmedId: string
  createdAt: string
}

export type VoteResult =
  | { status: 'VOTE_RECORDED' }
  | { status: 'LEADER_ELECTED'; leaderId: string }
  | { status: 'NEEDS_REVOTE'; newRound: number }
  | {
      status: 'NEEDS_RUNOFF'
      newRound: number
      runoffCandidates: Array<{ id: string; fullname: string }>
    }

export interface Profile {
  id: string
  email: string
  fullname: string
  role: 'PARTICIPANT' | 'ADMIN' | 'SUPER_ADMIN'
  groupId: string | null
  /** Token boarding pass milik sendiri; hanya dikembalikan lewat profil. */
  qrToken: string | null
  checkInAt: string | null
  createdAt: string
  updatedAt: string
}

export interface GroupCategory {
  id: string
  name: string
  color: string
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

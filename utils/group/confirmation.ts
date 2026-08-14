import { Confirmation, GroupMember } from '@/types/group'

const pairKey = (a: string, b: string) => [a, b].sort().join(':')

export const buildConfirmedPairSet = (confirmations: Confirmation[]): Set<string> => {
  const set = new Set<string>()
  for (const c of confirmations) {
    set.add(pairKey(c.confirmerId, c.confirmedId))
  }
  return set
}

export const isPairConfirmed = (
  confirmedPairs: Set<string>,
  userIdA: string,
  userIdB: string,
): boolean => confirmedPairs.has(pairKey(userIdA, userIdB))

/**
 * Kelompok belum boleh maju ke tahap berikutnya sebelum seukuran ini.
 *
 * Auto-grouping mengisi kelompok sampai 6 orang, tapi anggota berdatangan satu
 * per satu. Tanpa ambang ini, orang pertama yang bergabung langsung dianggap
 * "semua pasangan terkonfirmasi" (karena memang belum ada pasangan sama sekali)
 * lalu dilempar ke sesi foto tim sendirian.
 */
export const MIN_GROUP_SIZE = 4

export const areAllPairsConfirmed = (
  members: GroupMember[],
  confirmations: Confirmation[],
): boolean => {
  // Nol atau satu anggota tidak punya pasangan untuk dikonfirmasi, sehingga
  // pemeriksaan di bawah akan lolos secara hampa. Tahan di sini.
  if (members.length < MIN_GROUP_SIZE) return false

  const confirmedPairs = buildConfirmedPairSet(confirmations)

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      if (!isPairConfirmed(confirmedPairs, members[i].id, members[j].id)) {
        return false
      }
    }
  }

  return true
}

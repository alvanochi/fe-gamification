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

export const areAllPairsConfirmed = (
  members: GroupMember[],
  confirmations: Confirmation[],
): boolean => {
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

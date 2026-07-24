import { Submission } from '@/types/mission'

export const getLatestSubmissionForMission = (
  submissions: Submission[],
  missionId: string,
): Submission | null => {
  const matches = submissions.filter(s => s.missionId === missionId)
  if (!matches.length) return null
  return matches.reduce((latest, s) => (s.createdAt > latest.createdAt ? s : latest))
}

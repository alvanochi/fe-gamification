import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { DEFAULT_PER_PAGE } from '@/hooks/use-pagination'

export interface GroupProgress {
  id: string
  name: string
  score: number
  leaderId: string | null
  photoUrl: string | null
  nameSetAt: string | null
  memberCount: number
  presentCount: number
  approvedCount: number
  pendingCount: number
  rejectedCount: number
  openCheckIns: number
  lastActivityAt: string | null
}

export interface Paged {
  page: number
  perPage: number
  totalPages: number
}

export interface MonitoringData extends Paged {
  totalGroups: number
  totalMissions: number
  totalParticipants: number
  checkedIn: number
  /** Peserta hadir yang belum kebagian kelompok. */
  waitingForGroup: number
  groups: GroupProgress[]
}

export interface GroupMemberRow {
  id: string
  fullname: string
  email: string | null
  checkInAt: string | null
}

export interface ActivityRow {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  awardedPoint: number | null
  rejectReason: string | null
  createdAt: string
  validatedAt: string | null
  missionTitle: string
  submittedByName: string
  validatedByName: string | null
}

export interface CheckInRow {
  id: string
  missionTitle: string
  checkedInAt: string
  checkedOutAt: string | null
  checkedInByName: string
  checkedOutByName: string | null
}

export const useMonitoringQuery = (page = 1, perPage = DEFAULT_PER_PAGE) => {
  return useQuery({
    queryKey: ['monitoring', page, perPage],
    queryFn: async () =>
      (
        await http.get<IApiEnvelope<MonitoringData>>(endpoints.admin.monitoring, {
          params: { page, perPage },
        })
      ).data,
    // Panitia memakai halaman ini sambil acara berjalan.
    refetchInterval: 10_000,
  })
}

export interface MissionProgress {
  id: string
  title: string
  type: string
  category: string
  proofType: string
  requiresCheckIn: boolean
  approvedCount: number
  pendingCount: number
  rejectedCount: number
  groups: Array<{
    groupId: string
    groupName: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    point: number | null
    at: string
  }>
}

export const useMissionMonitoringQuery = (page = 1, perPage = DEFAULT_PER_PAGE) => {
  return useQuery({
    queryKey: ['monitoring-missions', page, perPage],
    queryFn: async () =>
      (
        await http.get<
          IApiEnvelope<Paged & { totalGroups: number; totalMissions: number; missions: MissionProgress[] }>
        >(endpoints.admin.monitoringMissions, { params: { page, perPage } })
      ).data,
    refetchInterval: 10_000,
  })
}

/**
 * Membetulkan nilai kiriman yang sudah disetujui.
 *
 * Nilainya tersimpan di dua tempat — angka yang tampil dan angka yang
 * dijumlahkan klasemen — dan server yang menjaga keduanya tetap sepakat.
 * Setelah berhasil, detail kelompok dan klasemen ditarik ulang supaya
 * angkanya tidak tertinggal di layar yang sedang dibuka panitia lain.
 */
export const useUpdateSubmissionScoreMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ submissionId, awardedPoint }: { submissionId: string; awardedPoint: number }) =>
      http.put<IApiEnvelope<{ submissionId: string; awardedPoint: number }>, { awardedPoint: number }>(
        endpoints.admin.submissionScore(submissionId),
        { awardedPoint },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-group'] })
      queryClient.invalidateQueries({ queryKey: ['monitoring'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}

export const useGroupDetailQuery = (groupId: string | null) => {
  return useQuery({
    queryKey: ['monitoring-group', groupId],
    queryFn: async () =>
      (
        await http.get<
          IApiEnvelope<{ members: GroupMemberRow[]; activity: ActivityRow[]; checkIns: CheckInRow[] }>
        >(endpoints.admin.monitoringGroup(groupId!))
      ).data,
    enabled: !!groupId,
    refetchInterval: 10_000,
  })
}

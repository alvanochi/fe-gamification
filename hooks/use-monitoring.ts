import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

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

export interface MonitoringData {
  totalMissions: number
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
  queueNumber: string | null
  checkedInAt: string
  checkedOutAt: string | null
  checkedInByName: string
  checkedOutByName: string | null
}

export const useMonitoringQuery = () => {
  return useQuery({
    queryKey: ['monitoring'],
    queryFn: async () => (await http.get<IApiEnvelope<MonitoringData>>(endpoints.admin.monitoring)).data,
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

export const useMissionMonitoringQuery = () => {
  return useQuery({
    queryKey: ['monitoring-missions'],
    queryFn: async () =>
      (
        await http.get<IApiEnvelope<{ totalGroups: number; missions: MissionProgress[] }>>(
          endpoints.admin.monitoringMissions,
        )
      ).data,
    refetchInterval: 10_000,
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

export const useGenerateGroupsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      http.post<IApiEnvelope<{ assigned: number; created: number }>>(endpoints.admin.generateGroups),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring'] })
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] })
    },
  })
}

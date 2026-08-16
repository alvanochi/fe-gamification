import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export interface PublicSettings {
  missionsReleased: boolean
  missionsReleasedAt: string | null
  announcement: string | null
  announcedAt: string | null
  formationLimitMinutes: number
  formationGraceMinutes: number
  formationFullPoint: number
  formationLatePoint: number
  yelYelDeadlineHours: number
  yelYelOnTimePoint: number
  yelYelLatePoint: number
  barterPointPerStep: number
  leaderboardTopN: number
}

export type AdminSettings = PublicSettings & { id: string; updatedAt: string }

export const useSettingsQuery = (enabled = true) =>
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await http.get<IApiEnvelope<PublicSettings>>(endpoints.settings.get)).data,
    enabled,
  })

export const useAdminSettingsQuery = () =>
  useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await http.get<IApiEnvelope<AdminSettings>>(endpoints.settings.admin)).data,
  })

export const useUpdateSettingsMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<AdminSettings>) =>
      http.put<IApiEnvelope<AdminSettings>, Partial<AdminSettings>>(endpoints.settings.admin, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export const useReleaseMissionsMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (released: boolean) =>
      http.post<IApiEnvelope<PublicSettings>, { released: boolean }>(
        endpoints.settings.releaseMissions,
        { released },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export const useAnnounceMutation = () =>
  useMutation({
    mutationFn: (message: string) =>
      http.post<IApiEnvelope<PublicSettings>, { message: string }>(endpoints.settings.announce, {
        message,
      }),
  })

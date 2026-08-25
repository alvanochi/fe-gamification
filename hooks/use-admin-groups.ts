import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export interface AdminGroup {
  id: string
  name: string
  score: number
  categoryId: string | null
}

/** Baris yang dilewati beserta alasannya — dipakai hapus akun & bubar kelompok. */
export interface SkippedRow {
  name: string
  reason: string
}

export const useAdminGroupsQuery = () => {
  return useQuery({
    queryKey: ['admin-groups'],
    queryFn: async () => (await http.get<IApiEnvelope<AdminGroup[]>>(endpoints.admin.groups)).data,
  })
}

/**
 * Menyusun kelompok dari daftar akun.
 *
 * Ketiganya menyentuh daftar yang sama, jadi cache akun dan kelompok selalu
 * disegarkan bersama — kalau tidak, kolom kelompok di daftar akun akan
 * menampilkan susunan lama sampai halaman dimuat ulang.
 */
const useGroupMutation = <TVariables, TData>(
  request: (variables: TVariables) => Promise<TData>,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] })
      queryClient.invalidateQueries({ queryKey: ['monitoring'] })
    },
  })
}

export const useCreateGroupMutation = () =>
  useGroupMutation((payload: { name: string; memberIds: string[] }) =>
    http.post<IApiEnvelope<{ id: string; placed: number }>, typeof payload>(
      endpoints.admin.groups,
      payload,
    ),
  )

export const useSetGroupMembersMutation = () =>
  useGroupMutation(({ groupId, userIds }: { groupId: string; userIds: string[] }) =>
    http.put<IApiEnvelope<{ placed: number }>, { userIds: string[] }>(
      endpoints.admin.groupMembers(groupId),
      { userIds },
    ),
  )

export const useDeleteGroupsMutation = () =>
  useGroupMutation((groupIds: string[]) =>
    http.delete<IApiEnvelope<{ deleted: number; skipped: SkippedRow[] }>>(endpoints.admin.groups, {
      data: { groupIds },
    }),
  )

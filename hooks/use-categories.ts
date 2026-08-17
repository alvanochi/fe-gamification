import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'
import { GroupCategory } from '@/types/group'

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: ['group-categories'],
    queryFn: async () =>
      (await http.get<IApiEnvelope<GroupCategory[]>>(endpoints.categories.list)).data,
  })
}

interface CategoryPayload {
  name?: string
  color?: string
  sortOrder?: number
}

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CategoryPayload) =>
      http.post<IApiEnvelope<{ id: string }>, CategoryPayload>(endpoints.categories.list, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-categories'] }),
  })
}

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & CategoryPayload) =>
      http.put<IApiEnvelope<{ id: string }>, CategoryPayload>(
        endpoints.categories.detail(id),
        payload,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-categories'] }),
  })
}

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => http.delete<IApiEnvelope<null>>(endpoints.categories.detail(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-categories'] }),
  })
}

/** Penempatan manual: panitia memilih sendiri kelompok mana masuk kategori mana. */
export const useAssignCategoryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { categoryId: string | null; groupIds: string[] }) =>
      http.post<IApiEnvelope<{ assigned: number }>, typeof payload>(
        endpoints.categories.assign,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] })
    },
  })
}

/** Pembagian acak dan merata untuk kelompok yang belum berkategori. */
export const useDistributeCategoriesMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      http.post<
        IApiEnvelope<{
          distributed: number
          perCategory: Array<{ id: string; name: string; added: number }>
        }>
      >(endpoints.categories.distribute),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] })
    },
  })
}

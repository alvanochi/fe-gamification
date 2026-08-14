import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export interface Account {
  id: string
  fullname: string
  email: string | null
  phoneNumber: string | null
  role: 'PARTICIPANT' | 'ADMIN' | 'SUPER_ADMIN'
  checkInAt: string | null
}

export const useAccountsQuery = (search: string) => {
  return useQuery({
    queryKey: ['admin-accounts', search],
    queryFn: async () =>
      (
        await http.get<IApiEnvelope<Account[]>>(endpoints.admin.accounts, {
          params: search ? { search } : undefined,
        })
      ).data,
  })
}

export const useSetAccountRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Account['role'] }) =>
      http.put<IApiEnvelope<{ role: string }>, { role: string }>(
        endpoints.admin.accountRole(userId),
        { role },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
    },
  })
}

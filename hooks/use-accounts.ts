import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export type AccountRole = 'PARTICIPANT' | 'ADMIN' | 'SUPER_ADMIN'

export interface Account {
  id: string
  fullname: string
  email: string | null
  phoneNumber: string | null
  businessName: string | null
  role: AccountRole
  checkInAt: string | null
  groupId: string | null
  /** Token itu sendiri tidak ikut dikirim — hanya penanda sudah ada atau belum. */
  hasQrToken: boolean
}

export interface AccountsPage {
  page: number
  perPage: number
  total: number
  totalPages: number
  counts: Record<'all' | AccountRole, number>
  items: Account[]
}

export const useAccountsQuery = (
  search: string,
  role: AccountRole | '',
  page: number,
  perPage: number,
) => {
  return useQuery({
    queryKey: ['admin-accounts', search, role, page, perPage],
    queryFn: async () =>
      (
        await http.get<IApiEnvelope<AccountsPage>>(endpoints.admin.accounts, {
          params: { search: search || undefined, role: role || undefined, page, perPage },
        })
      ).data,
  })
}

export interface PrintableCard {
  id: string
  fullname: string
  businessName: string | null
  qrToken: string
}

/**
 * Mengambil token QR hanya untuk orang yang benar-benar akan dicetak.
 *
 * Token adalah kredensial, jadi sengaja tidak ikut dalam daftar akun —
 * menelusuri halaman tidak boleh menaruh ratusan kunci masuk di browser.
 */
export const useQrTokensMutation = () => {
  return useMutation({
    mutationFn: (userIds: string[]) =>
      http.post<
        IApiEnvelope<{ cards: PrintableCard[]; skipped: string[] }>,
        { userIds: string[] }
      >(endpoints.admin.accountQrTokens, { userIds }),
  })
}

export const useSetAccountRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AccountRole }) =>
      http.put<IApiEnvelope<{ role: string }>, { role: string }>(
        endpoints.admin.accountRole(userId),
        { role },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
    },
  })
}

/** Mengangkat atau menurunkan beberapa akun sekaligus. */
export const useSetAccountRolesBulkMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { userIds: string[]; role: AccountRole }) =>
      http.put<IApiEnvelope<{ updated: number; skippedSelf: boolean }>, typeof payload>(
        endpoints.admin.accountRoles,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
    },
  })
}

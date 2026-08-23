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

export interface AccountPayload {
  fullname?: string
  phoneNumber?: string
  email?: string | null
  businessName?: string | null
  role?: AccountRole
}

export const useCreateAccountMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AccountPayload) =>
      http.post<IApiEnvelope<{ id: string; fullname: string }>, AccountPayload>(
        endpoints.admin.accounts,
        payload,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-accounts'] }),
  })
}

export const useUpdateAccountMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, ...payload }: { userId: string } & AccountPayload) =>
      http.put<IApiEnvelope<{ id: string }>, AccountPayload>(
        endpoints.admin.account(userId),
        payload,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-accounts'] }),
  })
}

export const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      http.delete<IApiEnvelope<null>>(endpoints.admin.account(userId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-accounts'] }),
  })
}

export interface SheetImportResult {
  created?: number
  updated?: number
  placed?: number
  groups?: number
  skipped: Array<{ row: number; name: string; reason: string }>
}

/**
 * Unggah lembar kerja peserta atau susunan kelompok.
 *
 * Daftar peserta acara ini hidup di spreadsheet jauh sebelum sistemnya ada,
 * dan panitia menata pembagian kelompok jauh lebih cepat di sana.
 */
export const useSheetImportMutation = (kind: 'accounts' | 'groups') => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return http.post<IApiEnvelope<SheetImportResult>, FormData>(
        kind === 'accounts' ? endpoints.admin.sheetAccounts : endpoints.admin.sheetGroups,
        form,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-categories'] })
      queryClient.invalidateQueries({ queryKey: ['monitoring'] })
    },
  })
}

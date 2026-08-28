import { useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '@/libs/api'
import { endpoints } from '@/libs/endpoint'
import { IApiEnvelope } from '@/types/auth'

export interface SheetImportResult {
  created: number
  updated: number
  skipped: Array<{ row: number; name: string; reason: string }>
}

/** Dua lembar kerja yang dipertukarkan panitia: daftar peserta, dan daftar misi. */
export type SheetKind = 'accounts' | 'missions'

const IMPORT_PATH: Record<SheetKind, string> = {
  accounts: endpoints.admin.sheetAccounts,
  missions: endpoints.admin.sheetMissions,
}

/** Cache yang ikut basi setelah satu lembar diunggah. */
const AFFECTED_KEYS: Record<SheetKind, string[][]> = {
  accounts: [['admin-accounts'], ['admin-groups'], ['monitoring']],
  missions: [['missions'], ['mission-board'], ['monitoring-missions']],
}

/**
 * Unggah lembar kerja.
 *
 * Daftar peserta maupun rangkaian misi acara ini hidup di spreadsheet jauh
 * sebelum sistemnya ada, dan panitia menatanya jauh lebih cepat di sana. Kedua
 * lembar bekerja dengan cara yang sama — dicocokkan lewat satu kolom kunci,
 * baris yang sudah dikenal diperbarui bukan digandakan — jadi jalurnya pun satu.
 */
export const useSheetImportMutation = (kind: SheetKind) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return http.post<IApiEnvelope<SheetImportResult>, FormData>(IMPORT_PATH[kind], form)
    },
    onSuccess: () => {
      AFFECTED_KEYS[kind].forEach(queryKey => queryClient.invalidateQueries({ queryKey }))
    },
  })
}

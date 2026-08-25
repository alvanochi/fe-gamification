import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { missionService } from '@/services/mission.service'
import { CreateMissionPayload, MissionBoardParams } from '@/types/mission'

export const useMissionsQuery = () => {
  return useQuery({
    queryKey: ['missions'],
    queryFn: async () => (await missionService.list()).data,
  })
}

/**
 * Papan misi peserta.
 *
 * Kata kunci, saringan, dan nomor halaman ikut menjadi kunci cache: tiap
 * kombinasi adalah pertanyaan yang berbeda ke server, dan `placeholderData`
 * menahan hasil sebelumnya tetap tampil supaya daftarnya tidak berkedip kosong
 * setiap kali peserta mengetik satu huruf.
 */
export const useMissionBoardQuery = (params: MissionBoardParams) => {
  return useQuery({
    queryKey: ['mission-board', params],
    queryFn: async () => (await missionService.board(params)).data,
    placeholderData: previous => previous,
  })
}

export const useCreateMissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: missionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export const useUpdateMissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ missionId, ...payload }: { missionId: string } & Partial<CreateMissionPayload>) =>
      missionService.update(missionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export const useDeleteMissionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (missionId: string) => missionService.remove(missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export const useMissionQuestionsQuery = (missionId: string) => {
  return useQuery({
    queryKey: ['mission-questions', missionId],
    queryFn: async () => (await missionService.questions(missionId)).data,
    enabled: !!missionId,
  })
}

/**
 * Peserta membuktikan sudah berdiri di lokasi misi.
 *
 * Koordinat diambil dari perangkat lalu diperiksa server; jaraknya tidak
 * pernah dihitung di sisi klien. Berhasilnya membuka soal misi.
 */
export const useVerifyLocationMutation = (missionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) =>
      missionService.verifyLocation(missionId, lat, lng),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-questions', missionId] })
      queryClient.invalidateQueries({ queryKey: ['my-checkins'] })
    },
  })
}

export const useSetQuestionsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ missionId, questions }: { missionId: string; questions: unknown[] }) =>
      missionService.setQuestions(missionId, questions),
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mission-questions', variables.missionId] })
    },
  })
}

export const useMyCheckInsQuery = () => {
  return useQuery({
    queryKey: ['mission-checkins'],
    queryFn: async () => (await missionService.myCheckIns()).data,
  })
}

export const useCheckInMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ missionId }: { missionId: string }) => missionService.checkIn(missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-checkins'] })
    },
  })
}

export const useCheckOutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ missionId }: { missionId: string }) => missionService.checkOut(missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-checkins'] })
      queryClient.invalidateQueries({ queryKey: ['my-group-submissions'] })
    },
  })
}

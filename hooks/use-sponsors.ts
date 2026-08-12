import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sponsorService } from '@/services/sponsor.service'
import { SponsorPayload } from '@/types/sponsor'

export const useSponsorsQuery = () => {
  return useQuery({
    queryKey: ['sponsors'],
    queryFn: async () => (await sponsorService.list()).data,
    // Data sponsor jarang berubah selama acara berlangsung.
    staleTime: 5 * 60 * 1000,
  })
}

export const useAdminSponsorsQuery = () => {
  return useQuery({
    queryKey: ['admin-sponsors'],
    queryFn: async () => (await sponsorService.listAll()).data,
  })
}

const invalidateSponsors = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] })
  queryClient.invalidateQueries({ queryKey: ['sponsors'] })
}

export const useCreateSponsorMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SponsorPayload) => sponsorService.create(payload),
    onSuccess: () => invalidateSponsors(queryClient),
  })
}

export const useUpdateSponsorMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<SponsorPayload>) =>
      sponsorService.update(id, payload),
    onSuccess: () => invalidateSponsors(queryClient),
  })
}

export const useDeleteSponsorMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sponsorService.remove(id),
    onSuccess: () => invalidateSponsors(queryClient),
  })
}

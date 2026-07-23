import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/user.service'

export const useProfileQuery = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await userService.getProfile()).data,
  })
}

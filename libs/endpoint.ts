export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
  profile: {
    get: '/profile',
    update: '/profile',
  },
  feedback: (id?: number) => ({
    getAll: '/feedback',
    create: '/feedback',
    getById: `/feedback/${id}`,
    submit: `/feedback/${id}`,
  }),
} as const

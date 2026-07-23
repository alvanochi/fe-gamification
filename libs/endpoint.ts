export const endpoints = {
  auth: {
    login: '/authentications',
    refresh: '/authentications',
    logout: '/authentications',
  },
  users: {
    register: '/users',
    me: '/users/me/profile',
    getById: (id: string) => `/users/${id}`,
  },
  groups: {
    autoGroup: '/groups/auto-group',
    getById: (groupId: string) => `/groups/${groupId}`,
    updateName: (groupId: string) => `/groups/${groupId}/name`,
    voteLeader: (groupId: string) => `/groups/${groupId}/vote-leader`,
    confirmMember: (groupId: string, targetUserId: string) =>
      `/groups/${groupId}/confirm/${targetUserId}`,
    confirmations: (groupId: string) => `/groups/${groupId}/confirmations`,
    photo: (groupId: string) => `/groups/${groupId}/photo`,
  },
  missions: {
    list: '/missions',
    myAssignments: '/missions/my-assignments',
    createAssignment: (missionId: string) => `/missions/${missionId}/assignments`,
  },
  submissions: {
    uploadUrl: '/submissions/upload-url',
    submit: '/submissions',
    validate: (submissionId: string) => `/submissions/${submissionId}/validate`,
    barterStep: '/submissions/barter-steps',
  },
  leaderboard: {
    get: '/leaderboard',
  },
} as const

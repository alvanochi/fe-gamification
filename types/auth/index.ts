export interface IApiEnvelope<T> {
  code: number
  status: 'success' | 'failed'
  message: string
  data: T
}

export interface ILoginData {
  accessToken: string
  refreshToken: string
}

export interface IUser {
  id: string
  role: string
  qrToken: string
  groupId: string | null
  email: string
  phoneNumber: string
  fullname: string
  businessName: string
  youtubeAccount: string
  instagramAccount: string
  tiktokAccount: string
  checkInAt: string | null
  createdAt: string
  updatedAt: string
}

export type ILoginResponse = IApiEnvelope<ILoginData>
export type IRegisterResponse = IApiEnvelope<IUser>

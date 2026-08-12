export interface Sponsor {
  id: string
  name: string
  logoUrl: string
  linkUrl: string | null
  orderNum: number
}

/** Bentuk lengkap yang hanya terlihat oleh panitia lewat /admin/banners. */
export interface SponsorAdmin extends Sponsor {
  isActive: boolean
  impressions: number
  clicks: number
  createdAt: string
  updatedAt: string
}

export interface SponsorPayload {
  name: string
  logoUrl: string
  linkUrl?: string
  orderNum?: number
  isActive?: boolean
}

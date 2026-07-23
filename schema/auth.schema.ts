import { z } from 'zod'

const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^(?:\+62|08)[0-9]{8,13}$/, 'Format nomor telepon tidak valid (contoh: 08xxxxxxxxxx)')

export const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  phoneNumber: phoneNumberSchema,
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type LoginPayload = LoginFormValues

export const registerSchema = z.object({
  fullname: z.string({ error: 'Nama lengkap wajib diisi' }).trim().min(1),
  email: z.string({ error: 'Email wajib diisi' }).trim().email('Format email tidak valid'),
  phoneNumber: phoneNumberSchema,
  businessName: z.string({ error: 'Nama usaha/UMKM wajib diisi' }).trim().min(1),
  youtubeAccount: z.string({ error: 'Akun YouTube wajib diisi' }).trim().min(1),
  instagramAccount: z.string({ error: 'Akun Instagram wajib diisi' }).trim().min(1),
  tiktokAccount: z.string({ error: 'Akun TikTok wajib diisi' }).trim().min(1),
})

export type RegisterFormValues = z.infer<typeof registerSchema>
export type RegisterPayload = RegisterFormValues

import { z } from 'zod'

export const missionTypeOptions = [
  { value: 'TANTANGAN', label: 'Tantangan' },
  { value: 'BIGGER_BETTER', label: 'Bigger Better (Barter)' },
  { value: 'SOAL_LOKASI', label: 'Soal Lokasi (Geofencing)' },
] as const

export const createMissionSchema = z
  .object({
    title: z.string().trim().min(3, 'Judul minimal 3 karakter'),
    description: z.string().trim().min(1, 'Deskripsi wajib diisi'),
    type: z.enum(['TANTANGAN', 'BIGGER_BETTER', 'SOAL_LOKASI'], {
      error: 'Pilih tipe misi',
    }),
    isMandatory: z.boolean(),
    pointWeight: z.coerce.number().int().min(0, 'Poin tidak boleh negatif'),
    participantCount: z.coerce.number().int().min(1, 'Minimal 1 peserta'),
    openAt: z.string().optional(),
    prerequisiteId: z.string().optional(),
    geoLat: z.string().optional(),
    geoLng: z.string().optional(),
    geoRadius: z.coerce.number().int().min(1).optional(),
  })
  .refine(
    data =>
      data.type !== 'SOAL_LOKASI' || (data.geoLat && data.geoLng && data.geoRadius),
    {
      message: 'Misi Soal Lokasi wajib punya koordinat & radius geofence',
      path: ['geoRadius'],
    },
  )

// react-hook-form's useForm must be typed with the pre-coercion INPUT shape
// (z.coerce.number() accepts string | number from raw form fields), while the
// submit handler receives the post-coercion OUTPUT shape (always number).
export type CreateMissionFormInput = z.input<typeof createMissionSchema>
export type CreateMissionFormValues = z.output<typeof createMissionSchema>

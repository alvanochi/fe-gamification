import { z } from 'zod'

export const missionTypeOptions = [
  { value: 'TANTANGAN', label: 'Tantangan' },
  { value: 'BIGGER_BETTER', label: 'Bigger Better (Barter)' },
  { value: 'SOAL_LOKASI', label: 'Soal Lokasi (Geofencing)' },
] as const

export const missionCategoryOptions = [
  { value: 'MANDIRI', label: 'Mandiri (dikerjakan sendiri, waktu bebas)' },
  { value: 'TERSTRUKTUR', label: 'Terstruktur (ada pos & petugas)' },
] as const

export const clueTypeOptions = [
  { value: 'NONE', label: 'Tanpa petunjuk' },
  { value: 'TEKS', label: 'Petunjuk teks' },
  { value: 'MORSE', label: 'Sandi morse' },
  { value: 'SANDI_ANGKA', label: 'Sandi angka' },
  { value: 'GPS', label: 'Titik GPS' },
  { value: 'FOTO', label: 'Foto lokasi (URL gambar)' },
  { value: 'MAP', label: 'Peta (URL gambar)' },
] as const

export const proofTypeOptions = [
  { value: 'FOTO', label: 'Foto' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'FOTO_VIDEO', label: 'Foto & video' },
  { value: 'LINK_SOSMED', label: 'Link sosial media' },
  { value: 'LAPORAN_PETUGAS', label: 'Laporan petugas' },
  { value: 'INPUT_HASIL', label: 'Input hasil (diawasi petugas)' },
] as const

const hhmm = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam harus HH:MM')

// Field opsional bertipe angka yang datang dari <input>: string kosong berarti
// "tidak diisi", bukan 0 — tanpa ini z.coerce.number() mengubahnya jadi 0.
const optionalInt = (min: number) =>
  z
    .union([z.literal(''), z.coerce.number().int().min(min)])
    .optional()
    .transform(v => (v === '' || v === undefined ? undefined : (v as number)))

const optionalHhmm = z
  .union([z.literal(''), hhmm])
  .optional()
  .transform(v => (v === '' ? undefined : v))

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
    sponsorId: z.string().optional(),
    geoLat: z.string().optional(),
    geoLng: z.string().optional(),
    geoRadius: z.coerce.number().int().min(1).optional(),

    // --- Kebutuhan MR6 ---
    category: z.enum(['TERSTRUKTUR', 'MANDIRI']),
    clueType: z.enum(['NONE', 'TEKS', 'MORSE', 'SANDI_ANGKA', 'GPS', 'FOTO', 'MAP']),
    clue: z.string().trim().optional(),
    locationName: z.string().trim().optional(),
    sessionStart: optionalHhmm,
    sessionEnd: optionalHhmm,
    durationMinutes: optionalInt(1),
    proofType: z.enum(['FOTO', 'VIDEO', 'FOTO_VIDEO', 'LINK_SOSMED', 'LAPORAN_PETUGAS', 'INPUT_HASIL']),
    pointMin: optionalInt(0),
    pointMax: optionalInt(0),
    requiresCheckIn: z.boolean(),
  })
  .refine(
    data =>
      data.type !== 'SOAL_LOKASI' || (data.geoLat && data.geoLng && data.geoRadius),
    {
      message: 'Misi Soal Lokasi wajib punya koordinat & radius geofence',
      path: ['geoRadius'],
    },
  )
  .refine(data => (data.pointMin === undefined) === (data.pointMax === undefined), {
    message: 'Isi poin minimum dan maksimum bersamaan, atau kosongkan keduanya',
    path: ['pointMax'],
  })
  .refine(
    data => data.pointMin === undefined || data.pointMax === undefined || data.pointMin <= data.pointMax,
    { message: 'Poin minimum tidak boleh lebih besar dari maksimum', path: ['pointMax'] },
  )
  .refine(data => (data.sessionStart === undefined) === (data.sessionEnd === undefined), {
    message: 'Isi jam mulai dan jam selesai sesi bersamaan',
    path: ['sessionEnd'],
  })
  .refine(data => data.clueType === 'NONE' || !!data.clue, {
    message: 'Isi petunjuknya, atau pilih "Tanpa petunjuk"',
    path: ['clue'],
  })

// react-hook-form's useForm must be typed with the pre-coercion INPUT shape
// (z.coerce.number() accepts string | number from raw form fields), while the
// submit handler receives the post-coercion OUTPUT shape (always number).
export type CreateMissionFormInput = z.input<typeof createMissionSchema>
export type CreateMissionFormValues = z.output<typeof createMissionSchema>

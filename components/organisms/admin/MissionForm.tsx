'use client'

import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/elements/Button'
import Label from '@/components/elements/Label'
import Input from '@/components/elements/Input'
import TextArea from '@/components/elements/TextArea'
import Select from '@/components/elements/Select'
import ErrorMessage from '@/components/elements/ErrorMessage'

const MapPicker = dynamic(() => import('@/components/organisms/admin/MapPicker'), {
  ssr: false,
  loading: () => <div className="h-[280px] w-full animate-pulse rounded-md border-brut bg-paper" />,
})
import {
  createMissionSchema,
  CreateMissionFormInput,
  CreateMissionFormValues,
  missionTypeOptions,
  missionCategoryOptions,
  clueTypeOptions,
  proofTypeOptions,
} from '@/schema/mission.schema'
import { useCreateMissionMutation } from '@/hooks/use-missions'
import { useSponsorsQuery } from '@/hooks/use-sponsors'
import { AppError } from '@/libs/api'
import { Mission } from '@/types/mission'

export default function MissionForm({ existingMissions }: { existingMissions: Mission[] }) {
  const { mutate: createMission, isPending, error, isSuccess, reset } = useCreateMissionMutation()
  const { data: sponsors } = useSponsorsQuery()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset: resetForm,
    formState: { errors },
  } = useForm<CreateMissionFormInput, unknown, CreateMissionFormValues>({
    resolver: zodResolver(createMissionSchema),
    defaultValues: {
      isMandatory: false,
      pointWeight: 0,
      participantCount: 1,
      category: 'MANDIRI',
      clueType: 'NONE',
      proofType: 'FOTO',
      requiresCheckIn: false,
    },
  })

  const type = watch('type')
  const clueType = watch('clueType')
  const geoLat = watch('geoLat')
  const geoLng = watch('geoLng')
  const geoRadius = watch('geoRadius')
  const apiError = error as AppError | null

  const onSubmit = (values: CreateMissionFormValues) => {
    reset()
    createMission(
      {
        ...values,
        openAt: values.openAt ? new Date(values.openAt).toISOString() : undefined,
        // Select yang tidak dipilih mengirim string kosong. sponsorId punya
        // foreign key ke sponsors, jadi '' akan ditolak database — kirim
        // undefined supaya kolomnya benar-benar dibiarkan kosong.
        sponsorId: values.sponsorId || undefined,
        prerequisiteId: values.prerequisiteId || undefined,
      },
      {
        onSuccess: () =>
          resetForm({
            title: '',
            description: '',
            type: undefined,
            isMandatory: false,
            pointWeight: 0,
            participantCount: 1,
            openAt: '',
            prerequisiteId: '',
            sponsorId: '',
            geoLat: '',
            geoLng: '',
            geoRadius: undefined,
            category: 'MANDIRI',
            clueType: 'NONE',
            clue: '',
            locationName: '',
            sessionStart: '',
            sessionEnd: '',
            durationMinutes: '',
            proofType: 'FOTO',
            pointMin: '',
            pointMax: '',
            requiresCheckIn: false,
          }),
      },
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg sm:p-8"
    >
      <h3 className="font-display text-2xl text-ink">Buat Misi Baru</h3>

      {isSuccess && (
        <div className="rounded-md border-brut !border-success bg-paper p-4 text-sm font-bold text-success">
          Misi berhasil dibuat.
        </div>
      )}
      {apiError?.message && (
        <div className="rounded-md border-brut !border-danger bg-paper p-4 text-sm font-bold text-danger">
          {apiError.message}
        </div>
      )}

      <div>
        <Label required>Judul Misi</Label>
        <Input placeholder="Misal: Foto di depan Tugu Jogja" error={!!errors.title} {...register('title')} />
        <ErrorMessage message={errors.title?.message} />
      </div>

      <div>
        <Label required>Instruksi / Deskripsi</Label>
        <TextArea
          placeholder="Jelaskan apa yang harus dilakukan peserta"
          error={!!errors.description}
          {...register('description')}
        />
        <ErrorMessage message={errors.description?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label required>Tipe Misi</Label>
          <Select error={!!errors.type} defaultValue="" {...register('type')}>
            <option value="" disabled>
              Pilih tipe misi
            </option>
            {missionTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <ErrorMessage message={errors.type?.message} />
        </div>

        <div>
          <Label required>Poin</Label>
          <Input type="number" min={0} error={!!errors.pointWeight} {...register('pointWeight')} />
          <ErrorMessage message={errors.pointWeight?.message} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label required>Jumlah Peserta Pengerja</Label>
          <Input
            type="number"
            min={1}
            error={!!errors.participantCount}
            {...register('participantCount')}
          />
          <ErrorMessage message={errors.participantCount?.message} />
        </div>

        <div>
          <Label>Buka Otomatis Pada (opsional)</Label>
          <Input type="datetime-local" {...register('openAt')} />
        </div>
      </div>

      {/* FR-13: menautkan sponsor ke misi tertentu. */}
      <div>
        <Label>Sponsor Misi (opsional)</Label>
        <Select {...register('sponsorId')} defaultValue="">
          <option value="">Tanpa sponsor</option>
          {sponsors?.map(sponsor => (
            <option key={sponsor.id} value={sponsor.id}>
              {sponsor.name}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-ink/50">
          Misi bersponsor mendapat penanda khusus di daftar misi peserta.
        </p>
      </div>

      <div>
        <Label>Misi Prasyarat (opsional)</Label>
        <Select {...register('prerequisiteId')} defaultValue="">
          <option value="">Tidak ada</option>
          {existingMissions.map(m => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm font-bold text-ink">
        <input type="checkbox" className="h-4 w-4 border-brut-sm" {...register('isMandatory')} />
        Wajib diselesaikan dulu sebelum misi lain terbuka (gatekeeper)
      </label>

      {/* Field yang mengikuti struktur MR6_TataCaraSimulasi GAME.xlsx */}
      <div className="space-y-5 rounded-md border-brut-sm bg-paper p-4">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/45">Detail Simulasi (MR6)</p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label required>Kategori</Label>
            <Select error={!!errors.category} {...register('category')}>
              {missionCategoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <ErrorMessage message={errors.category?.message} />
          </div>

          <div>
            <Label required>Pembuktian</Label>
            <Select error={!!errors.proofType} {...register('proofType')}>
              {proofTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <ErrorMessage message={errors.proofType?.message} />
          </div>
        </div>

        <div>
          <Label>Nama Lokasi</Label>
          <Input placeholder="Misal: Hotel Royal Bringto" {...register('locationName')} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Jenis Petunjuk</Label>
            <Select error={!!errors.clueType} {...register('clueType')}>
              {clueTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Durasi Pengerjaan (menit)</Label>
            <Input type="number" min={1} placeholder="Kosongkan = bebas" {...register('durationMinutes')} />
            <ErrorMessage message={errors.durationMinutes?.message} />
          </div>
        </div>

        {clueType !== 'NONE' && (
          <div>
            <Label required>Isi Petunjuk</Label>
            <TextArea
              placeholder={
                clueType === 'MORSE'
                  ? '-... .- - .. -.- / . .-.. --- -.'
                  : clueType === 'FOTO' || clueType === 'MAP'
                    ? 'URL gambar petunjuk'
                    : 'Tulis petunjuknya di sini'
              }
              error={!!errors.clue}
              {...register('clue')}
            />
            <ErrorMessage message={errors.clue?.message} />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Sesi Mulai</Label>
            <Input type="time" {...register('sessionStart')} />
            <ErrorMessage message={errors.sessionStart?.message} />
          </div>
          <div>
            <Label>Sesi Selesai</Label>
            <Input type="time" {...register('sessionEnd')} />
            <ErrorMessage message={errors.sessionEnd?.message} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Poin Minimum</Label>
            <Input type="number" min={0} placeholder="Misal: 50" {...register('pointMin')} />
            <ErrorMessage message={errors.pointMin?.message} />
          </div>
          <div>
            <Label>Poin Maksimum</Label>
            <Input type="number" min={0} placeholder="Misal: 100" {...register('pointMax')} />
            <ErrorMessage message={errors.pointMax?.message} />
          </div>
        </div>
        <p className="text-xs text-ink/50">
          Isi rentang poin untuk misi yang dinilai subjektif (kerapihan, orisinalitas). Panitia akan
          menentukan nilainya saat menyetujui bukti. Kosongkan bila poinnya tetap.
        </p>

        <label className="flex items-center gap-2 text-sm font-bold text-ink">
          <input type="checkbox" className="h-4 w-4 border-brut-sm" {...register('requiresCheckIn')} />
          Wajib check-in di pos sebelum mengirim bukti
        </label>
      </div>

      {type === 'SOAL_LOKASI' && (
        <div className="space-y-4 rounded-md border-brut-sm border-soal-lokasi bg-paper p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-soal-lokasi">
            Konfigurasi Geofencing
          </p>

          <MapPicker
            lat={geoLat}
            lng={geoLng}
            radiusMeters={geoRadius ? Number(geoRadius) : undefined}
            onPick={(lat, lng) => {
              setValue('geoLat', lat, { shouldValidate: true })
              setValue('geoLng', lng, { shouldValidate: true })
            }}
          />

          <div>
            <Label required>Radius (meter)</Label>
            <Input type="number" min={1} {...register('geoRadius')} />
          </div>
          <ErrorMessage message={errors.geoRadius?.message} />
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={isPending}>
        Simpan Misi
      </Button>
    </form>
  )
}

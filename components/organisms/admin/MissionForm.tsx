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
} from '@/schema/mission.schema'
import { useCreateMissionMutation } from '@/hooks/use-missions'
import { AppError } from '@/libs/api'
import { Mission } from '@/types/mission'

export default function MissionForm({ existingMissions }: { existingMissions: Mission[] }) {
  const { mutate: createMission, isPending, error, isSuccess, reset } = useCreateMissionMutation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset: resetForm,
    formState: { errors },
  } = useForm<CreateMissionFormInput, unknown, CreateMissionFormValues>({
    resolver: zodResolver(createMissionSchema),
    defaultValues: { isMandatory: false, pointWeight: 0, participantCount: 1 },
  })

  const type = watch('type')
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
            geoLat: '',
            geoLng: '',
            geoRadius: undefined,
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
          <Label required>Kategori</Label>
          <Select error={!!errors.type} defaultValue="" {...register('type')}>
            <option value="" disabled>
              Pilih kategori
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

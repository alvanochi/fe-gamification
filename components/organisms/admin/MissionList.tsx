'use client'

import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import {
  useDeleteMissionMutation,
  useMissionsQuery,
  useUpdateMissionMutation,
} from '@/hooks/use-missions'
import { AppError } from '@/libs/api'
import { Mission } from '@/types/mission'
import {
  MISSION_TYPE_LABEL as TYPE_LABEL,
  MISSION_TYPE_COLOR_VAR as TYPE_COLOR_VAR,
  MISSION_CATEGORY_LABEL,
  CLUE_TYPE_LABEL,
  PROOF_TYPE_LABEL,
  formatMissionPoints,
} from '@/utils/mission/type-meta'

function MissionCard({ mission, indexedById }: { mission: Mission; indexedById: Map<string, Mission> }) {
  const prerequisite = mission.prerequisiteId ? indexedById.get(mission.prerequisiteId) : null
  const { mutate: update, isPending: isUpdating } = useUpdateMissionMutation()
  const { mutate: remove, isPending: isDeleting, error: deleteError } = useDeleteMissionMutation()

  return (
    <li
      className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm"
      style={{ borderLeftWidth: 8, borderLeftColor: TYPE_COLOR_VAR[mission.type] }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="font-mono text-[11px] font-bold uppercase tracking-widest"
            style={{ color: TYPE_COLOR_VAR[mission.type] }}
          >
            {TYPE_LABEL[mission.type]}
            {mission.isMandatory && ' · WAJIB'}
          </p>
          <h4 className="mt-1 font-display text-xl text-ink">{mission.title}</h4>
        </div>
        <span className="shrink-0 rounded-full border-brut-sm bg-primary px-3 py-1 font-display text-sm text-primary-ink">
          {formatMissionPoints(mission)}
        </span>
      </div>

      <p className="mt-2 text-sm text-ink/70">{mission.description}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink/50">
        <span>{MISSION_CATEGORY_LABEL[mission.category]}</span>
        <span>{mission.participantCount} peserta/pengerjaan</span>
        <span>bukti {PROOF_TYPE_LABEL[mission.proofType].toLowerCase()}</span>
        {mission.locationName && <span>di {mission.locationName}</span>}
        {mission.sessionStart && mission.sessionEnd && (
          <span>
            sesi {mission.sessionStart}-{mission.sessionEnd}
          </span>
        )}
        {mission.durationMinutes && <span>{mission.durationMinutes} menit</span>}
        {mission.requiresCheckIn && <span>wajib check-in</span>}
        {mission.clueType !== 'NONE' && <span>petunjuk: {CLUE_TYPE_LABEL[mission.clueType]}</span>}
        {mission.type === 'SOAL_LOKASI' && mission.geoLat && (
          <span>
            geofence {mission.geoLat}, {mission.geoLng} (r{mission.geoRadius}m)
          </span>
        )}
        {prerequisite && <span>setelah: {prerequisite.title}</span>}
        {mission.openAt && <span>buka: {new Date(mission.openAt).toLocaleString('id-ID')}</span>}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          loading={isUpdating}
          onClick={() => {
            const next = prompt(`Ubah poin untuk "${mission.title}"`, String(mission.pointWeight))
            if (next === null) return

            const pointWeight = Number(next)
            if (!Number.isInteger(pointWeight) || pointWeight < 0) {
              alert('Poin harus berupa bilangan bulat non-negatif.')
              return
            }
            update({ missionId: mission.id, pointWeight })
          }}
        >
          Ubah Poin
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          loading={isDeleting}
          onClick={() => {
            if (confirm(`Hapus misi "${mission.title}"?`)) remove(mission.id)
          }}
        >
          Hapus
        </Button>
      </div>
      <ErrorMessage message={(deleteError as AppError | null)?.message} className="mt-2" />
    </li>
  )
}

export default function MissionList() {
  const { data: missions, isLoading, error } = useMissionsQuery()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <p className="rounded-md border-brut !border-danger bg-paper-raised p-4 text-sm font-bold text-danger">
        Gagal memuat daftar misi.
      </p>
    )
  }

  if (!missions || missions.length === 0) {
    return (
      <p className="rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
        Belum ada misi. Buat misi pertama di form sebelah.
      </p>
    )
  }

  const indexedById = new Map(missions.map(m => [m.id, m]))

  return (
    <ul className="space-y-4">
      {missions.map(mission => (
        <MissionCard key={mission.id} mission={mission} indexedById={indexedById} />
      ))}
    </ul>
  )
}

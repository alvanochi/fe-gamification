'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import ErrorMessage from '@/components/elements/ErrorMessage'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import Pagination from '@/components/fragments/Pagination'
import {
  useDeleteMissionMutation,
  useMissionsQuery,
  useUpdateMissionMutation,
} from '@/hooks/use-missions'
import { useDebounce } from '@/hooks/use-debounce'
import { usePagination } from '@/hooks/use-pagination'
import { AppError } from '@/libs/api'
import QuestionEditor from '@/components/organisms/admin/QuestionEditor'
import { Mission, MissionType } from '@/types/mission'
import { MISSION_TYPE_ORDER, groupByMissionType } from '@/utils/mission/grouping'
import {
  MISSION_TYPE_LABEL as TYPE_LABEL,
  MISSION_TYPE_COLOR_VAR as TYPE_COLOR_VAR,
  MISSION_CATEGORY_LABEL,
  CLUE_TYPE_LABEL,
  PROOF_TYPE_LABEL,
  formatMissionPoints,
} from '@/utils/mission/type-meta'

function MissionRow({
  mission,
  indexedById,
  onEditQuestions,
}: {
  mission: Mission
  indexedById: Map<string, Mission>
  onEditQuestions: (mission: Mission) => void
}) {
  const prerequisite = mission.prerequisiteId ? indexedById.get(mission.prerequisiteId) : null
  const { mutate: update, isPending: isUpdating } = useUpdateMissionMutation()
  const { mutate: remove, isPending: isDeleting, error: deleteError } = useDeleteMissionMutation()

  const [pointDraft, setPointDraft] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const parsedPoint = Number(pointDraft)
  const pointValid = pointDraft !== null && Number.isInteger(parsedPoint) && parsedPoint >= 0

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

      {/* Poin disunting di tempat. Sebelumnya lewat prompt() bawaan peramban:
          tanpa gaya, tanpa validasi sampai ditutup, dan diblokir sebagian
          peramban seluler. */}
      {pointDraft !== null ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input
            className="w-32"
            type="number"
            min={0}
            value={pointDraft}
            onChange={e => setPointDraft(e.target.value)}
            error={!pointValid}
          />
          <Button
            size="sm"
            loading={isUpdating}
            disabled={!pointValid}
            onClick={() =>
              update(
                { missionId: mission.id, pointWeight: parsedPoint },
                { onSuccess: () => setPointDraft(null) },
              )
            }
          >
            Simpan Poin
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPointDraft(null)}>
            Batal
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {mission.type === 'KUIS' && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => onEditQuestions(mission)}
            >
              Kelola Pertanyaan
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => setPointDraft(String(mission.pointWeight))}
          >
            Ubah Poin
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            loading={isDeleting}
            onClick={() => setIsConfirmingDelete(true)}
          >
            Hapus
          </Button>
        </div>
      )}

      <ErrorMessage message={(deleteError as AppError | null)?.message} className="mt-2" />

      <ConfirmModal
        open={isConfirmingDelete}
        title={`Hapus misi "${mission.title}"?`}
        description="Misi yang sudah dikerjakan kelompok sebaiknya dibiarkan — riwayat penilaiannya menempel padanya."
        confirmLabel="Ya, hapus"
        confirmVariant="danger"
        loading={isDeleting}
        onConfirm={() => remove(mission.id, { onSettled: () => setIsConfirmingDelete(false) })}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </li>
  )
}

/**
 * Daftar misi milik Super Admin: dicari, berhalaman, dan dikelompokkan per
 * jenis misi — sama seperti yang dilihat peserta di layar misinya.
 */
export default function MissionList() {
  const { data: missions, isLoading, error } = useMissionsQuery()
  const [editingQuestions, setEditingQuestions] = useState<Mission | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<MissionType | 'SEMUA'>('SEMUA')
  const debounced = useDebounce(search, 300)

  const filtered = useMemo(() => {
    const keyword = debounced.trim().toLowerCase()
    return (missions ?? []).filter(m => {
      if (typeFilter !== 'SEMUA' && m.type !== typeFilter) return false
      if (!keyword) return true
      return `${m.title} ${m.description} ${m.locationName ?? ''} ${TYPE_LABEL[m.type]}`
        .toLowerCase()
        .includes(keyword)
    })
  }, [missions, debounced, typeFilter])

  const pagination = usePagination(filtered)

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
        Belum ada misi. Mulai dari tombol Buat Misi Baru di atas.
      </p>
    )
  }

  const indexedById = new Map(missions.map(m => [m.id, m]))

  // Editor pertanyaan menggantikan daftar sepenuhnya supaya panitia punya
  // ruang penuh saat menyusun soal — daftar misi bisa sangat panjang.
  if (editingQuestions) {
    return (
      <div className="rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg">
        <QuestionEditor mission={editingQuestions} onClose={() => setEditingQuestions(null)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Input
        type="search"
        value={search}
        onChange={e => {
          setSearch(e.target.value)
          pagination.resetPage()
        }}
        placeholder="Cari misi, lokasi, atau jenisnya…"
      />

      {/* Saringan per jenis misi. Dengan puluhan misi di satu acara, menyunting
          "semua Soal Lokasi" berarti memindai seluruh daftar tanpa ini. */}
      <div className="flex flex-wrap gap-2">
        {(['SEMUA', ...MISSION_TYPE_ORDER] as const).map(value => {
          const active = typeFilter === value
          const count =
            value === 'SEMUA'
              ? (missions ?? []).length
              : (missions ?? []).filter(m => m.type === value).length

          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setTypeFilter(value)
                pagination.resetPage()
              }}
              style={
                active && value !== 'SEMUA'
                  ? { backgroundColor: TYPE_COLOR_VAR[value], color: '#fff' }
                  : undefined
              }
              className={`rounded-full border-brut-sm px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide brutal-press-sm ${
                active && value === 'SEMUA'
                  ? 'bg-primary text-primary-ink'
                  : active
                    ? ''
                    : 'bg-paper-raised text-ink/70'
              }`}
            >
              {value === 'SEMUA' ? 'Semua jenis' : TYPE_LABEL[value]} ({count})
            </button>
          )
        })}
      </div>

      <Pagination
        page={pagination.page}
        perPage={pagination.perPage}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPerPageChange={pagination.setPerPage}
      />

      {filtered.length === 0 ? (
        <p className="rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
          Tidak ada misi yang cocok dengan pencarian dan saringanmu.
        </p>
      ) : (
        groupByMissionType(pagination.pageItems, mission => mission.type).map(group => (
          <section key={group.type}>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h2 className="font-display text-xl" style={{ color: TYPE_COLOR_VAR[group.type] }}>
                {TYPE_LABEL[group.type]}
              </h2>
              <span className="font-mono text-xs text-ink/40">{group.items.length} misi</span>
            </div>

            <ul className="mt-3 grid items-start gap-4 lg:grid-cols-2">
              {group.items.map(mission => (
                <MissionRow
                  key={mission.id}
                  mission={mission}
                  indexedById={indexedById}
                  onEditQuestions={setEditingQuestions}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

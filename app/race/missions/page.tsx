'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import Input from '@/components/elements/Input'
import MissionCard from '@/components/organisms/race/MissionCard'
import Pagination from '@/components/fragments/Pagination'
import AnnouncementPopup from '@/components/fragments/AnnouncementPopup'
import AppToast from '@/components/fragments/AppToast'
import QrPosPanel from '@/components/organisms/race/QrPosPanel'
import { useProfileQuery } from '@/hooks/use-profile'
import { useMissionBoardQuery, useMyCheckInsQuery } from '@/hooks/use-missions'
import { useMyGroupSubmissionsQuery } from '@/hooks/use-submissions'
import { useMyAssignmentsQuery } from '@/hooks/use-barter'
import { useDebounce } from '@/hooks/use-debounce'
import { DEFAULT_PER_PAGE } from '@/hooks/use-pagination'
import { useSettingsQuery } from '@/hooks/use-settings'
import { useRealtime } from '@/hooks/use-realtime'
import { MISSION_TYPE_COLOR_VAR, MISSION_TYPE_LABEL } from '@/utils/mission/type-meta'
import { MISSION_TYPE_ORDER, STATUS_META, STATUS_ORDER, groupByMissionType } from '@/utils/mission/grouping'
import type { MissionBoardStatus, MissionType } from '@/types/mission'

type StatusFilter = 'SEMUA' | MissionBoardStatus
type TypeFilter = 'SEMUA' | MissionType

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'SEMUA', label: 'Semua' },
  { value: 'BELUM', label: STATUS_META.BELUM.title },
  { value: 'MENUNGGU', label: STATUS_META.MENUNGGU.title },
  { value: 'SELESAI', label: STATUS_META.SELESAI.title },
]

/** Tombol saringan berbentuk pil, dipakai baris status maupun baris jenis misi. */
function FilterChip({
  active,
  label,
  count,
  color,
  onClick,
}: {
  active: boolean
  label: string
  count?: number
  color?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={active && color ? { backgroundColor: color, color: '#fff' } : undefined}
      className={`rounded-full border-brut-sm px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide brutal-press-sm ${
        active && !color ? 'bg-primary text-primary-ink' : active ? '' : 'bg-paper-raised text-ink/70'
      }`}
    >
      {label}
      {count !== undefined && ` (${count})`}
    </button>
  )
}

export default function RaceMissionsPage() {
  const router = useRouter()
  const profileQuery = useProfileQuery()
  const submissionsQuery = useMyGroupSubmissionsQuery()
  const checkInsQuery = useMyCheckInsQuery()
  const assignmentsQuery = useMyAssignmentsQuery()
  const settingsQuery = useSettingsQuery()
  useRealtime(profileQuery.data?.groupId ?? null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('SEMUA')
  const [type, setType] = useState<TypeFilter>('SEMUA')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const debouncedSearch = useDebounce(search, 300)

  // Pencarian, saringan, pengelompokan, dan pemenggalan halaman semuanya
  // dikerjakan server. Kalau tidak, mencari "beringharjo" hanya menemukan misi
  // yang kebetulan ada di halaman yang sedang dibuka.
  const boardQuery = useMissionBoardQuery({
    search: debouncedSearch.trim(),
    status,
    type,
    urgent: urgentOnly,
    page,
    perPage,
  })
  const board = boardQuery.data

  const profile = profileQuery.data
  const hasNoGroup = !profileQuery.isLoading && !profile?.groupId

  useEffect(() => {
    if (hasNoGroup) router.replace('/race')
  }, [hasNoGroup, router])

  // Mengubah saringan berarti daftar yang lain sama sekali — mulai lagi dari
  // halaman pertama, bukan bertahan di nomor halaman lama.
  const changeFilter = (apply: () => void) => {
    apply()
    setPage(1)
  }

  const initialLoading = profileQuery.isLoading || (!board && boardQuery.isLoading)

  // Panitia mengumpulkan peserta untuk briefing lebih dulu; daftar misi baru
  // muncul setelah tombol "Munculkan Misi" ditekan.
  if (!initialLoading && settingsQuery.data && !settingsQuery.data.missionsReleased) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-4 text-center">
        <AnnouncementPopup />
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
          Menunggu Aba-aba
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">MISI BELUM DIBUKA</h1>
        <p className="mt-3 max-w-sm text-sm text-ink/60">
          Panitia masih memberi pengarahan. Daftar misi akan muncul sendiri di layar ini begitu
          permainan resmi dimulai.
        </p>
        <span className="mt-6 h-4 w-4 animate-spin rounded-full border-2 border-ink/40 border-t-transparent" />
        <Link href="/race" className="mt-8 font-mono text-xs uppercase tracking-widest text-secondary">
          ← Kembali
        </Link>
      </div>
    )
  }

  if (initialLoading || hasNoGroup || !board) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4">
        <CardSkeleton className="w-full max-w-xl" />
      </div>
    )
  }

  const submissions = submissionsQuery.data ?? []
  const checkIns = checkInsQuery.data ?? []
  const assignments = assignmentsQuery.data ?? []

  const totalMissions = board.counts.SEMUA
  const progress = totalMissions
    ? Math.round((board.counts.SELESAI / totalMissions) * 100)
    : 0

  const isFiltering =
    !!debouncedSearch.trim() || status !== 'SEMUA' || type !== 'SEMUA' || urgentOnly

  return (
    <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
      <AnnouncementPopup />
      <AppToast />
      {/* QR peserta dipakai petugas pos sepanjang perlombaan, jadi ia harus
          terjangkau dari layar misi — bukan hanya dari rangkaian checkpoint
          yang sudah ditinggalkan. */}
      <QrPosPanel />

      <div className="mx-auto max-w-5xl">
        <Link href="/race" className="font-mono text-xs uppercase tracking-widest text-secondary">
          ← Kembali
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Misi Saya</h1>

        {totalMissions === 0 && !isFiltering ? (
          <p className="mt-8 rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
            Belum ada misi yang bisa dikerjakan saat ini.
          </p>
        ) : (
          <>
            {/* Kemajuan tim dalam satu baris — lebih cepat ditangkap daripada
                menghitung sendiri dari daftar. */}
            <div className="mt-4 rounded-md border-brut bg-paper-raised px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-bold text-ink">
                  {board.counts.SELESAI} dari {totalMissions} misi selesai
                </p>
                <p className="font-mono text-xs text-ink/50">
                  {board.counts.MENUNGGU} menunggu validasi · {board.counts.BELUM} belum
                </p>
              </div>
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Kemajuan misi tim"
                className="mt-2 h-3 w-full overflow-hidden rounded-full border-brut-sm bg-paper"
              >
                <div
                  className="h-full bg-success transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Menempel di atas saat menggulir — dengan puluhan misi, kolom cari
                yang ikut hilang ke atas membuat pencarian jadi merepotkan. */}
            <div className="sticky top-0 z-30 -mx-4 mt-6 space-y-3 border-b-brut bg-paper px-4 py-4 sm:-mx-8 sm:px-8">
              <Input
                type="search"
                value={search}
                onChange={e => changeFilter(() => setSearch(e.target.value))}
                placeholder="Cari misi, lokasi, atau jenisnya…"
              />

              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map(filter => (
                  <FilterChip
                    key={filter.value}
                    active={status === filter.value}
                    label={filter.label}
                    count={board.counts[filter.value]}
                    onClick={() => changeFilter(() => setStatus(filter.value))}
                  />
                ))}
              </div>

              {/* Baris kedua: jenis misi, dan misi yang sesinya hampir tutup.
                  Keduanya menyaring seluruh misi, bukan halaman ini saja. */}
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  active={urgentOnly}
                  label={`⏳ Mendesak`}
                  count={board.urgentCount}
                  color="var(--color-danger)"
                  onClick={() => changeFilter(() => setUrgentOnly(v => !v))}
                />
                <FilterChip
                  active={type === 'SEMUA'}
                  label="Semua jenis"
                  onClick={() => changeFilter(() => setType('SEMUA'))}
                />
                {MISSION_TYPE_ORDER.map(missionType => (
                  <FilterChip
                    key={missionType}
                    active={type === missionType}
                    label={MISSION_TYPE_LABEL[missionType]}
                    count={board.typeCounts[missionType] ?? 0}
                    color={MISSION_TYPE_COLOR_VAR[missionType]}
                    onClick={() => changeFilter(() => setType(missionType))}
                  />
                ))}
              </div>

              {urgentOnly && (
                <p className="text-xs text-ink/55">
                  Menampilkan misi wajib dan misi yang sesinya tutup dalam{' '}
                  {board.urgentWindowMinutes} menit ke depan.
                </p>
              )}
            </div>

            {board.items.length === 0 ? (
              <p className="mt-8 rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
                Tidak ada misi yang cocok dengan pencarian dan saringanmu.
              </p>
            ) : (
              <div className="mt-6 space-y-8">
                {/* Di atas daftar: dengan kartu misi setinggi ini, kendali
                    halaman di kaki daftar berarti menggulir jauh hanya untuk
                    pindah halaman. */}
                <Pagination
                  page={board.page}
                  perPage={board.perPage}
                  total={board.total}
                  totalPages={board.totalPages}
                  onPageChange={setPage}
                  onPerPageChange={value => changeFilter(() => setPerPage(value))}
                />

                {STATUS_ORDER.map(key => {
                  // Server sudah mengurutkan daftarnya mengikuti urutan bagian
                  // ini, jadi satu bagian jarang terpotong dua halaman.
                  const inSection = board.items.filter(m => m.groupStatus === key)
                  if (inSection.length === 0) return null

                  const meta = STATUS_META[key]
                  return (
                    <section key={key}>
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <h2 className={`font-display text-xl ${meta.accent}`}>{meta.title}</h2>
                        <span className="font-mono text-xs text-ink/40">
                          {inSection.length} di halaman ini · {board.counts[key]} total
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-ink/55">{meta.hint}</p>

                      {/* Lapis kedua: di dalam satu bagian, misi dikelompokkan
                          lagi per jenis soalnya — tantangan, barter, dan kuis
                          adalah tiga cara kerja yang berbeda, dan mencampurnya
                          membuat tim membaca ulang tiap kartu untuk tahu mana
                          yang sedang mereka hadapi. */}
                      {groupByMissionType(inSection, mission => mission.type).map(group => (
                        <div key={group.type} className="mt-4">
                          <span
                            className="inline-block rounded-full border-brut-sm px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white"
                            style={{ backgroundColor: MISSION_TYPE_COLOR_VAR[group.type] }}
                          >
                            {MISSION_TYPE_LABEL[group.type]} · {group.items.length}
                          </span>

                          <ul className="mt-3 grid items-start gap-4 lg:grid-cols-2">
                            {group.items.map(mission => (
                              <MissionCard
                                key={mission.id}
                                mission={mission}
                                submissions={submissions}
                                checkIn={checkIns.find(c => c.missionId === mission.id) ?? null}
                                assignment={
                                  assignments.find(a => a.missionId === mission.id) ?? null
                                }
                              />
                            ))}
                          </ul>
                        </div>
                      ))}
                    </section>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

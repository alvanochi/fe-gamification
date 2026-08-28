'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Select from '@/components/elements/Select'
import MissionCard from '@/components/organisms/race/MissionCard'
import Pagination from '@/components/fragments/Pagination'
import AnnouncementPopup from '@/components/fragments/AnnouncementPopup'
import AppToast from '@/components/fragments/AppToast'
import { useProfileQuery } from '@/hooks/use-profile'
import { useMissionBoardQuery, useMyCheckInsQuery } from '@/hooks/use-missions'
import { useMyGroupSubmissionsQuery } from '@/hooks/use-submissions'
import { useMyAssignmentsQuery } from '@/hooks/use-barter'
import { useDebounce } from '@/hooks/use-debounce'
import { DEFAULT_PER_PAGE } from '@/hooks/use-pagination'
import { useRealtime } from '@/hooks/use-realtime'
import {
  MISSION_CATEGORY_LABEL,
  MISSION_TYPE_COLOR_VAR,
  MISSION_TYPE_LABEL,
} from '@/utils/mission/type-meta'
import { MISSION_TYPE_ORDER, STATUS_META, STATUS_ORDER, groupByMissionType } from '@/utils/mission/grouping'
import type { MissionBoardStatus, MissionCategory, MissionType } from '@/types/mission'

type StatusFilter = 'SEMUA' | MissionBoardStatus
type TypeFilter = 'SEMUA' | MissionType
type CategoryFilter = 'SEMUA' | MissionCategory

/**
 * Terstruktur vs Mandiri adalah pembagian yang paling menentukan langkah
 * berikutnya: yang terstruktur harus didatangi pada jam sesinya dan ada
 * petugas yang menunggu, yang mandiri bisa dikerjakan kapan saja di jalan.
 * Karena itu ia berdiri sebagai pil sendiri, bukan sekadar pilihan di dalam
 * dropdown jenis misi.
 */
const CATEGORY_FILTERS: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'SEMUA', label: 'Semua' },
  { value: 'TERSTRUKTUR', label: MISSION_CATEGORY_LABEL.TERSTRUKTUR },
  { value: 'MANDIRI', label: MISSION_CATEGORY_LABEL.MANDIRI },
]

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string; short: string }> = [
  { value: 'SEMUA', label: 'Semua', short: 'Semua' },
  { value: 'BELUM', label: STATUS_META.BELUM.title, short: 'Belum' },
  { value: 'MENUNGGU', label: STATUS_META.MENUNGGU.title, short: 'Menunggu' },
  { value: 'SELESAI', label: STATUS_META.SELESAI.title, short: 'Selesai' },
]

export default function RaceMissionsPage() {
  const router = useRouter()
  const profileQuery = useProfileQuery()
  const submissionsQuery = useMyGroupSubmissionsQuery()
  const checkInsQuery = useMyCheckInsQuery()
  const assignmentsQuery = useMyAssignmentsQuery()
  useRealtime(profileQuery.data?.groupId ?? null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('SEMUA')
  const [type, setType] = useState<TypeFilter>('SEMUA')
  const [category, setCategory] = useState<CategoryFilter>('SEMUA')
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
    category,
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
    !!debouncedSearch.trim() ||
    status !== 'SEMUA' ||
    type !== 'SEMUA' ||
    category !== 'SEMUA' ||
    urgentOnly

  return (
    <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
      <AnnouncementPopup />
      <AppToast />

      <div className="mx-auto max-w-5xl">
        <Link href="/race" className="font-mono text-xs uppercase tracking-widest text-secondary">
          ← Kembali
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Misi Saya</h1>

        {/* Sebelum aba-aba: daftarnya tetap terbaca, isinya belum bisa dibuka.
            Menyembunyikan seluruh halaman selama briefing membuat layar ini
            terasa rusak, dan tim tidak punya gambaran apa yang akan dihadapi. */}
        {!board.missionsReleased && (
          <div className="mt-4 flex items-start gap-3 rounded-md border-brut !border-warning bg-warning/10 px-4 py-3">
            <span aria-hidden className="text-xl">🔒</span>
            <div>
              <p className="font-bold text-ink">Misi belum dibuka panitia</p>
              <p className="mt-0.5 text-sm text-ink/60">
                Judulnya sudah bisa kamu lihat. Rinciannya terbuka sendiri di layar ini begitu
                panitia memberi aba-aba — tidak perlu memuat ulang.
              </p>
            </div>
          </div>
        )}

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
                placeholder="🔎  Cari misi, lokasi, atau jenisnya…"
              />

              {/* Status sebagai satu batang bersegmen: empat pilihan yang saling
                  meniadakan, jadi bentuknya pun harus terbaca sebagai satu
                  pilihan — bukan empat tombol yang bisa ditekan bersamaan. */}
              <div
                role="tablist"
                aria-label="Saring menurut status"
                className="flex overflow-hidden rounded-md border-brut bg-paper-raised"
              >
                {STATUS_FILTERS.map(filter => {
                  const active = status === filter.value
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => changeFilter(() => setStatus(filter.value))}
                      className={`flex-1 border-r border-ink/10 px-2 py-2 text-center last:border-r-0 brutal-press-sm ${
                        active ? 'bg-primary text-primary-ink' : 'text-ink/60'
                      }`}
                    >
                      <span className="block text-lg font-bold leading-none tabular-nums">
                        {board.counts[filter.value]}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wide">
                        {filter.short}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex overflow-hidden rounded-md border-brut">
                  {CATEGORY_FILTERS.map(filter => {
                    const active = category === filter.value
                    const count =
                      filter.value === 'SEMUA'
                        ? board.counts.SEMUA
                        : board.categoryCounts[filter.value]

                    return (
                      <button
                        key={filter.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => changeFilter(() => setCategory(filter.value))}
                        className={`px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-wide brutal-press-sm ${
                          active ? 'bg-ink text-paper' : 'bg-paper-raised text-ink/70'
                        }`}
                      >
                        {filter.label} ({count ?? 0})
                      </button>
                    )
                  })}
                </div>

                {/* Jenis misi lewat dropdown: di layar ponsel, lima pil
                    berjejer memakan dua baris penuh dan menggeser daftarnya
                    turun setiap kali halaman dibuka. */}
                <Select
                  className="w-auto flex-1 sm:flex-none"
                  aria-label="Saring menurut jenis misi"
                  value={type}
                  onChange={e => changeFilter(() => setType(e.target.value as TypeFilter))}
                >
                  <option value="SEMUA">Semua jenis misi</option>
                  {MISSION_TYPE_ORDER.map(missionType => (
                    <option key={missionType} value={missionType}>
                      {MISSION_TYPE_LABEL[missionType]} ({board.typeCounts[missionType] ?? 0})
                    </option>
                  ))}
                </Select>

                <button
                  type="button"
                  aria-pressed={urgentOnly}
                  onClick={() => changeFilter(() => setUrgentOnly(v => !v))}
                  className={`rounded-md border-brut px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-wide brutal-press-sm ${
                    urgentOnly ? 'bg-danger text-white' : 'bg-paper-raised text-ink/70'
                  }`}
                >
                  ⏳ Mendesak ({board.urgentCount})
                </button>

                {isFiltering && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      changeFilter(() => {
                        setSearch('')
                        setStatus('SEMUA')
                        setType('SEMUA')
                        setCategory('SEMUA')
                        setUrgentOnly(false)
                      })
                    }
                  >
                    Hapus saringan
                  </Button>
                )}
              </div>

              {/* Satu kalimat yang menyebut apa yang sedang dilihat. Tanpa ini,
                  daftar yang tiba-tiba pendek terbaca sebagai misi yang hilang,
                  bukan sebagai saringan yang masih menyala. */}
              {isFiltering && (
                <p className="text-xs text-ink/55">
                  Menampilkan <strong className="text-ink">{board.total} misi</strong>
                  {status !== 'SEMUA' && ` · ${STATUS_META[status].title.toLowerCase()}`}
                  {type !== 'SEMUA' && ` · ${MISSION_TYPE_LABEL[type]}`}
                  {category !== 'SEMUA' && ` · ${MISSION_CATEGORY_LABEL[category]}`}
                  {urgentOnly && ` · mendesak (sesi tutup ≤ ${board.urgentWindowMinutes} menit)`}
                  {debouncedSearch.trim() && ` · pencarian “${debouncedSearch.trim()}”`}
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

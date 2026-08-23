'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import MissionCard from '@/components/organisms/race/MissionCard'
import Pagination from '@/components/fragments/Pagination'
import AnnouncementPopup from '@/components/fragments/AnnouncementPopup'
import ValidationToast from '@/components/fragments/ValidationToast'
import BoardingPassPanel from '@/components/organisms/race/BoardingPassPanel'
import { useProfileQuery } from '@/hooks/use-profile'
import { useMissionsQuery, useMyCheckInsQuery } from '@/hooks/use-missions'
import { useMyGroupSubmissionsQuery } from '@/hooks/use-submissions'
import { useMyAssignmentsQuery } from '@/hooks/use-barter'
import { useDebounce } from '@/hooks/use-debounce'
import { useSettingsQuery } from '@/hooks/use-settings'
import { useRealtime } from '@/hooks/use-realtime'
import { MISSION_CATEGORY_LABEL, MISSION_TYPE_LABEL } from '@/utils/mission/type-meta'
import {
  SECTION_META,
  SECTION_ORDER,
  sectionOf,
  sortBySection,
  statusOf,
  type MissionStatus,
} from '@/utils/mission/grouping'

type StatusFilter = 'SEMUA' | MissionStatus

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'SEMUA', label: 'Semua' },
  { value: 'BELUM', label: 'Belum Dikerjakan' },
  { value: 'MENUNGGU', label: 'Menunggu Validasi' },
  { value: 'SELESAI', label: 'Selesai' },
]

export default function RaceMissionsPage() {
  const router = useRouter()
  const profileQuery = useProfileQuery()
  const missionsQuery = useMissionsQuery()
  const submissionsQuery = useMyGroupSubmissionsQuery()
  const checkInsQuery = useMyCheckInsQuery()
  const assignmentsQuery = useMyAssignmentsQuery()
  const settingsQuery = useSettingsQuery()
  useRealtime(profileQuery.data?.groupId ?? null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('SEMUA')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const debouncedSearch = useDebounce(search, 300)

  // Mengubah saringan berarti daftar yang lain sama sekali — mulai lagi dari
  // halaman pertama, bukan bertahan di nomor halaman lama.
  const changeFilter = (apply: () => void) => {
    apply()
    setPage(1)
  }

  const profile = profileQuery.data
  const hasNoGroup = !profileQuery.isLoading && !profile?.groupId

  useEffect(() => {
    if (hasNoGroup) router.replace('/race')
  }, [hasNoGroup, router])

  const missions = useMemo(() => missionsQuery.data ?? [], [missionsQuery.data])
  const submissions = useMemo(() => submissionsQuery.data ?? [], [submissionsQuery.data])

  const visibleMissions = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase()

    const filtered = missions.filter(mission => {
      if (status !== 'SEMUA' && statusOf(mission, submissions) !== status) return false
      if (!keyword) return true

      // Cocokkan juga ke lokasi & kategori supaya peserta bisa mencari
      // "beringharjo" atau "terstruktur", bukan cuma judul misi.
      return [
        mission.title,
        mission.description,
        mission.locationName ?? '',
        MISSION_CATEGORY_LABEL[mission.category],
        MISSION_TYPE_LABEL[mission.type],
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })

    return sortBySection(filtered, submissions)
  }, [missions, submissions, status, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(visibleMissions.length / perPage))
  // Hasil pencarian bisa menyusut sementara pembaca masih di halaman jauh;
  // dijepit saat render supaya layarnya tidak pernah kosong.
  const safePage = Math.min(page, totalPages)
  const pageItems = visibleMissions.slice((safePage - 1) * perPage, safePage * perPage)

  const initialLoading =
    profileQuery.isLoading || missionsQuery.isLoading || submissionsQuery.isLoading

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

  if (initialLoading || hasNoGroup) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4">
        <CardSkeleton className="w-full max-w-xl" />
      </div>
    )
  }

  const checkIns = checkInsQuery.data ?? []
  const assignments = assignmentsQuery.data ?? []

  const counts = {
    SEMUA: missions.length,
    BELUM: missions.filter(m => statusOf(m, submissions) === 'BELUM').length,
    MENUNGGU: missions.filter(m => statusOf(m, submissions) === 'MENUNGGU').length,
    SELESAI: missions.filter(m => statusOf(m, submissions) === 'SELESAI').length,
  }

  const progress = missions.length ? Math.round((counts.SELESAI / missions.length) * 100) : 0

  return (
    <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
      <AnnouncementPopup />
      <ValidationToast />
      {/* QR peserta dipakai petugas pos sepanjang perlombaan, jadi ia harus
          terjangkau dari layar misi — bukan hanya dari rangkaian checkpoint
          yang sudah ditinggalkan. */}
      <BoardingPassPanel />

      <div className="mx-auto max-w-5xl">
        <Link href="/race" className="font-mono text-xs uppercase tracking-widest text-secondary">
          ← Kembali
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Misi Saya</h1>

        {missions.length === 0 ? (
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
                  {counts.SELESAI} dari {missions.length} misi selesai
                </p>
                <p className="font-mono text-xs text-ink/50">
                  {counts.MENUNGGU} menunggu validasi · {counts.BELUM} belum
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
            <div className="sticky top-0 z-30 -mx-4 mt-6 border-b-brut bg-paper px-4 py-4 sm:-mx-8 sm:px-8">
              <input
                type="search"
                value={search}
                onChange={e => changeFilter(() => setSearch(e.target.value))}
                placeholder="Cari misi, lokasi, atau kategori…"
                className="w-full rounded-md border-brut bg-paper-raised px-4 py-3 font-medium text-ink shadow-brutal-sm focus:outline-none"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => changeFilter(() => setStatus(filter.value))}
                    aria-pressed={status === filter.value}
                    className={`rounded-full border-brut-sm px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide brutal-press-sm ${
                      status === filter.value
                        ? 'bg-primary text-primary-ink'
                        : 'bg-paper-raised text-ink/70'
                    }`}
                  >
                    {filter.label} ({counts[filter.value]})
                  </button>
                ))}
              </div>
            </div>

            {visibleMissions.length === 0 ? (
              <p className="mt-8 rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
                Tidak ada misi yang cocok dengan pencarianmu.
              </p>
            ) : (
              <div className="mt-6 space-y-8">
                {/* Di atas daftar: dengan kartu misi setinggi ini, kendali
                    halaman di kaki daftar berarti menggulir jauh hanya untuk
                    pindah halaman. */}
                <Pagination
                  page={safePage}
                  perPage={perPage}
                  total={visibleMissions.length}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  onPerPageChange={value => changeFilter(() => setPerPage(value))}
                />
                {SECTION_ORDER.map(key => {
                  // Tiap halaman menampilkan bagian yang kebetulan jatuh di
                  // dalamnya; daftar sudah diurutkan mengikuti urutan bagian,
                  // jadi satu bagian jarang terpotong dua halaman.
                  const inSection = pageItems.filter(m => sectionOf(m, submissions) === key)
                  if (inSection.length === 0) return null

                  const meta = SECTION_META[key]
                  return (
                    <section key={key}>
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <h2 className={`font-display text-xl ${meta.accent}`}>{meta.title}</h2>
                        <span className="font-mono text-xs text-ink/40">{inSection.length} misi</span>
                      </div>
                      <p className="mt-0.5 text-sm text-ink/55">{meta.hint}</p>

                      <ul className="mt-3 grid items-start gap-4 lg:grid-cols-2">
                        {inSection.map(mission => (
                          <MissionCard
                            key={mission.id}
                            mission={mission}
                            submissions={submissions}
                            checkIn={checkIns.find(c => c.missionId === mission.id) ?? null}
                            assignment={assignments.find(a => a.missionId === mission.id) ?? null}
                          />
                        ))}
                      </ul>
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

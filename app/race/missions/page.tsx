'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import MissionCard from '@/components/organisms/race/MissionCard'
import { useProfileQuery } from '@/hooks/use-profile'
import { useMissionsQuery, useMyCheckInsQuery } from '@/hooks/use-missions'
import { useMyGroupSubmissionsQuery } from '@/hooks/use-submissions'
import { useMyAssignmentsQuery } from '@/hooks/use-barter'
import { useDebounce } from '@/hooks/use-debounce'
import { useSettingsQuery } from '@/hooks/use-settings'
import { useRealtime } from '@/hooks/use-realtime'
import AnnouncementPopup from '@/components/fragments/AnnouncementPopup'
import { getLatestSubmissionForMission } from '@/utils/mission/submission-status'
import { MISSION_CATEGORY_LABEL, MISSION_TYPE_LABEL } from '@/utils/mission/type-meta'
import { Mission, Submission } from '@/types/mission'

type StatusFilter = 'SEMUA' | 'BELUM' | 'MENUNGGU' | 'SELESAI'

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'SEMUA', label: 'Semua' },
  { value: 'BELUM', label: 'Belum Dikerjakan' },
  { value: 'MENUNGGU', label: 'Menunggu Validasi' },
  { value: 'SELESAI', label: 'Selesai' },
]

const statusOf = (mission: Mission, submissions: Submission[]): StatusFilter => {
  const latest = getLatestSubmissionForMission(submissions, mission.id)
  if (!latest || latest.status === 'REJECTED') return 'BELUM'
  return latest.status === 'APPROVED' ? 'SELESAI' : 'MENUNGGU'
}

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
  const debouncedSearch = useDebounce(search, 300)

  const profile = profileQuery.data
  const hasNoGroup = !profileQuery.isLoading && !profile?.groupId

  useEffect(() => {
    if (hasNoGroup) router.replace('/race')
  }, [hasNoGroup, router])

  const missions = useMemo(() => missionsQuery.data ?? [], [missionsQuery.data])
  const submissions = useMemo(() => submissionsQuery.data ?? [], [submissionsQuery.data])

  const visibleMissions = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase()

    return missions.filter(mission => {
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
  }, [missions, submissions, status, debouncedSearch])

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

  return (
    <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
      <AnnouncementPopup />
      <div className="mx-auto max-w-5xl">
        <Link href="/race" className="font-mono text-xs uppercase tracking-widest text-secondary">
          ← Kembali
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Misi Saya</h1>
        <p className="mt-2 text-sm text-ink/60">
          Kerjakan misi bersama timmu untuk mengumpulkan poin. Misi wajib harus diselesaikan lebih
          dulu.
        </p>

        {missions.length === 0 ? (
          <p className="mt-8 rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
            Belum ada misi yang bisa dikerjakan saat ini.
          </p>
        ) : (
          <>
            {/* Menempel di atas saat menggulir — dengan puluhan misi, kolom cari
                yang ikut hilang ke atas membuat pencarian jadi merepotkan. */}
            <div className="sticky top-0 z-30 -mx-4 mt-6 border-b-brut bg-paper px-4 py-4 sm:-mx-8 sm:px-8">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari misi, lokasi, atau kategori…"
                className="w-full rounded-md border-brut bg-paper-raised px-4 py-3 font-medium text-ink shadow-brutal-sm focus:outline-none"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatus(filter.value)}
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
              <>
                <p className="mt-6 font-mono text-xs uppercase tracking-widest text-ink/45">
                  Menampilkan {visibleMissions.length} dari {missions.length} misi
                </p>

                {/* Dua kolom di layar lebar supaya tidak menumpuk memanjang.
                    items-start menjaga tiap kartu setinggi isinya sendiri. */}
                <ul className="mt-3 grid items-start gap-4 lg:grid-cols-2">
                  {visibleMissions.map(mission => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      submissions={submissions}
                      checkIn={checkIns.find(c => c.missionId === mission.id) ?? null}
                      assignment={assignments.find(a => a.missionId === mission.id) ?? null}
                    />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import MissionCard from '@/components/organisms/race/MissionCard'
import { useProfileQuery } from '@/hooks/use-profile'
import { useMissionsQuery, useMyCheckInsQuery } from '@/hooks/use-missions'
import { useMyGroupSubmissionsQuery } from '@/hooks/use-submissions'

export default function RaceMissionsPage() {
  const router = useRouter()
  const profileQuery = useProfileQuery()
  const missionsQuery = useMissionsQuery()
  const submissionsQuery = useMyGroupSubmissionsQuery()
  const checkInsQuery = useMyCheckInsQuery()

  const profile = profileQuery.data
  const hasNoGroup = !profileQuery.isLoading && !profile?.groupId

  useEffect(() => {
    if (hasNoGroup) router.replace('/race')
  }, [hasNoGroup, router])

  const initialLoading = profileQuery.isLoading || missionsQuery.isLoading || submissionsQuery.isLoading

  if (initialLoading || hasNoGroup) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4">
        <CardSkeleton className="w-full max-w-xl" />
      </div>
    )
  }

  const missions = missionsQuery.data ?? []
  const submissions = submissionsQuery.data ?? []
  const checkIns = checkInsQuery.data ?? []

  return (
    <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/race" className="font-mono text-xs uppercase tracking-widest text-secondary">
          ← Kembali
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Misi Saya</h1>
        <p className="mt-2 text-sm text-ink/60">
          Kerjakan misi bersama timmu untuk mengumpulkan poin. Misi wajib harus diselesaikan lebih dulu.
        </p>

        {missions.length === 0 ? (
          <p className="mt-8 rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
            Belum ada misi yang bisa dikerjakan saat ini.
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {missions.map(mission => (
              <MissionCard
                key={mission.id}
                mission={mission}
                submissions={submissions}
                checkIn={checkIns.find(c => c.missionId === mission.id) ?? null}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

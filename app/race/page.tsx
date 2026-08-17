'use client'

import Link from 'next/link'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import NoGroupStep from '@/components/organisms/race/NoGroupStep'
import GroupSelfieStep from '@/components/organisms/race/GroupSelfieStep'
import VoteLeaderStep from '@/components/organisms/race/VoteLeaderStep'
import NameGroupStep from '@/components/organisms/race/NameGroupStep'
import YelYelStep from '@/components/organisms/race/YelYelStep'
import GroupSuccessScreen from '@/components/organisms/race/GroupSuccessScreen'
import BoardingPassPanel from '@/components/organisms/race/BoardingPassPanel'
import CheckInGate from '@/components/organisms/race/CheckInGate'
import LogoutButton from '@/components/fragments/LogoutButton'
import AnnouncementPopup from '@/components/fragments/AnnouncementPopup'
import { useRealtime } from '@/hooks/use-realtime'
import { useProfileQuery } from '@/hooks/use-profile'
import { useGroupQuery } from '@/hooks/use-group'

export default function RacePage() {
  // Disegarkan berkala agar gerbang kehadiran membuka sendiri setelah dipindai.
  const profileQuery = useProfileQuery({ refetchInterval: 3000 })
  const profile = profileQuery.data
  const groupId = profile?.groupId ?? null

  // Stop polling once the group has been deliberately named — nothing about
  // the flow changes after that, so there's no reason to keep hammering the API.
  // Realtime: perubahan anggota, foto, voting, dan ketua tampil serentak di
  // semua perangkat kelompok tanpa menunggu polling.
  useRealtime(groupId)

  // Berhenti menyegarkan begitu onboarding benar-benar tuntas — termasuk
  // yel-yel, yang tenggatnya masih berjalan setelah kelompok dinamai.
  const groupQuery = useGroupQuery(groupId, query => {
    const data = query.state.data
    if (!data?.nameSetAt) return 3000
    return data.yelYel && !data.yelYel.done ? 3000 : false
  })
  const initialLoading =
    profileQuery.isLoading || (!!groupId && groupQuery.isLoading)

  const isPanitia = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN'

  const adminLink = isPanitia ? (
    <Link
      href="/admin/missions"
      className="fixed right-4 top-4 z-50 rounded-md border-brut bg-secondary px-4 py-2 font-display text-xs uppercase text-secondary-ink shadow-brutal-sm brutal-press-sm"
    >
      Panel Panitia
    </Link>
  ) : null

  // Ditempelkan di setiap checkpoint, bukan hanya di layar sukses — peserta
  // perlu menunjukkan QR-nya sejak tiba di meja registrasi.
  const chrome = (
    <>
      <AnnouncementPopup />
      <LogoutButton floating />
      {adminLink}
      <BoardingPassPanel />
    </>
  )

  if (initialLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4">
        <CardSkeleton className="w-full max-w-xl" />
      </div>
    )
  }

  if (!profile) return null

  // Gerbang kehadiran: peserta yang belum dipindai panitia berhenti di sini.
  // Panitia tidak ikut dipindai, jadi tidak dihadang.
  if (profile.role === 'PARTICIPANT' && !profile.checkInAt) {
    return (
      <>
        <LogoutButton floating />
        <CheckInGate profile={profile} />
      </>
    )
  }

  if (!groupId || !groupQuery.data) {
    return (
      <>
        {chrome}
        <NoGroupStep />
      </>
    )
  }

  const group = groupQuery.data

  // Selfie kelompok menggantikan langkah saling mencentang: satu foto bersama
  // sudah membuktikan mereka berkumpul, dan jauh lebih cepat.
  if (!group.leaderId && !group.photoCompletedAt) {
    return (
      <>
        {chrome}
        <GroupSelfieStep group={group} myId={profile.id} />
      </>
    )
  }

  if (!group.leaderId) {
    return (
      <>
        {chrome}
        <VoteLeaderStep group={group} myId={profile.id} />
      </>
    )
  }

  if (!group.nameSetAt) {
    return (
      <>
        {chrome}
        <NameGroupStep group={group} myId={profile.id} />
      </>
    )
  }

  // Yel-yel menutup rangkaian checkpoint. Kelompok yang sudah mengirimnya,
  // memilih melewatinya, atau kehabisan waktu langsung lanjut ke perlombaan.
  if (group.yelYel && !group.yelYel.done) {
    return (
      <>
        {chrome}
        <YelYelStep group={group} yelYel={group.yelYel} myId={profile.id} />
      </>
    )
  }

  return (
    <>
      {chrome}
      <GroupSuccessScreen group={group} />
    </>
  )
}

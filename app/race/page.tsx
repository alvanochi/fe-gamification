'use client'

import Link from 'next/link'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import NoGroupStep from '@/components/organisms/race/NoGroupStep'
import ConfirmMembersStep from '@/components/organisms/race/ConfirmMembersStep'
import GroupPhotoStep from '@/components/organisms/race/GroupPhotoStep'
import VoteLeaderStep from '@/components/organisms/race/VoteLeaderStep'
import NameGroupStep from '@/components/organisms/race/NameGroupStep'
import GroupSuccessScreen from '@/components/organisms/race/GroupSuccessScreen'
import { useProfileQuery } from '@/hooks/use-profile'
import { useConfirmationsQuery, useGroupQuery } from '@/hooks/use-group'
import { areAllPairsConfirmed } from '@/utils/group/confirmation'

export default function RacePage() {
  const profileQuery = useProfileQuery()
  const profile = profileQuery.data
  const groupId = profile?.groupId ?? null

  // Stop polling once the group has been deliberately named — nothing about
  // the flow changes after that, so there's no reason to keep hammering the API.
  const groupQuery = useGroupQuery(groupId, query => (query.state.data?.nameSetAt ? false : 3000))
  const confirmationsQuery = useConfirmationsQuery(groupId, () =>
    groupQuery.data?.nameSetAt ? false : 3000,
  )

  const initialLoading =
    profileQuery.isLoading || (!!groupId && (groupQuery.isLoading || confirmationsQuery.isLoading))

  const isPanitia = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN'

  const adminLink = isPanitia ? (
    <Link
      href="/admin/missions"
      className="fixed right-4 top-4 z-50 rounded-md border-brut bg-secondary px-4 py-2 font-display text-xs uppercase text-secondary-ink shadow-brutal-sm brutal-press-sm"
    >
      Panel Panitia
    </Link>
  ) : null

  if (initialLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4">
        <CardSkeleton className="w-full max-w-xl" />
      </div>
    )
  }

  if (!profile) return null

  if (!groupId || !groupQuery.data) {
    return (
      <>
        {adminLink}
        <NoGroupStep />
      </>
    )
  }

  const group = groupQuery.data
  const confirmations = confirmationsQuery.data ?? []

  if (!group.leaderId && !areAllPairsConfirmed(group.members, confirmations)) {
    return (
      <>
        {adminLink}
        <ConfirmMembersStep group={group} confirmations={confirmations} myId={profile.id} />
      </>
    )
  }

  if (!group.leaderId && !group.photoCompletedAt) {
    return (
      <>
        {adminLink}
        <GroupPhotoStep groupId={group.id} />
      </>
    )
  }

  if (!group.leaderId) {
    return (
      <>
        {adminLink}
        <VoteLeaderStep group={group} myId={profile.id} />
      </>
    )
  }

  if (!group.nameSetAt) {
    return (
      <>
        {adminLink}
        <NameGroupStep group={group} myId={profile.id} />
      </>
    )
  }

  return (
    <>
      {adminLink}
      <GroupSuccessScreen group={group} />
    </>
  )
}

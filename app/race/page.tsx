'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import NoGroupStep from '@/components/organisms/race/NoGroupStep'
import SocialProfileStep from '@/components/organisms/race/SocialProfileStep'
import GroupSelfieStep from '@/components/organisms/race/GroupSelfieStep'
import VoteLeaderStep from '@/components/organisms/race/VoteLeaderStep'
import NameGroupStep from '@/components/organisms/race/NameGroupStep'
import YelYelStep from '@/components/organisms/race/YelYelStep'
import GroupSuccessScreen from '@/components/organisms/race/GroupSuccessScreen'
import LogoutButton from '@/components/fragments/LogoutButton'
import SocialProfileButton from '@/components/fragments/SocialProfileButton'
import AnnouncementPopup from '@/components/fragments/AnnouncementPopup'
import AppToast from '@/components/fragments/AppToast'
import { useRealtime } from '@/hooks/use-realtime'
import { useProfileQuery } from '@/hooks/use-profile'
import { useGroupQuery } from '@/hooks/use-group'

export default function RacePage() {
  const router = useRouter()

  // Checkpoint 0 dibuka ulang dari tombol melayang, bukan lewat alamat
  // tersendiri: peserta harus kembali persis ke tempatnya semula setelah
  // selesai, dan halaman terpisah akan kehilangan tempat itu.
  const [isEditingSocial, setIsEditingSocial] = useState(false)
  const profileQuery = useProfileQuery()
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

  // Rangkaian checkpoint ini milik peserta seluruhnya — panitia tidak punya
  // kelompok, tidak memilih ketua, dan tidak mengirim yel-yel. Mendaratkan
  // mereka di sini hanya menyisakan layar yang menunggu sesuatu yang tidak
  // akan pernah terjadi.
  const isPanitia = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (isPanitia) router.replace('/admin/monitoring')
  }, [isPanitia, router])

  // Menempel di setiap checkpoint: pengumuman panitia dan kabar pemindaian pos
  // harus sampai di layar mana pun peserta sedang berada.
  const chrome = (
    <>
      <AnnouncementPopup />
      {/* Hasil validasi panitia dan pemindaian QR di pos sampai ke peserta
          sebagai kabar, bukan sebagai angka yang bergeser diam-diam. */}
      <AppToast />
      <LogoutButton floating />

      {/* Muncul setelah Checkpoint 0 terlewati, dan tidak muncul di dalam
          Checkpoint 0 itu sendiri — di sana tombolnya tidak menuju ke mana
          pun. Panitia tidak melihatnya: mereka mengubah akun peserta dari
          panel, bukan dari layar ini. */}
      {profile?.role === 'PARTICIPANT' && profile.socialProfileAt && !isEditingSocial && (
        <SocialProfileButton onClick={() => setIsEditingSocial(true)} />
      )}
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

  // Checkpoint 0 — mendahului segalanya, termasuk pembentukan kelompok.
  // Ditanyakan selagi peserta masih duduk menunggu; begitu perlombaan berjalan
  // tidak ada lagi yang mau berhenti untuk mengetik nama akunnya.
  if (profile.role === 'PARTICIPANT' && !profile.socialProfileAt) {
    return (
      <>
        {chrome}
        <SocialProfileStep profile={profile} />
      </>
    )
  }

  // Kunjungan ulang. Menutupi checkpoint mana pun yang sedang terbuka, lalu
  // mengembalikannya utuh begitu selesai — termasuk bila peserta memilih
  // melewatinya lagi.
  if (isEditingSocial) {
    return (
      <>
        {chrome}
        <SocialProfileStep profile={profile} onDone={() => setIsEditingSocial(false)} />
      </>
    )
  }

  // Tidak ada lagi gerbang kehadiran di sini. Kehadiran ditandai saat peserta
  // masuk dengan nama & nomor teleponnya, jadi menahan mereka lagi untuk
  // dipindai panitia berarti mengantre dua kali untuk hal yang sama. QR
  // peserta tetap dipakai, tetapi untuk lapor pos.

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
      <GroupSuccessScreen group={group} myId={profile.id} />
    </>
  )
}

'use client'

import { useState } from 'react'
import RaceShell from '@/components/fragments/RaceShell'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import MediaPicker from '@/components/fragments/MediaPicker'
import MemberList from '@/components/fragments/MemberList'
import FormationCountdown from '@/components/organisms/race/FormationCountdown'
import { IMAGE_ACCEPT } from '@/utils/mission/type-meta'
import { useGroupPhotoMutation } from '@/hooks/use-group'
import { AppError } from '@/libs/api'
import { Group } from '@/types/group'

/**
 * Checkpoint 2 — kenali timmu, lalu unggah satu selfie bersama.
 *
 * Menggantikan langkah saling mencentang "sudah ketemu": foto bersama sudah
 * membuktikan mereka benar-benar berkumpul, dan jauh lebih cepat untuk
 * kelompok berisi enam orang.
 */
export default function GroupSelfieStep({ group, myId }: { group: Group; myId: string }) {
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { mutate: completePhoto, isPending, error } = useGroupPhotoMutation(group.id)
  const apiError = error as AppError | null

  const pick = (file: File) => {
    setPhotoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const alreadyUploaded = !!group.photoCompletedAt
  const uploaderName = group.photoByName ?? null
  const uploadedByMe = group.photoBy === myId

  return (
    <RaceShell
      eyebrow="Checkpoint 2 · Kenali Timmu"
      title="TIM KAMU"
      subtitle="Berkumpullah dengan anggota di bawah ini, lalu unggah satu foto selfie bersama."
    >
      <FormationCountdown group={group} />

      {/* Lencana kategori kelompok disembunyikan bersama fitur kategori —
          lihat catatan di /admin/categories. */}

      <MemberList members={group.members} myId={myId} leaderId={group.leaderId} className="mt-4" />

      {alreadyUploaded ? (
        <div className="mt-6 rounded-md border-brut !border-success bg-paper px-4 py-4 text-center">
          <p className="text-sm font-bold text-success">
            {uploadedByMe
              ? 'Foto kelompok berhasil kamu unggah!'
              : `Foto kelompok sudah diunggah oleh ${uploaderName ?? 'anggota lain'}.`}
          </p>
          <p className="mt-1 text-xs text-ink/55">Lanjut ke pemilihan ketua…</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {/* Kameranya benar-benar terbuka di halaman ini — bukan dialog pilih
              berkas — dan galeri tetap tersedia untuk kelompok yang sudah
              memotret duluan dengan aplikasi kamera bawaan. */}
          <MediaPicker
            onPick={pick}
            previewUrl={previewUrl}
            accept={IMAGE_ACCEPT}
            facing="user"
            label="Ketuk untuk membuka kamera"
          />

          <Button
            size="lg"
            className="w-full"
            loading={isPending}
            disabled={!photoFile}
            onClick={() => completePhoto(photoFile)}
          >
            Kirim Selfie Kelompok
          </Button>

          <p className="text-xs text-ink/50">
            Cukup satu orang yang mengunggah — anggota lain akan melihat namanya di sini.
          </p>
          <ErrorMessage message={apiError?.message} />
        </div>
      )}
    </RaceShell>
  )
}

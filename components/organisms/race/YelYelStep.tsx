'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import RaceShell from '@/components/fragments/RaceShell'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import MediaPicker from '@/components/fragments/MediaPicker'
import YelYelCountdown from '@/components/organisms/race/YelYelCountdown'
import { useSkipYelYelMutation } from '@/hooks/use-group'
import { useSubmitMissionMutation } from '@/hooks/use-submissions'
import { submissionService } from '@/services/submission.service'
import { AppError } from '@/libs/api'
import { VIDEO_ACCEPT } from '@/utils/mission/type-meta'
import { Group, YelYelState } from '@/types/group'

/**
 * Checkpoint terakhir sebelum perlombaan — yel-yel kelompok.
 *
 * Berbeda dari misi lain, yel-yel punya jendela waktunya sendiri yang mulai
 * berjalan begitu kelompok diberi nama. Kelompok yang ingin segera berlomba
 * boleh melewatinya; buktinya masih bisa dikirim dari daftar misi sampai
 * tenggatnya habis.
 */
export default function YelYelStep({
  group,
  yelYel,
  myId,
}: {
  group: Group
  yelYel: YelYelState
  myId: string
}) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [confirmSkip, setConfirmSkip] = useState(false)

  const submitMission = useSubmitMissionMutation()
  const skipYelYel = useSkipYelYelMutation(group.id)

  const isLeader = group.leaderId === myId
  const busy = uploading || submitMission.isPending

  const pick = (chosen: File) => {
    setUploadError(null)
    setFile(chosen)
    setPreviewUrl(URL.createObjectURL(chosen))
  }

  const send = async () => {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const mediaUrl = await submissionService.uploadEvidence(file)
      await submitMission.mutateAsync({ missionId: yelYel.missionId, mediaUrl })
      await queryClient.invalidateQueries({ queryKey: ['group', group.id] })
    } catch (e) {
      setUploadError((e as AppError).message || 'Gagal mengirim video. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <RaceShell
      eyebrow="Checkpoint 4 · Yel-Yel"
      title="YEL-YEL TIM"
      subtitle="Buat yel-yel kelompokmu, rekam bersama-sama, lalu unggah videonya."
    >
      <YelYelCountdown yelYel={yelYel} />

      <p className="mt-4 rounded-md border-brut border-dashed bg-paper px-4 py-3 text-sm text-ink/70">
        {yelYel.description}
      </p>

      <div className="mt-5">
        <MediaPicker
          onPick={pick}
          previewUrl={previewUrl}
          previewIsVideo
          accept={VIDEO_ACCEPT}
          allowPhoto={false}
          allowVideo
          label="🎥 Ketuk untuk merekam yel-yel"
        />
      </div>

      <ErrorMessage message={uploadError ?? undefined} className="mt-3" />

      <div className="mt-6 space-y-3">
        <Button
          size="lg"
          variant="primary"
          className="w-full"
          disabled={!file}
          loading={busy}
          onClick={send}
        >
          Kirim Yel-Yel
        </Button>

        {isLeader ? (
          <Button
            size="sm"
            variant="ghost"
            className="w-full"
            disabled={busy}
            onClick={() => setConfirmSkip(true)}
          >
            Lewati dulu
          </Button>
        ) : (
          <p className="text-center text-xs text-ink/50">
            Hanya ketua kelompok yang bisa memutuskan melewati langkah ini.
          </p>
        )}
      </div>

      <ConfirmModal
        open={confirmSkip}
        title="Lewati yel-yel?"
        description={
          <>
            Kelompokmu langsung lanjut ke perlombaan, dan yel-yel masih bisa dikirim dari daftar
            misi sampai batas waktunya habis.
            <br />
            <br />
            <strong className="text-ink">
              Poin yel-yel yang kalian peroleh nanti akan lebih kecil daripada mengerjakannya
              sekarang.
            </strong>
          </>
        }
        confirmLabel="Ya, lewati"
        cancelLabel="Kerjakan sekarang"
        loading={skipYelYel.isPending}
        onConfirm={() => skipYelYel.mutate(undefined, { onSuccess: () => setConfirmSkip(false) })}
        onCancel={() => setConfirmSkip(false)}
      />
    </RaceShell>
  )
}

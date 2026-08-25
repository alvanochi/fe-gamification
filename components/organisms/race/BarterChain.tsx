'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import ErrorMessage from '@/components/elements/ErrorMessage'
import MediaPicker from '@/components/fragments/MediaPicker'
import {
  useBarterStepsQuery,
  useCreateAssignmentMutation,
  useSubmitBarterStepMutation,
} from '@/hooks/use-barter'
import { AppError } from '@/libs/api'
import { Assignment } from '@/types/mission'
import { IMAGE_ACCEPT, VIDEO_ACCEPT } from '@/utils/mission/type-meta'

/**
 * Rantai barter "Bigger Better" (MR6): kelompok menukar satu barang ke barang
 * bernilai lebih tinggi berulang kali, tiap langkah direkam beserta videonya.
 *
 * Backend sudah punya seluruh alurnya sejak awal; bagian inilah yang belum ada,
 * sehingga fiturnya tidak pernah bisa dipakai peserta.
 */
export default function BarterChain({
  missionId,
  assignment,
}: {
  missionId: string
  assignment?: Assignment | null
}) {
  const createAssignment = useCreateAssignmentMutation()
  const { data: steps } = useBarterStepsQuery(assignment?.id)
  const submitStep = useSubmitBarterStepMutation()

  const [itemTo, setItemTo] = useState('')
  const [partnerName, setPartnerName] = useState('')
  // MR6 meminta "FOTO PERTUKARAN BARANG DARI BARANG 1 KE BARANG SELANJUTNYA",
  // jadi foto diterima — video tetap boleh bila peserta merekamnya.
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)

  const pickProof = (file: File) => {
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  const apiError = (createAssignment.error ?? submitStep.error) as AppError | null
  const isLocked = assignment?.status === 'ACCEPTED' || assignment?.status === 'REJECTED'

  // Barang awal langkah berikutnya = barang hasil langkah sebelumnya.
  const lastStep = steps?.[steps.length - 1]
  const itemFrom = lastStep?.itemTo ?? 'Modal awal dari panitia'
  const nextStepNo = (lastStep?.stepNo ?? 0) + 1

  if (!assignment) {
    return (
      <div className="mt-4 space-y-3">
        <p className="rounded-md border-brut bg-paper px-4 py-3 text-sm text-ink/70">
          Mulai rantai barter untuk menukar barang modal ke barang bernilai lebih tinggi.
        </p>
        <Button
          size="sm"
          className="w-full"
          loading={createAssignment.isPending}
          onClick={() => createAssignment.mutate({ missionId })}
        >
          Mulai Barter
        </Button>
        <ErrorMessage message={apiError?.message} />
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      {steps && steps.length > 0 && (
        <ol className="space-y-2">
          {steps.map(step => (
            <li
              key={step.id}
              className={`rounded-md border-brut px-4 py-3 text-sm ${
                step.isValid ? 'bg-paper' : 'border-danger bg-paper opacity-60'
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
                Langkah {step.stepNo}
                {!step.isValid && ' · dibatalkan panitia'}
              </p>
              <p className="mt-1 font-bold text-ink">
                {step.itemFrom} → {step.itemTo}
              </p>
              {step.partnerName && (
                <p className="text-xs text-ink/55">bersama {step.partnerName}</p>
              )}
            </li>
          ))}
        </ol>
      )}

      {isLocked ? (
        <p className="rounded-md border-brut bg-paper px-4 py-3 text-sm font-bold text-ink/60">
          Rantai barter sudah dinilai panitia.
        </p>
      ) : (
        <div className="space-y-3 rounded-md border-brut border-dashed bg-paper px-4 py-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
            Langkah {nextStepNo} · dari {itemFrom}
          </p>

          <Input
            value={itemTo}
            onChange={e => setItemTo(e.target.value)}
            placeholder="Ditukar jadi barang apa?"
          />
          <Input
            value={partnerName}
            onChange={e => setPartnerName(e.target.value)}
            placeholder="Nama pemilik barang (opsional)"
          />
          <MediaPicker
            onPick={pickProof}
            previewUrl={proofPreview}
            previewIsVideo={!!proofFile?.type.startsWith('video/')}
            accept={`${IMAGE_ACCEPT},${VIDEO_ACCEPT}`}
            allowVideo
            label="Ketuk untuk memotret pertukaran"
          />

          <Button
            size="sm"
            className="w-full"
            loading={submitStep.isPending}
            disabled={!itemTo.trim() || !proofFile}
            onClick={() =>
              submitStep.mutate(
                {
                  assignmentId: assignment.id,
                  stepNo: nextStepNo,
                  itemFrom,
                  itemTo: itemTo.trim(),
                  partnerName: partnerName.trim() || undefined,
                  file: proofFile!,
                },
                {
                  onSuccess: () => {
                    setItemTo('')
                    setPartnerName('')
                    setProofFile(null)
                    setProofPreview(null)
                  },
                },
              )
            }
          >
            Simpan Langkah
          </Button>
          <p className="text-xs text-ink/50">
            Foto (atau video) pertukaran wajib dilampirkan sebagai bukti tiap langkah.
          </p>
        </div>
      )}

      <ErrorMessage message={apiError?.message} />
    </div>
  )
}

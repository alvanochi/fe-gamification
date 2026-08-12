'use client'

import { useState } from 'react'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { usePendingSubmissionsQuery, useValidateSubmissionMutation } from '@/hooks/use-submissions'
import { AppError } from '@/libs/api'
import { PendingSubmission } from '@/types/mission'
import {
  MISSION_TYPE_COLOR_VAR,
  MISSION_TYPE_LABEL,
  PROOF_TYPE_LABEL,
} from '@/utils/mission/type-meta'

/** Bukti video perlu <video>; <img> hanya menampilkan kotak rusak. */
function EvidencePreview({ submission }: { submission: PendingSubmission }) {
  if (!submission.mediaUrl) return null

  const isVideo =
    submission.proofType === 'VIDEO' ||
    /\.(mp4|mov|webm|m4v)(\?|$)/i.test(submission.mediaUrl)

  if (isVideo) {
    return (
      <video
        src={submission.mediaUrl}
        controls
        playsInline
        className="mt-3 aspect-video w-full rounded-md border-brut bg-black object-contain"
      />
    )
  }

  return (
    <a href={submission.mediaUrl} target="_blank" rel="noopener noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={submission.mediaUrl}
        alt="Bukti submission"
        className="mt-3 aspect-video w-full rounded-md border-brut object-cover"
      />
    </a>
  )
}

function QueueCard({ submission }: { submission: PendingSubmission }) {
  const { mutate: validate, isPending, variables, error } = useValidateSubmissionMutation()
  const apiError = error as AppError | null
  const actingOn = isPending ? variables?.status : null

  // Misi berentang nilai (MR6) wajib dinilai manual oleh panitia.
  const hasRange = submission.pointMin != null && submission.pointMax != null
  const [awardedPoint, setAwardedPoint] = useState<string>(
    hasRange ? String(submission.pointMin) : '',
  )
  const [rejectReason, setRejectReason] = useState('')

  const parsedPoint = Number(awardedPoint)
  const pointValid =
    !hasRange ||
    (awardedPoint.trim() !== '' &&
      Number.isInteger(parsedPoint) &&
      parsedPoint >= submission.pointMin! &&
      parsedPoint <= submission.pointMax!)

  return (
    <li
      className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm"
      style={{ borderLeftWidth: 8, borderLeftColor: MISSION_TYPE_COLOR_VAR[submission.missionType] }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="font-mono text-[11px] font-bold uppercase tracking-widest"
            style={{ color: MISSION_TYPE_COLOR_VAR[submission.missionType] }}
          >
            {MISSION_TYPE_LABEL[submission.missionType]}
          </p>
          <h4 className="mt-1 font-display text-xl text-ink">{submission.missionTitle}</h4>
          <p className="mt-1 text-sm text-ink/70">
            {submission.groupName} · dikirim oleh {submission.submittedByName}
          </p>
        </div>
        <span className="shrink-0 rounded-full border-brut-sm bg-primary px-3 py-1 font-display text-sm text-primary-ink">
          {hasRange ? `${submission.pointMin}-${submission.pointMax} pt` : `${submission.pointWeight} pt`}
        </span>
      </div>

      <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink/45">
        {submission.missionCategory === 'TERSTRUKTUR' ? 'Terstruktur' : 'Mandiri'}
        {submission.locationName ? ` · ${submission.locationName}` : ''}
        {` · bukti ${PROOF_TYPE_LABEL[submission.proofType]}`}
      </p>

      {submission.answerText && (
        <p className="mt-3 rounded-md border-brut bg-paper px-4 py-3 text-sm break-words text-ink/80">
          {submission.answerText}
        </p>
      )}

      <EvidencePreview submission={submission} />

      {hasRange && (
        <div className="mt-4">
          <label className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
            Nilai ({submission.pointMin} - {submission.pointMax} poin)
          </label>
          <input
            type="number"
            min={submission.pointMin!}
            max={submission.pointMax!}
            value={awardedPoint}
            onChange={e => setAwardedPoint(e.target.value)}
            className="mt-1 w-full rounded-md border-brut bg-paper px-4 py-3 font-medium text-ink shadow-brutal-sm focus:outline-none"
          />
        </div>
      )}

      <div className="mt-4">
        <input
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          placeholder="Alasan penolakan (opsional)"
          className="w-full rounded-md border-brut-sm bg-paper px-3 py-2 text-sm font-medium text-ink focus:outline-none"
        />
      </div>

      <div className="mt-4 flex gap-3">
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          loading={actingOn === 'REJECTED'}
          disabled={isPending}
          onClick={() =>
            validate({
              submissionId: submission.id,
              status: 'REJECTED',
              rejectReason: rejectReason.trim() || undefined,
            })
          }
        >
          Tolak
        </Button>
        <Button
          size="sm"
          className="flex-1"
          loading={actingOn === 'APPROVED'}
          disabled={isPending || !pointValid}
          onClick={() =>
            validate({
              submissionId: submission.id,
              status: 'APPROVED',
              awardedPoint: hasRange ? parsedPoint : undefined,
            })
          }
        >
          Setujui
        </Button>
      </div>
      {hasRange && !pointValid && (
        <p className="mt-2 text-xs font-bold text-danger">
          Isi nilai antara {submission.pointMin} dan {submission.pointMax} poin.
        </p>
      )}
      <ErrorMessage message={apiError?.message} className="mt-2" />
    </li>
  )
}

export default function ValidationQueue() {
  const { data: submissions, isLoading, error } = usePendingSubmissionsQuery()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <p className="rounded-md border-brut !border-danger bg-paper-raised p-4 text-sm font-bold text-danger">
        Gagal memuat antrean validasi.
      </p>
    )
  }

  if (!submissions || submissions.length === 0) {
    return (
      <p className="rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
        Tidak ada submission yang menunggu validasi saat ini.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {submissions.map(submission => (
        <QueueCard key={submission.id} submission={submission} />
      ))}
    </ul>
  )
}

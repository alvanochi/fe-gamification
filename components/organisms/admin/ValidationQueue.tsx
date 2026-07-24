'use client'

import CardSkeleton from '@/components/skeleton/CardSkeleton'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { usePendingSubmissionsQuery, useValidateSubmissionMutation } from '@/hooks/use-submissions'
import { AppError } from '@/libs/api'
import { PendingSubmission } from '@/types/mission'
import { MISSION_TYPE_COLOR_VAR, MISSION_TYPE_LABEL } from '@/utils/mission/type-meta'

function QueueCard({ submission }: { submission: PendingSubmission }) {
  const { mutate: validate, isPending, variables, error } = useValidateSubmissionMutation()
  const apiError = error as AppError | null
  const actingOn = isPending ? variables?.status : null

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
          {submission.pointWeight} pt
        </span>
      </div>

      {submission.answerText && (
        <p className="mt-3 rounded-md border-brut bg-paper px-4 py-3 text-sm text-ink/80">
          {submission.answerText}
        </p>
      )}

      {submission.mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={submission.mediaUrl}
          alt="Bukti submission"
          className="mt-3 aspect-video w-full rounded-md border-brut object-cover"
        />
      )}

      <div className="mt-4 flex gap-3">
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          loading={actingOn === 'REJECTED'}
          disabled={isPending}
          onClick={() => validate({ submissionId: submission.id, status: 'REJECTED' })}
        >
          Tolak
        </Button>
        <Button
          size="sm"
          className="flex-1"
          loading={actingOn === 'APPROVED'}
          disabled={isPending}
          onClick={() => validate({ submissionId: submission.id, status: 'APPROVED' })}
        >
          Setujui
        </Button>
      </div>
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

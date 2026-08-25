'use client'

import { useState } from 'react'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import ErrorMessage from '@/components/elements/ErrorMessage'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import Pagination from '@/components/fragments/Pagination'
import { usePendingSubmissionsQuery, useValidateSubmissionMutation } from '@/hooks/use-submissions'
import { usePagination } from '@/hooks/use-pagination'
import { AppError } from '@/libs/api'
import { PendingSubmission } from '@/types/mission'
import { groupByMissionType } from '@/utils/mission/grouping'
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

  // Input yang diminta menyesuaikan cara penilaian misi.
  const mode = submission.scoringMode ?? (submission.pointMin != null ? 'RANGE' : 'FLAT')
  const hasRange = mode === 'RANGE'
  const isPerUnit = mode === 'PER_UNIT'
  const isTimeBased = mode === 'TIME_BASED'

  const [awardedPoint, setAwardedPoint] = useState<string>(
    hasRange ? String(submission.pointMin ?? '') : '',
  )
  const [units, setUnits] = useState('')
  const [timeSeconds, setTimeSeconds] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  // Dua keputusan yang sama-sama tidak bisa dibatalkan: poin yang sudah masuk
  // ikut mengubah klasemen, dan penolakan mengembalikan misinya ke peserta.
  const [pending, setPending] = useState<'APPROVE' | 'REJECT' | null>(null)

  const parsedPoint = Number(awardedPoint)
  const pointValid = hasRange
    ? awardedPoint.trim() !== '' &&
      Number.isInteger(parsedPoint) &&
      parsedPoint >= submission.pointMin! &&
      parsedPoint <= submission.pointMax!
    : isPerUnit
      ? units.trim() !== '' && Number(units) >= 0
      : isTimeBased
        ? timeSeconds.trim() !== '' && Number(timeSeconds) > 0
        : true

  // Perkiraan poin ditampilkan sebelum menyetujui, supaya panitia tahu
  // konsekuensi angka yang diketiknya.
  const previewPoint = isPerUnit
    ? (submission.pointPerUnit ?? 0) *
      Math.min(Number(units || 0), submission.maxUnits ?? Number(units || 0))
    : isTimeBased && Number(timeSeconds) > 0 && submission.timeTargetSeconds
      ? Math.min(
          submission.pointWeight,
          Math.round((submission.pointWeight * submission.timeTargetSeconds) / Number(timeSeconds)),
        )
      : null

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
          <Input
            className="mt-1"
            type="number"
            min={submission.pointMin!}
            max={submission.pointMax!}
            value={awardedPoint}
            onChange={e => setAwardedPoint(e.target.value)}
          />
        </div>
      )}

      {isPerUnit && (
        <div className="mt-4">
          <label className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
            Jumlah hasil ({submission.pointPerUnit} poin per hasil)
          </label>
          <Input
            className="mt-1"
            type="number"
            min={0}
            value={units}
            onChange={e => setUnits(e.target.value)}
            placeholder="Misal: 2"
          />
        </div>
      )}

      {isTimeBased && (
        <div className="mt-4">
          <label className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
            Waktu tempuh, detik (acuan {submission.timeTargetSeconds})
          </label>
          <Input
            className="mt-1"
            type="number"
            min={1}
            value={timeSeconds}
            onChange={e => setTimeSeconds(e.target.value)}
            placeholder="Misal: 240"
          />
        </div>
      )}

      {previewPoint !== null && (
        <p className="mt-2 text-xs font-bold text-ink/60">Perkiraan poin: {previewPoint}</p>
      )}

      <div className="mt-4 flex gap-3">
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          loading={actingOn === 'REJECTED'}
          disabled={isPending}
          onClick={() => setPending('REJECT')}
        >
          Tolak
        </Button>
        <Button
          size="sm"
          className="flex-1"
          loading={actingOn === 'APPROVED'}
          disabled={isPending || !pointValid}
          onClick={() => setPending('APPROVE')}
        >
          Setujui
        </Button>
      </div>
      {!pointValid && (
        <p className="mt-2 text-xs font-bold text-danger">
          {hasRange
            ? `Isi nilai antara ${submission.pointMin} dan ${submission.pointMax} poin.`
            : isPerUnit
              ? 'Isi jumlah hasil yang dicapai peserta.'
              : 'Isi waktu tempuh peserta dalam detik.'}
        </p>
      )}
      <ErrorMessage message={apiError?.message} className="mt-2" />

      <ConfirmModal
        open={pending === 'APPROVE'}
        title={`Setujui bukti ${submission.groupName}?`}
        description={
          <>
            <p>
              <strong>{submission.missionTitle}</strong> akan ditandai selesai dan poinnya langsung
              masuk ke klasemen.
            </p>
            <p className="mt-2 font-bold text-ink">
              Poin yang diberikan:{' '}
              {hasRange
                ? parsedPoint
                : previewPoint !== null
                  ? previewPoint
                  : submission.pointWeight}
            </p>
          </>
        }
        confirmLabel="Ya, Setujui"
        loading={actingOn === 'APPROVED'}
        onConfirm={() =>
          validate(
            {
              submissionId: submission.id,
              status: 'APPROVED',
              awardedPoint: hasRange ? parsedPoint : undefined,
              units: isPerUnit ? Number(units) : undefined,
              timeSeconds: isTimeBased ? Number(timeSeconds) : undefined,
            },
            { onSettled: () => setPending(null) },
          )
        }
        onCancel={() => setPending(null)}
      />

      {/* Penolakan dikonfirmasi, dan alasannya diketik di dialog yang sama.
          Sebelumnya kolom alasan berdiri di kartu — mudah terlewat — dan satu
          ketukan langsung menolak bukti tanpa penjelasan apa pun untuk tim
          yang menerimanya. */}
      <ConfirmModal
        open={pending === 'REJECT'}
        title={`Tolak bukti ${submission.groupName}?`}
        description={
          <>
            <p>
              Misi <strong>{submission.missionTitle}</strong> akan terbuka lagi untuk kelompok ini,
              dan alasan di bawah tampil di layar mereka.
            </p>
            <Input
              className="mt-3"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Alasan penolakan (mis. foto tidak terlihat jelas)"
            />
          </>
        }
        confirmLabel="Ya, Tolak"
        confirmVariant="danger"
        loading={actingOn === 'REJECTED'}
        onConfirm={() =>
          validate(
            {
              submissionId: submission.id,
              status: 'REJECTED',
              rejectReason: rejectReason.trim() || undefined,
            },
            { onSettled: () => setPending(null) },
          )
        }
        onCancel={() => setPending(null)}
      />
    </li>
  )
}

/**
 * Antrean validasi, dikelompokkan per jenis misi dan berhalaman.
 *
 * Menilai tantangan foto, rantai barter, dan kuis menuntut cara membaca yang
 * berbeda; daftar campur memaksa panitia berganti-ganti kacamata tiap kartu.
 * Dikelompokkan begini, mereka bisa menyelesaikan satu jenis dulu sampai habis.
 */
export default function ValidationQueue() {
  const { data: submissions, isLoading, error } = usePendingSubmissionsQuery()
  const pagination = usePagination(submissions ?? [])

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
    <div className="space-y-6">
      <Pagination
        page={pagination.page}
        perPage={pagination.perPage}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPerPageChange={pagination.setPerPage}
      />

      {groupByMissionType(pagination.pageItems, item => item.missionType).map(group => (
        <section key={group.type}>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2
              className="font-display text-xl"
              style={{ color: MISSION_TYPE_COLOR_VAR[group.type] }}
            >
              {MISSION_TYPE_LABEL[group.type]}
            </h2>
            <span className="font-mono text-xs text-ink/40">{group.items.length} menunggu</span>
          </div>

          <ul className="mt-3 space-y-4">
            {group.items.map(submission => (
              <QueueCard key={submission.id} submission={submission} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

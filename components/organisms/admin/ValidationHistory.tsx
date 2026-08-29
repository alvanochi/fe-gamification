'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Select from '@/components/elements/Select'
import ErrorMessage from '@/components/elements/ErrorMessage'
import Pagination from '@/components/fragments/Pagination'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import { useSubmissionHistoryQuery, useReviewSubmissionMutation } from '@/hooks/use-submissions'
import { useFinishBarterMutation } from '@/hooks/use-barter-queue'
import { usePagination } from '@/hooks/use-pagination'
import { AppError } from '@/libs/api'
import type { BarterChainSummary, MissionType, ValidatedSubmission } from '@/types/mission'
import { formatTime } from '@/utils/format/formatDate'
import {
  MISSION_TYPE_COLOR_VAR,
  MISSION_TYPE_LABEL,
  PROOF_TYPE_LABEL,
} from '@/utils/mission/type-meta'
import { MISSION_TYPE_ORDER } from '@/utils/mission/grouping'

type StatusFilter = 'SEMUA' | 'PENDING' | 'APPROVED' | 'REJECTED'

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'SEMUA', label: 'Semua' },
  { value: 'PENDING', label: 'Belum divalidasi' },
  { value: 'APPROVED', label: 'Diterima' },
  { value: 'REJECTED', label: 'Ditolak' },
]

const STATUS_TEXT: Record<ValidatedSubmission['status'], { label: string; className: string }> = {
  PENDING: { label: 'menunggu', className: 'text-warning' },
  APPROVED: { label: 'diterima', className: 'text-success' },
  REJECTED: { label: 'ditolak', className: 'text-danger' },
}

/** Bukti yang dikirim, apa adanya. Video perlu <video>; <img> hanya kotak rusak. */
function Evidence({ submission }: { submission: ValidatedSubmission }) {
  const urls = submission.mediaUrls ?? []
  if (!urls.length) return null

  const isVideo = (url: string) =>
    submission.proofType === 'VIDEO' || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)

  return (
    <ul className={`mt-3 grid gap-2 ${urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {urls.map((url, index) => (
        <li key={url}>
          {isVideo(url) ? (
            <video
              src={url}
              controls
              playsInline
              className="aspect-video w-full rounded-md border-brut bg-black object-contain"
            />
          ) : (
            <a href={url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Bukti ${index + 1}`}
                className="aspect-video w-full rounded-md border-brut object-cover"
              />
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}

/**
 * Satu kiriman: ringkasannya selalu terlihat, rinciannya dibuka saat diketuk.
 *
 * Koreksi ditaruh di dalam detail, bukan di baris ringkas. Mengubah keputusan
 * yang sudah berjalan menggeser peringkat setelah faktanya — pantas menuntut
 * satu ketukan untuk membuka dulu, dan melihat buktinya lagi sebelum
 * memutuskan.
 */
function AuditRow({ submission }: { submission: ValidatedSubmission }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'APPROVED' | 'REJECTED'>(
    submission.status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
  )
  const [point, setPoint] = useState(String(submission.awardedPoint ?? submission.pointWeight ?? 0))
  const [reason, setReason] = useState(submission.rejectReason ?? '')

  const { mutate: review, isPending, error } = useReviewSubmissionMutation()
  const apiError = error as AppError | null

  const parsed = Number(point)
  const pointValid = point.trim() !== '' && Number.isInteger(parsed) && parsed >= 0
  const valid = status === 'REJECTED' || pointValid

  const chip = STATUS_TEXT[submission.status]

  return (
    <li
      className="rounded-md border-brut-sm bg-paper"
      style={{ borderLeftWidth: 6, borderLeftColor: MISSION_TYPE_COLOR_VAR[submission.missionType] }}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3 text-left brutal-press-sm"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">
            {submission.missionTitle}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-widest text-ink/45">
            {submission.groupName} · {MISSION_TYPE_LABEL[submission.missionType]} ·{' '}
            {formatTime(submission.createdAt)}
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className={`block font-mono text-[10px] font-bold uppercase ${chip.className}`}>
            {chip.label}
          </span>
          {submission.awardedPoint != null && (
            <span className="block font-mono text-[10px] text-ink/50">
              {submission.awardedPoint} poin
            </span>
          )}
        </span>

        <span aria-hidden className="shrink-0 font-mono text-sm text-ink/40">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="border-t border-ink/10 px-4 pb-4 pt-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
            dikirim {submission.submittedByName}
            {submission.validatedByName ? ` · diperiksa ${submission.validatedByName}` : ''}
            {submission.validatedAt ? ` pukul ${formatTime(submission.validatedAt)}` : ''}
            {` · bukti ${PROOF_TYPE_LABEL[submission.proofType]}`}
          </p>

          {submission.answerText && (
            <p className="mt-2 break-words rounded-md border-brut-sm bg-paper-raised px-3 py-2 text-sm text-ink/80">
              {submission.answerText}
            </p>
          )}

          {submission.rejectReason && (
            <p className="mt-2 text-xs font-bold text-danger">
              Alasan penolakan: {submission.rejectReason}
            </p>
          )}

          <Evidence submission={submission} />

          <div className="mt-4 rounded-md border-brut-sm bg-paper-raised p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
              Koreksi keputusan
            </p>

            <div className="mt-2 flex flex-wrap items-end gap-2">
              <Select
                className="w-44"
                value={status}
                onChange={e => setStatus(e.target.value as 'APPROVED' | 'REJECTED')}
              >
                <option value="APPROVED">Diterima</option>
                <option value="REJECTED">Ditolak</option>
              </Select>

              {status === 'APPROVED' ? (
                <label className="block">
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-ink/45">
                    Nilai
                  </span>
                  <Input
                    className="mt-1 w-28"
                    type="number"
                    min={0}
                    value={point}
                    onChange={e => setPoint(e.target.value)}
                    error={!pointValid}
                  />
                </label>
              ) : (
                <label className="block min-w-[14rem] flex-1">
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-ink/45">
                    Alasan (opsional)
                  </span>
                  <Input
                    className="mt-1"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Mis. bukti tidak sesuai"
                  />
                </label>
              )}

              <Button
                size="sm"
                loading={isPending}
                disabled={!valid}
                onClick={() =>
                  review({
                    submissionId: submission.id,
                    status,
                    awardedPoint: status === 'APPROVED' ? parsed : undefined,
                    rejectReason: status === 'REJECTED' ? reason.trim() || undefined : undefined,
                  })
                }
              >
                Simpan Koreksi
              </Button>
            </div>

            <p className="mt-2 text-xs text-ink/50">
              Poin lama dicabut dan poin baru dipasang sekaligus; skor kelompok dihitung ulang.
            </p>

            <ErrorMessage message={apiError?.message} className="mt-2" />
          </div>
        </div>
      )}
    </li>
  )
}

/**
 * Rantai Bigger Better.
 *
 * Barter tidak meninggalkan kiriman, jadi ia tidak akan pernah muncul di
 * daftar di atas. Yang paling sering terjadi menjelang penutupan: seluruh
 * pertukarannya sudah diterima tetapi rantainya belum ditekan Akhiri, sehingga
 * misinya menggantung. Tombolnya ditaruh di sini supaya tidak perlu berpindah
 * halaman hanya untuk menutup satu rantai.
 */
function BarterRow({ chain }: { chain: BarterChainSummary }) {
  const ditutup = chain.status === 'ACCEPTED' || chain.status === 'REJECTED'
  const [point, setPoint] = useState(String(chain.earnedPoint))
  const { mutate: finish, isPending, error } = useFinishBarterMutation()
  const apiError = error as AppError | null

  const parsed = Number(point)
  const valid = point.trim() !== '' && Number.isInteger(parsed) && parsed >= 0

  return (
    <li className="rounded-md border-brut-sm bg-paper px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">{chain.groupName}</span>
          <span className="block font-mono text-[10px] uppercase tracking-widest text-ink/45">
            {chain.approvedSteps} pertukaran diterima
            {chain.pendingSteps > 0 && ` · ${chain.pendingSteps} menunggu`} · {chain.earnedPoint} poin
          </span>
        </span>

        <span
          className={`shrink-0 font-mono text-[10px] font-bold uppercase ${
            ditutup ? 'text-success' : 'text-warning'
          }`}
        >
          {chain.status === 'ACCEPTED'
            ? 'rantai ditutup'
            : chain.status === 'REJECTED'
              ? 'rantai dihentikan'
              : 'belum diakhiri'}
        </span>
      </div>

      {!ditutup && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-ink/10 pt-3">
          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-ink/45">
              Nilai akhir rantai
            </span>
            <Input
              className="mt-1 w-32"
              type="number"
              min={0}
              value={point}
              onChange={e => setPoint(e.target.value)}
              error={!valid}
            />
          </label>

          <Button
            size="sm"
            variant="secondary"
            loading={isPending}
            disabled={!valid}
            onClick={() => finish({ assignmentId: chain.assignmentId, point: parsed })}
          >
            Akhiri Rantai
          </Button>

          <span className="text-xs text-ink/50">
            Pertukaran yang masih menunggu ikut ditutup — nilainya sudah terwakili angka ini.
          </span>

          <ErrorMessage message={apiError?.message} />
        </div>
      )}
    </li>
  )
}

/**
 * Daftar rantai barter, dipenggal halaman.
 *
 * Jumlahnya sebanyak kelompok yang mengikuti barter — belasan sampai puluhan —
 * dan menampilkan seluruhnya sekaligus membuat panel audit ini panjangnya
 * berlipat tanpa ada yang membacanya sampai bawah.
 */
function BarterList({ chains }: { chains: BarterChainSummary[] }) {
  const pagination = usePagination(chains)

  if (chains.length === 0) {
    return (
      <p className="mt-2 rounded-md border-brut bg-paper p-6 text-center text-sm text-ink/60">
        Semua rantai barter sudah diakhiri.
      </p>
    )
  }

  return (
    <>
      <div className="mt-2">
        <Pagination
          page={pagination.page}
          perPage={pagination.perPage}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          onPerPageChange={pagination.setPerPage}
        />
      </div>

      <ul className="mt-2 space-y-2">
        {pagination.pageItems.map(c => (
          <BarterRow key={c.assignmentId} chain={c} />
        ))}
      </ul>
    </>
  )
}

export default function ValidationHistory({ missionIds }: { missionIds: string[] }) {
  const { data, isLoading, error } = useSubmissionHistoryQuery()

  const [status, setStatus] = useState<StatusFilter>('SEMUA')
  const [type, setType] = useState<'SEMUA' | MissionType>('SEMUA')
  const [groupName, setGroupName] = useState('SEMUA')
  const [search, setSearch] = useState('')

  const all = data?.submissions ?? []

  // Saringan misi dari panel di atas tetap berlaku: panitia yang memegang tiga
  // misi tidak ingin auditnya melebar ke misi orang lain.
  const inScope = missionIds.length
    ? all.filter(s => missionIds.includes(s.missionId))
    : all

  const keyword = search.trim().toLowerCase()
  const filtered = inScope.filter(s => {
    if (status !== 'SEMUA' && s.status !== status) return false
    if (type !== 'SEMUA' && s.missionType !== type) return false
    if (groupName !== 'SEMUA' && s.groupName !== groupName) return false
    if (keyword && !`${s.missionTitle} ${s.groupName} ${s.submittedByName}`.toLowerCase().includes(keyword))
      return false
    return true
  })

  const pagination = usePagination(filtered)

  // Rantai barter punya paginasinya sendiri: jumlahnya sebanyak kelompok
  // (belasan sampai puluhan) dan tidak ada hubungannya dengan saringan
  // kiriman di atas — barter tidak meninggalkan kiriman sama sekali.
  const [barterScope, setBarterScope] = useState<'BELUM' | 'SEMUA'>('BELUM')

  // Hitungan dihitung atas cakupan sebelum saringan status, supaya angkanya
  // berarti "sebanyak ini yang akan kamu lihat kalau menekannya".
  const countOf = (value: StatusFilter) =>
    value === 'SEMUA' ? inScope.length : inScope.filter(s => s.status === value).length

  const groupNames = [...new Set(inScope.map(s => s.groupName))].sort((a, b) =>
    a.localeCompare(b, 'id'),
  )

  if (isLoading) return <CardSkeleton />

  if (error || !data) {
    return (
      <p className="rounded-md border-brut !border-danger bg-paper-raised p-4 text-sm font-bold text-danger">
        Gagal memuat riwayat validasi.
      </p>
    )
  }

  const berjalan = data.barterChains.filter(c => c.status !== 'ACCEPTED' && c.status !== 'REJECTED')
  const barterVisible = barterScope === 'BELUM' ? berjalan : data.barterChains

  return (
    <div className="space-y-5 rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
      <div>
        <h2 className="font-display text-xl text-ink">Audit Validasi</h2>
        <p className="mt-1 text-sm text-ink/60">
          Seluruh kiriman peserta beserta keputusannya. Ketuk satu baris untuk melihat buktinya dan
          membetulkan nilai atau statusnya.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(filter => {
            const active = status === filter.value

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setStatus(filter.value)
                  pagination.setPage(1)
                }}
                className={`rounded-md border-brut-sm px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide brutal-press-sm ${
                  active ? 'bg-ink text-paper' : 'bg-paper text-ink/70'
                }`}
              >
                {filter.label} ({countOf(filter.value)})
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            className="w-auto flex-1 sm:flex-none"
            aria-label="Saring menurut jenis misi"
            value={type}
            onChange={e => {
              setType(e.target.value as 'SEMUA' | MissionType)
              pagination.setPage(1)
            }}
          >
            <option value="SEMUA">Semua jenis misi</option>
            {MISSION_TYPE_ORDER.map(t => (
              <option key={t} value={t}>
                {MISSION_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>

          <Select
            className="w-auto flex-1 sm:flex-none"
            aria-label="Saring menurut kelompok"
            value={groupName}
            onChange={e => {
              setGroupName(e.target.value)
              pagination.setPage(1)
            }}
          >
            <option value="SEMUA">Semua kelompok</option>
            {groupNames.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>

          <Input
            className="min-w-[12rem] flex-1"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              pagination.setPage(1)
            }}
            placeholder="Cari misi, kelompok, atau pengirim…"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-md border-brut bg-paper p-6 text-center text-sm text-ink/60">
          Tidak ada kiriman yang cocok dengan saringanmu.
        </p>
      ) : (
        <>
          <Pagination
            page={pagination.page}
            perPage={pagination.perPage}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPerPageChange={pagination.setPerPage}
          />

          <ul className="space-y-2">
            {pagination.pageItems.map(s => (
              <AuditRow key={s.id} submission={s} />
            ))}
          </ul>
        </>
      )}

      {data.barterChains.length > 0 && (
        <section>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h3 className="font-display text-lg text-ink">Bigger Better</h3>
            <span className="font-mono text-xs text-ink/40">{data.barterChains.length}</span>
          </div>

          {berjalan.length > 0 && (
            <p className="mt-2 rounded-md border-brut-sm !border-warning bg-warning/10 px-4 py-2.5 text-xs font-bold text-warning">
              {berjalan.length} rantai sudah diterima pertukarannya tetapi belum diakhiri. Poin tiap
              pertukaran memang sudah masuk — yang belum ada bukan nilainya, melainkan status
              selesainya. Tekan <strong>Akhiri Rantai</strong> pada masing-masing untuk menutupnya.
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ['BELUM', `Belum diakhiri (${berjalan.length})`],
                ['SEMUA', `Semua (${data.barterChains.length})`],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={barterScope === value}
                onClick={() => setBarterScope(value)}
                className={`rounded-md border-brut-sm px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide brutal-press-sm ${
                  barterScope === value ? 'bg-ink text-paper' : 'bg-paper text-ink/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <BarterList chains={barterVisible} />
        </section>
      )}
    </div>
  )
}

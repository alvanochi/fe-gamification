'use client'

import { useRef, useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useSubmitMissionWithEvidenceMutation } from '@/hooks/use-submissions'
import { useCheckInMutation, useCheckOutMutation } from '@/hooks/use-missions'
import { useSponsorsQuery } from '@/hooks/use-sponsors'
import { useGeolocation } from '@/hooks/use-geolocation'
import { AppError } from '@/libs/api'
import BarterChain from '@/components/organisms/race/BarterChain'
import QuizForm from '@/components/organisms/race/QuizForm'
import { Assignment, Mission, MissionCheckIn, Submission } from '@/types/mission'
import { getLatestSubmissionForMission } from '@/utils/mission/submission-status'
import {
  CLUE_TYPE_LABEL,
  MISSION_CATEGORY_LABEL,
  MISSION_TYPE_COLOR_VAR,
  MISSION_TYPE_LABEL,
  PROOF_ACCEPT,
  PROOF_TYPE_LABEL,
  formatMissionPoints,
  describeScoring,
  isFileProof,
} from '@/utils/mission/type-meta'

function EvidencePicker({
  onPick,
  previewUrl,
  accept,
  label,
  isVideo,
}: {
  onPick: (file: File) => void
  previewUrl: string | null
  accept: string
  label: string
  isVideo: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border-brut bg-paper"
      >
        {previewUrl ? (
          isVideo ? (
            <video src={previewUrl} className="h-full w-full object-cover" muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Pratinjau bukti" className="h-full w-full object-cover" />
          )
        ) : (
          <span className="px-4 text-center text-sm font-bold text-ink/50">{label}</span>
        )}
      </button>
    </div>
  )
}

function StatusBanner({
  status,
  rejectReason,
  awardedPoint,
}: {
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectReason?: string | null
  awardedPoint?: number | null
}) {
  const copy = {
    PENDING: { text: 'Menunggu validasi panitia', className: '!border-warning text-warning' },
    APPROVED: {
      text: awardedPoint != null ? `Disetujui — ${awardedPoint} poin masuk!` : 'Disetujui — poin sudah masuk!',
      className: '!border-success text-success',
    },
    REJECTED: {
      text: rejectReason ? `Ditolak — ${rejectReason}` : 'Ditolak — kirim ulang buktimu',
      className: '!border-danger text-danger',
    },
  }[status]

  return (
    <p className={`rounded-md border-brut bg-paper px-4 py-3 text-sm font-bold ${copy.className}`}>
      {copy.text}
    </p>
  )
}

/** Baris-baris detail MR6: kategori, lokasi, sesi, durasi, bukti yang diminta. */
function MissionMeta({ mission }: { mission: Mission }) {
  const rows: Array<[string, string]> = [['Kategori', MISSION_CATEGORY_LABEL[mission.category]]]

  if (mission.locationName) rows.push(['Lokasi', mission.locationName])
  if (mission.sessionStart && mission.sessionEnd) {
    rows.push(['Sesi', `${mission.sessionStart} - ${mission.sessionEnd} WIB`])
  }
  rows.push(['Waktu', mission.durationMinutes ? `${mission.durationMinutes} menit` : 'Bebas'])
  rows.push(['Pemain', `${mission.participantCount} orang`])
  rows.push(['Pembuktian', PROOF_TYPE_LABEL[mission.proofType]])
  rows.push(['Penilaian', describeScoring(mission)])
  if (mission.equipment) rows.push(['Peralatan', mission.equipment])

  return (
    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="font-mono uppercase tracking-wide text-ink/45">{label}</dt>
          <dd className="whitespace-pre-line font-semibold text-ink/80">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Kolom "PETUNJUK" MR6 — morse, sandi angka, GPS, foto, atau peta. */
function ClueBox({ mission }: { mission: Mission }) {
  if (mission.clueType === 'NONE' || !mission.clue) return null

  const isImage = mission.clueType === 'FOTO' || mission.clueType === 'MAP'

  return (
    <div className="mt-3 rounded-md border-brut border-dashed bg-paper px-4 py-3">
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
        Petunjuk · {CLUE_TYPE_LABEL[mission.clueType]}
      </p>
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mission.clue} alt="Petunjuk lokasi" className="mt-2 w-full rounded border-brut-sm" />
      ) : (
        <p className="mt-1 break-words font-mono text-sm font-bold tracking-wide text-ink">
          {mission.clue}
        </p>
      )}
    </div>
  )
}

export default function MissionCard({
  mission,
  submissions,
  checkIn,
  assignment,
}: {
  mission: Mission
  submissions: Submission[]
  checkIn?: MissionCheckIn | null
  assignment?: Assignment | null
}) {
  const latest = getLatestSubmissionForMission(submissions, mission.id)
  const canSubmit = !latest || latest.status === 'REJECTED'

  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [queueNumber, setQueueNumber] = useState('')
  const geolocation = useGeolocation()

  const { data: sponsors } = useSponsorsQuery()
  const sponsor = mission.sponsorId ? sponsors?.find(s => s.id === mission.sponsorId) : undefined

  const { mutate: submitMission, isPending, error } = useSubmitMissionWithEvidenceMutation()
  const checkInMutation = useCheckInMutation()
  const checkOutMutation = useCheckOutMutation()

  const apiError = (error ?? checkInMutation.error ?? checkOutMutation.error) as AppError | null

  const needsFile = isFileProof(mission.proofType)
  const isVideoProof = mission.proofType === 'VIDEO'
  // Misi terstruktur wajib check-in dulu — tombol kirim baru terbuka setelahnya.
  const blockedByCheckIn = mission.requiresCheckIn && !checkIn

  const handlePickEvidence = (file: File) => {
    setEvidenceFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmitTantangan = () => {
    submitMission({
      missionId: mission.id,
      file: evidenceFile,
      // Untuk bukti non-file (link sosmed, input hasil, laporan petugas)
      // isian teks inilah yang menjadi buktinya.
      answerText: answerText.trim() || undefined,
    })
  }

  const handleSubmitSoalLokasi = () => {
    if (!geolocation.coords) return
    submitMission({
      missionId: mission.id,
      file: evidenceFile,
      answerText,
      geoLat: geolocation.coords.lat,
      geoLng: geolocation.coords.lng,
    })
  }

  const evidencePicker = needsFile ? (
    <EvidencePicker
      onPick={handlePickEvidence}
      previewUrl={previewUrl}
      accept={PROOF_ACCEPT[mission.proofType]}
      isVideo={isVideoProof}
      label={`Ketuk untuk pilih ${PROOF_TYPE_LABEL[mission.proofType].toLowerCase()} bukti`}
    />
  ) : null

  const textAnswerInput = (
    <input
      value={answerText}
      onChange={e => setAnswerText(e.target.value)}
      placeholder={
        mission.proofType === 'LINK_SOSMED'
          ? 'Tempel link postingan (IG/TikTok/YouTube)'
          : mission.proofType === 'INPUT_HASIL'
            ? 'Tulis hasil yang kamu dapat'
            : 'Jawabanmu'
      }
      className="w-full rounded-md border-brut bg-paper px-4 py-3 font-medium text-ink shadow-brutal-sm focus:outline-none"
    />
  )

  return (
    // Bingkai penuh berwarna tipe misi — bukan hanya garis kiri — supaya
    // kartunya terlihat utuh dan tipenya terbaca sekilas dari kejauhan.
    <li
      className="overflow-hidden rounded-lg border-brut bg-paper-raised shadow-brutal-sm"
      style={{ borderColor: MISSION_TYPE_COLOR_VAR[mission.type] }}
    >
      <div
        className="px-5 py-2"
        style={{ backgroundColor: MISSION_TYPE_COLOR_VAR[mission.type] }}
      >
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-white">
          {MISSION_TYPE_LABEL[mission.type]}
          {mission.isMandatory && ' · WAJIB'}
          {mission.requiresCheckIn && ' · PERLU CHECK-IN'}
        </p>
      </div>
      <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display text-xl text-ink">{mission.title}</h4>
        </div>
        <span className="shrink-0 rounded-full border-brut-sm bg-primary px-3 py-1 font-display text-sm text-primary-ink">
          {formatMissionPoints(mission)}
        </span>
      </div>

      {/* FR-11: penanda misi yang didukung sponsor. */}
      {sponsor && (
        <div className="mt-3 flex items-center gap-2 rounded-md border-brut-sm border-secondary bg-secondary/10 px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sponsor.logoUrl} alt={sponsor.name} className="h-6 w-auto max-w-[64px] object-contain" />
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            Misi didukung {sponsor.name}
          </p>
        </div>
      )}

      <p className="mt-2 text-sm text-ink/70">{mission.description}</p>

      <MissionMeta mission={mission} />
      <ClueBox mission={mission} />

      {mission.requiresCheckIn && (
        <div className="mt-4 space-y-2 rounded-md border-brut bg-paper px-4 py-3">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
            Check-in pos
          </p>

          {!checkIn && (
            <>
              <input
                value={queueNumber}
                onChange={e => setQueueNumber(e.target.value)}
                placeholder="Nomor antrean (opsional)"
                className="w-full rounded-md border-brut-sm bg-paper-raised px-3 py-2 text-sm font-medium text-ink focus:outline-none"
              />
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                loading={checkInMutation.isPending}
                onClick={() =>
                  checkInMutation.mutate({
                    missionId: mission.id,
                    queueNumber: queueNumber.trim() || undefined,
                  })
                }
              >
                Check-in
              </Button>
            </>
          )}

          {checkIn && !checkIn.checkedOutAt && (
            <>
              <p className="text-sm font-bold text-success">
                Sudah check-in
                {checkIn.queueNumber ? ` · antrean ${checkIn.queueNumber}` : ''}
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                loading={checkOutMutation.isPending}
                disabled={!latest}
                onClick={() => checkOutMutation.mutate({ missionId: mission.id })}
              >
                Check-out
              </Button>
              <p className="text-xs text-ink/55">
                {latest
                  ? 'Jangan lupa check-out supaya antrean pos bisa lanjut ke kelompok berikutnya.'
                  : 'Kirim bukti misi ini dulu, baru bisa check-out dari pos.'}
              </p>
            </>
          )}

          {checkIn?.checkedOutAt && (
            <p className="text-sm font-bold text-ink/60">Sudah check-out dari pos ini.</p>
          )}
        </div>
      )}

      {latest && (
        <div className="mt-4">
          <StatusBanner
            status={latest.status}
            rejectReason={latest.rejectReason}
            awardedPoint={latest.awardedPoint}
          />
        </div>
      )}

      {canSubmit && mission.type === 'TANTANGAN' && (
        <div className="mt-4 space-y-3">
          {evidencePicker}
          {!needsFile && textAnswerInput}
          <Button
            size="sm"
            className="w-full"
            loading={isPending}
            disabled={blockedByCheckIn || (needsFile ? !evidenceFile : !answerText.trim())}
            onClick={handleSubmitTantangan}
          >
            Kirim Bukti
          </Button>
          {blockedByCheckIn && (
            <p className="text-xs font-bold text-ink/50">Check-in dulu sebelum mengirim bukti.</p>
          )}
          <ErrorMessage message={apiError?.message} />
        </div>
      )}

      {canSubmit && mission.type === 'SOAL_LOKASI' && (
        <div className="mt-4 space-y-3">
          {evidencePicker}
          {/* Isian teks hanya diminta bila misinya memang tidak meminta berkas.
              Sebelumnya keduanya wajib sekaligus, sehingga misi lokasi yang
              buktinya foto tetap menolak dikirim sampai peserta mengarang
              jawaban teks yang tidak pernah diminta. */}
          {!needsFile && textAnswerInput}

          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            loading={geolocation.isLocating}
            onClick={geolocation.requestLocation}
          >
            {geolocation.coords ? 'Lokasi Terekam ✓' : 'Ambil Lokasi Saya'}
          </Button>
          <ErrorMessage message={geolocation.error ?? undefined} />

          <Button
            size="sm"
            className="w-full"
            loading={isPending}
            disabled={
              blockedByCheckIn ||
              !geolocation.coords ||
              (needsFile ? !evidenceFile : !answerText.trim())
            }
            onClick={handleSubmitSoalLokasi}
          >
            Kirim Jawaban
          </Button>
          {blockedByCheckIn && (
            <p className="text-xs font-bold text-ink/50">Check-in dulu sebelum mengirim jawaban.</p>
          )}
          <ErrorMessage message={apiError?.message} />
        </div>
      )}

      {canSubmit && mission.type === 'KUIS' && (
        <QuizForm missionId={mission.id} disabled={blockedByCheckIn} />
      )}

      {mission.type === 'BIGGER_BETTER' && (
        <BarterChain missionId={mission.id} assignment={assignment} />
      )}
      </div>
    </li>
  )
}

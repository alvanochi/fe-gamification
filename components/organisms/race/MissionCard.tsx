'use client'

import { useRef, useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useSubmitMissionMutation } from '@/hooks/use-submissions'
import { useGeolocation } from '@/hooks/use-geolocation'
import { AppError } from '@/libs/api'
import { Mission, Submission } from '@/types/mission'
import { getLatestSubmissionForMission } from '@/utils/mission/submission-status'
import { MISSION_TYPE_COLOR_VAR, MISSION_TYPE_LABEL } from '@/utils/mission/type-meta'

function PhotoPicker({ onPick, previewUrl }: { onPick: (file: File) => void; previewUrl: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Pratinjau bukti" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-ink/50">Ketuk untuk pilih foto bukti</span>
        )}
      </button>
    </div>
  )
}

function StatusBanner({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
  const copy = {
    PENDING: { text: 'Menunggu validasi panitia', className: '!border-warning text-warning' },
    APPROVED: { text: 'Disetujui — poin sudah masuk!', className: '!border-success text-success' },
    REJECTED: { text: 'Ditolak — kirim ulang buktimu', className: '!border-danger text-danger' },
  }[status]

  return (
    <p className={`rounded-md border-brut bg-paper px-4 py-3 text-sm font-bold ${copy.className}`}>
      {copy.text}
    </p>
  )
}

export default function MissionCard({
  mission,
  submissions,
}: {
  mission: Mission
  submissions: Submission[]
}) {
  const latest = getLatestSubmissionForMission(submissions, mission.id)
  const canSubmit = !latest || latest.status === 'REJECTED'

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const geolocation = useGeolocation()

  const { mutate: submitMission, isPending, error } = useSubmitMissionMutation()
  const apiError = error as AppError | null

  const handlePickPhoto = (file: File) => {
    setPhotoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmitTantangan = () => {
    submitMission({ missionId: mission.id, answerText: 'Bukti foto diambil melalui aplikasi.' })
  }

  const handleSubmitSoalLokasi = () => {
    if (!geolocation.coords) return
    submitMission({
      missionId: mission.id,
      answerText,
      geoLat: geolocation.coords.lat,
      geoLng: geolocation.coords.lng,
    })
  }

  return (
    <li
      className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm"
      style={{ borderLeftWidth: 8, borderLeftColor: MISSION_TYPE_COLOR_VAR[mission.type] }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="font-mono text-[11px] font-bold uppercase tracking-widest"
            style={{ color: MISSION_TYPE_COLOR_VAR[mission.type] }}
          >
            {MISSION_TYPE_LABEL[mission.type]}
            {mission.isMandatory && ' · WAJIB'}
          </p>
          <h4 className="mt-1 font-display text-xl text-ink">{mission.title}</h4>
        </div>
        <span className="shrink-0 rounded-full border-brut-sm bg-primary px-3 py-1 font-display text-sm text-primary-ink">
          {mission.pointWeight} pt
        </span>
      </div>

      <p className="mt-2 text-sm text-ink/70">{mission.description}</p>

      {latest && (
        <div className="mt-4">
          <StatusBanner status={latest.status} />
        </div>
      )}

      {canSubmit && mission.type === 'TANTANGAN' && (
        <div className="mt-4 space-y-3">
          <PhotoPicker onPick={handlePickPhoto} previewUrl={previewUrl} />
          <Button
            size="sm"
            className="w-full"
            loading={isPending}
            disabled={!photoFile}
            onClick={handleSubmitTantangan}
          >
            Kirim Bukti
          </Button>
          <ErrorMessage message={apiError?.message} />
        </div>
      )}

      {canSubmit && mission.type === 'SOAL_LOKASI' && (
        <div className="mt-4 space-y-3">
          <input
            value={answerText}
            onChange={e => setAnswerText(e.target.value)}
            placeholder="Jawabanmu"
            className="w-full rounded-md border-brut bg-paper px-4 py-3 font-medium text-ink shadow-brutal-sm focus:outline-none"
          />
          <PhotoPicker onPick={handlePickPhoto} previewUrl={previewUrl} />

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
            disabled={!photoFile || !answerText.trim() || !geolocation.coords}
            onClick={handleSubmitSoalLokasi}
          >
            Kirim Jawaban
          </Button>
          <ErrorMessage message={apiError?.message} />
        </div>
      )}

      {canSubmit && mission.type === 'BIGGER_BETTER' && (
        <p className="mt-4 rounded-md border-brut bg-paper px-4 py-3 text-sm text-ink/60">
          Fitur barter (Bigger Better) akan segera hadir di aplikasi.
        </p>
      )}
    </li>
  )
}

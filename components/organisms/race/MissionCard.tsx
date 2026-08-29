'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import ErrorMessage from '@/components/elements/ErrorMessage'
import EvidencePicker from '@/components/fragments/EvidencePicker'
import MissionPostQr from '@/components/organisms/race/MissionPostQr'
import PostDurationCountdown from '@/components/organisms/race/PostDurationCountdown'
import SponsorLogo from '@/components/fragments/SponsorLogo'
import { useSubmitMissionWithEvidenceMutation } from '@/hooks/use-submissions'
import { useSponsorsQuery } from '@/hooks/use-sponsors'
import { useGeolocation } from '@/hooks/use-geolocation'
import { AppError } from '@/libs/api'
import BarterChain from '@/components/organisms/race/BarterChain'
import QuizForm from '@/components/organisms/race/QuizForm'
import { Assignment, BoardMission, Mission, MissionCheckIn, Submission } from '@/types/mission'
import { getLatestSubmissionForMission } from '@/utils/mission/submission-status'
import {
  CLUE_TYPE_LABEL,
  MISSION_CATEGORY_LABEL,
  MISSION_TYPE_COLOR_VAR,
  MISSION_TYPE_LABEL,
  PROOF_TYPE_LABEL,
  formatMissionPoints,
  describeScoring,
  isFileProof,
  isOfficerScored,
} from '@/utils/mission/type-meta'

/** Lencana ringkas di kepala kartu — terbaca tanpa membuka isinya. */
const STATUS_CHIP: Record<BoardMission['groupStatus'], { label: string; className: string }> = {
  BELUM: { label: 'Belum dikerjakan', className: 'font-bold text-ink/55' },
  MENUNGGU: { label: 'Menunggu validasi', className: 'font-bold text-warning' },
  SELESAI: { label: 'Selesai', className: 'font-bold text-success' },
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

/**
 * Baris-baris detail MR6: kategori, lokasi, sesi, durasi, bukti yang diminta.
 *
 * Tiap keterangan berdiri di kotaknya sendiri. Sebelumnya semuanya berdempetan
 * sebagai daftar dua kolom tanpa garis, sehingga "Waktu Bebas Pemain 1 orang"
 * terbaca sebagai satu kalimat panjang, bukan tiga fakta terpisah.
 *
 * Peralatan sengaja tidak ikut: daftar alat adalah urusan panitia yang menata
 * pos, bukan hal yang perlu dibaca peserta dari layarnya.
 */
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

  return (
    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-md border-brut-sm bg-paper px-3 py-2">
          <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/45">{label}</dt>
          <dd className="mt-0.5 whitespace-pre-line text-sm font-bold text-ink/80">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Kolom "PETUNJUK" MR6 — morse, sandi angka, teks, dan/atau foto.
 *
 * Teks dan foto tampil berdampingan, bukan bergantian: misi seperti "foto di
 * titik berikut ini" memberi kalimat perintahnya lalu lima foto papan nama
 * yang harus dicari. Menampilkan salah satunya saja menghilangkan separuh
 * petunjuknya.
 */
function ClueBox({ mission }: { mission: Mission }) {
  const images = mission.clueImages ?? []
  if (mission.clueType === 'NONE' || (!mission.clue && !images.length)) return null

  return (
    <div className="mt-3 rounded-md border-brut border-dashed bg-paper px-4 py-3">
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
        Petunjuk · {CLUE_TYPE_LABEL[mission.clueType]}
      </p>

      {mission.clue && (
        <p className="mt-1 break-words font-mono text-sm font-bold tracking-wide text-ink">
          {mission.clue}
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {images.map((src, index) => (
            <li key={src}>
              <a href={src} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Petunjuk ${index + 1}`}
                  className="aspect-square w-full rounded border-brut-sm object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
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
  mission: BoardMission
  submissions: Submission[]
  checkIn?: MissionCheckIn | null
  assignment?: Assignment | null
}) {
  const latest = getLatestSubmissionForMission(submissions, mission.id)

  /*
   * Misi kumpulan selalu terbuka.
   *
   * "Cari sepuluh orang bernama Agus" ditemukan satu per satu sepanjang hari,
   * jadi kiriman yang sudah disetujui tidak menutup misinya — justru menjadi
   * tanda bahwa temuan berikutnya boleh menyusul. Rekap di bawah yang memberi
   * tahu berapa yang sudah bernilai, supaya peserta tidak menebak-nebak
   * apakah kirimannya tadi terhitung.
   */
  const canSubmit = mission.allowMultipleSubmissions || !latest || latest.status === 'REJECTED'

  const [isOpen, setIsOpen] = useState(false)
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [answerText, setAnswerText] = useState('')
  const geolocation = useGeolocation()

  const { data: sponsors } = useSponsorsQuery()

  // Terbaru di atas. Hanya dipakai misi kumpulan; misi biasa cukup melihat
  // kiriman terakhirnya lewat StatusBanner.
  const missionSubmissions = submissions
    .filter(s => s.missionId === mission.id)
    .sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)))
  const sponsor = mission.sponsorId ? sponsors?.find(s => s.id === mission.sponsorId) : undefined

  const { mutate: submitMission, isPending, error } = useSubmitMissionWithEvidenceMutation()
  const apiError = error as AppError | null

  const needsFile = isFileProof(mission.proofType)
  // Misi yang dinilai petugas di pos tidak menunggu kiriman apa pun dari
  // peserta — petugasnya yang mencatat hasilnya setelah memindai QR.
  const officerScored = isOfficerScored(mission.proofType)
  // Misi terstruktur wajib check-in dulu — tombol kirim baru terbuka setelahnya.
  const blockedByCheckIn = mission.requiresCheckIn && !checkIn

  const handleSubmitTantangan = () => {
    submitMission({
      missionId: mission.id,
      files: evidenceFiles,
      // Untuk bukti non-file (link sosmed, input hasil) isian teks inilah yang
      // menjadi buktinya.
      answerText: answerText.trim() || undefined,
    })
  }

  const handleSubmitSoalLokasi = () => {
    if (!geolocation.coords) return
    submitMission({
      missionId: mission.id,
      files: evidenceFiles,
      answerText,
      geoLat: geolocation.coords.lat,
      geoLng: geolocation.coords.lng,
    })
  }

  const evidencePicker = needsFile ? (
    <EvidencePicker
      proofType={mission.proofType}
      files={evidenceFiles}
      onChange={setEvidenceFiles}
    />
  ) : null

  /** Misi ini tidak akan pernah bisa dikirim peserta; hanya perlu dijelaskan. */
  const officerNotice = (
    <p className="mt-4 rounded-md border-brut !border-secondary bg-secondary/10 px-4 py-3 text-sm font-bold text-secondary">
      Misi ini dinilai langsung oleh petugas pos — kamu tidak perlu mengirim apa pun. Datangi
      posnya, tunjukkan QR untuk check-in, lalu mainkan. Nilainya dicatat petugas begitu selesai.
    </p>
  )

  const textAnswerInput = (
    <Input
      value={answerText}
      onChange={e => setAnswerText(e.target.value)}
      placeholder={
        mission.proofType === 'LINK_SOSMED'
          ? 'Tempel link postingan (IG/TikTok/YouTube)'
          : mission.proofType === 'INPUT_HASIL'
            ? 'Tulis hasil yang kamu dapat'
            : 'Jawabanmu'
      }
    />
  )

  return (
    // Bingkai penuh berwarna tipe misi — bukan hanya garis kiri — supaya
    // kartunya terlihat utuh dan tipenya terbaca sekilas dari kejauhan.
    <li
      className="overflow-hidden rounded-lg border-brut bg-paper-raised shadow-brutal-sm"
      style={{ borderColor: MISSION_TYPE_COLOR_VAR[mission.type] }}
    >
      <div className="px-5 py-2" style={{ backgroundColor: MISSION_TYPE_COLOR_VAR[mission.type] }}>
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-white">
          {MISSION_TYPE_LABEL[mission.type]}
          {mission.isMandatory && ' · WAJIB'}
          {mission.requiresCheckIn && ' · PERLU CHECK-IN'}
        </p>
      </div>

      {/* Penanda mendesak: sesi misi ini hampir tutup, atau misi ini yang
          menahan misi lain terbuka. Ditaruh di kepala kartu supaya terbaca
          bersama jenis misinya, tanpa perlu membuka detailnya. */}
      {mission.urgent && (
        <p className="border-b-brut-sm bg-danger px-5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white">
          ⏳{' '}
          {mission.minutesToSessionEnd != null && mission.minutesToSessionEnd >= 0
            ? `Sesi tutup ${mission.minutesToSessionEnd} menit lagi`
            : 'Kerjakan dulu — misi lain menunggu ini'}
        </p>
      )}

      {/* Kepala kartu selalu terlihat; isinya dibuka saat diketuk. Dengan lima
          puluh misi lebih, kartu yang seluruhnya terbuka membuat daftar ini
          sepanjang beberapa layar hanya untuk dilewati. */}
      <button
        type="button"
        onClick={() => !mission.locked && setIsOpen(open => !open)}
        aria-expanded={mission.locked ? undefined : isOpen}
        aria-disabled={mission.locked}
        className={`flex w-full items-start gap-3 px-5 py-4 text-left ${
          mission.locked ? 'cursor-default' : 'brutal-press-sm'
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl leading-tight text-ink">{mission.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-ink/45">
            <span className={STATUS_CHIP[mission.groupStatus].className}>
              {STATUS_CHIP[mission.groupStatus].label}
            </span>
            {mission.locationName && <span>· {mission.locationName}</span>}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border-brut-sm bg-primary px-3 py-1 font-display text-sm text-primary-ink">
            {formatMissionPoints(mission)}
          </span>
          <span aria-hidden className="font-mono text-sm text-ink/40">
            {mission.locked ? '🔒' : isOpen ? '▲' : '▼'}
          </span>
        </span>
      </button>

      {mission.locked && (
        <p className="border-t border-ink/10 px-5 pb-4 text-xs text-ink/50">
          Rinciannya dibuka panitia saat perlombaan dimulai.
        </p>
      )}

      {!mission.locked && isOpen && (
      <div className="border-t border-ink/10 px-5 pb-5 pt-4">
        {/* FR-11: penanda misi yang didukung sponsor. */}
        {sponsor && (
          <div className="mb-3 flex items-center gap-2 rounded-md border-brut-sm border-secondary bg-secondary/10 px-3 py-2">
            <span className="flex h-6 w-auto min-w-10 max-w-[64px] items-center justify-center rounded-sm bg-white px-1">
              <SponsorLogo src={sponsor.logoUrl} name={sponsor.name} className="max-h-5 max-w-full" />
            </span>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
              Misi didukung {sponsor.name}
            </p>
          </div>
        )}

        <p className="text-sm leading-relaxed text-ink/70">{mission.description}</p>

        <MissionMeta mission={mission} />
        <ClueBox mission={mission} />

        {mission.requiresCheckIn && (
          <div className="mt-4 space-y-3">
            {/* Kedatangan dan kepergian di pos dicatat petugas lewat pemindaian
                QR ini, bukan oleh peserta sendiri. QR-nya memuat pos ini —
                jadi tidak ada lagi kemungkinan tercatat di meja yang keliru. */}
            {checkIn && !checkIn.checkedOutAt && (
              <>
                <p className="rounded-md border-brut !border-warning bg-warning/15 px-4 py-3 text-sm font-bold text-warning">
                  ▶ Misi ini sedang dimainkan — kelompokmu tercatat berada di pos ini.
                </p>

                {/* Jatah waktu hanya berarti selama kelompok masih di pos:
                    setelah check-out, angka yang terus berjalan hanya
                    membingungkan. */}
                {mission.durationMinutes && (
                  <PostDurationCountdown
                    checkedInAt={checkIn.checkedInAt}
                    durationMinutes={mission.durationMinutes}
                  />
                )}
              </>
            )}

            <MissionPostQr missionId={mission.id} checkIn={checkIn} />
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

        {/* Misi kumpulan: rekap seluruh kiriman, bukan hanya yang terakhir.
            Tanpa ini peserta hanya melihat keadaan kiriman terbaru dan tidak
            punya cara tahu berapa temuannya yang sudah bernilai. */}
        {mission.allowMultipleSubmissions && (
          <div className="mt-4 rounded-md border-brut bg-paper px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
              Kiriman kelompokmu di misi ini
            </p>
            <p className="mt-1 text-sm font-bold text-ink">
              {mission.approvedCount} disetujui
              {mission.earnedPoint > 0 && ` · ${mission.earnedPoint} poin sudah masuk`}
            </p>

            {missionSubmissions.length > 0 && (
              <ul className="mt-2 space-y-1">
                {missionSubmissions.map((s, index) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-ink/55">Kiriman {missionSubmissions.length - index}</span>
                    <span
                      className={`font-mono uppercase ${
                        s.status === 'APPROVED'
                          ? 'text-success'
                          : s.status === 'REJECTED'
                            ? 'text-danger'
                            : 'text-warning'
                      }`}
                    >
                      {s.status === 'APPROVED'
                        ? `disetujui${s.awardedPoint != null ? ` · ${s.awardedPoint} poin` : ''}`
                        : s.status === 'REJECTED'
                          ? 'ditolak'
                          : 'menunggu validasi'}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-2 text-xs text-ink/50">
              Temuan berikutnya boleh langsung dikirim — tidak perlu menunggu yang ini divalidasi.
            </p>
          </div>
        )}

        {canSubmit && mission.type === 'TANTANGAN' && officerScored && officerNotice}

        {canSubmit && mission.type === 'TANTANGAN' && !officerScored && (
          <div className="mt-4 space-y-3">
            {evidencePicker}
            {!needsFile && textAnswerInput}
            <Button
              size="sm"
              className="w-full"
              loading={isPending}
              disabled={blockedByCheckIn || (needsFile ? !evidenceFiles.length : !answerText.trim())}
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

        {canSubmit && mission.type === 'SOAL_LOKASI' && officerScored && officerNotice}

        {canSubmit && mission.type === 'SOAL_LOKASI' && !officerScored && (
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
                (needsFile ? !evidenceFiles.length : !answerText.trim())
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
      )}
    </li>
  )
}

'use client'

import CardSkeleton from '@/components/skeleton/CardSkeleton'
import { useSubmissionHistoryQuery } from '@/hooks/use-submissions'
import type { BarterChainSummary, ValidatedSubmission } from '@/types/mission'
import { formatTime } from '@/utils/format/formatDate'
import { MISSION_TYPE_COLOR_VAR, MISSION_TYPE_LABEL } from '@/utils/mission/type-meta'

/**
 * Riwayat keputusan validasi.
 *
 * Antrean hanya memperlihatkan yang menunggu, jadi begitu sebuah bukti
 * diputuskan ia lenyap dari layar. Panitia yang ditanya "kelompok kami tadi
 * diterima atau tidak?" tidak punya tempat untuk melihatnya, dan yang ditolak
 * tidak bisa ditelusuri alasannya. Di sini keduanya tetap ada, lengkap dengan
 * nama pemeriksanya — keputusan yang bisa ditelusuri jauh lebih mudah
 * dipertanggungjawabkan daripada keputusan tanpa nama.
 */
function DecisionCard({ submission }: { submission: ValidatedSubmission }) {
  const disetujui = submission.status === 'APPROVED'

  return (
    <li
      className="rounded-md border-brut-sm bg-paper px-4 py-3"
      style={{ borderLeftWidth: 6, borderLeftColor: MISSION_TYPE_COLOR_VAR[submission.missionType] }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">
            {submission.missionTitle}
          </span>
          <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-ink/45">
            {submission.groupName} · {MISSION_TYPE_LABEL[submission.missionType]}
          </span>
        </span>

        <span
          className={`shrink-0 font-mono text-[10px] font-bold uppercase ${
            disetujui ? 'text-success' : 'text-danger'
          }`}
        >
          {disetujui
            ? // Kiriman lama yang divalidasi sebelum kolom nilai ada tidak
              // menyimpan angkanya — ditulis tanpa poin, bukan "0 poin" yang
              // keliru menyiratkan tidak dapat nilai.
              submission.awardedPoint != null
              ? `${submission.awardedPoint} poin`
              : 'disetujui'
            : 'ditolak'}
        </span>
      </div>

      <p className="mt-1 font-mono text-[10px] text-ink/45">
        dikirim {submission.submittedByName} pukul {formatTime(submission.createdAt)}
        {submission.validatedByName ? ` · diperiksa ${submission.validatedByName}` : ''}
        {submission.validatedAt ? ` pukul ${formatTime(submission.validatedAt)}` : ''}
      </p>

      {submission.rejectReason && (
        <p className="mt-1 text-xs font-bold text-danger">Alasan: {submission.rejectReason}</p>
      )}
    </li>
  )
}

/**
 * Rantai Bigger Better.
 *
 * Barter tidak meninggalkan kiriman, jadi ia tidak pernah muncul di daftar di
 * atas — dan kelompok yang rantainya masih berjalan terlihat seolah belum
 * mengerjakan apa pun. Bagian ini menjawab pertanyaan yang selalu muncul
 * menjelang penutupan: "kenapa Bigger Better kami belum ada nilainya?"
 */
function BarterRow({ chain }: { chain: BarterChainSummary }) {
  const ditutup = chain.status === 'ACCEPTED' || chain.status === 'REJECTED'

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border-brut-sm bg-paper px-4 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">{chain.groupName}</span>
        <span className="block font-mono text-[10px] uppercase tracking-widest text-ink/45">
          {chain.approvedSteps} pertukaran disetujui
          {chain.pendingSteps > 0 && ` · ${chain.pendingSteps} menunggu`}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block font-mono text-[10px] font-bold uppercase text-ink/70">
          {chain.earnedPoint} poin
        </span>
        <span
          className={`block font-mono text-[10px] uppercase ${
            ditutup ? 'text-success' : 'text-warning'
          }`}
        >
          {chain.status === 'ACCEPTED'
            ? 'rantai ditutup'
            : chain.status === 'REJECTED'
              ? 'rantai dihentikan'
              : 'masih berjalan'}
        </span>
      </span>
    </li>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h3 className="font-display text-lg text-ink">{title}</h3>
        <span className="font-mono text-xs text-ink/40">{count}</span>
      </div>
      <ul className="mt-2 space-y-2">{children}</ul>
    </section>
  )
}

export default function ValidationHistory({ missionIds }: { missionIds: string[] }) {
  const { data, isLoading, error } = useSubmissionHistoryQuery()

  if (isLoading) return <CardSkeleton />

  if (error || !data) {
    return (
      <p className="rounded-md border-brut !border-danger bg-paper-raised p-4 text-sm font-bold text-danger">
        Gagal memuat riwayat validasi.
      </p>
    )
  }

  // Saringan misi yang sama dengan antrean di atasnya: panitia yang memegang
  // tiga misi tidak ingin riwayatnya melebar ke misi orang lain.
  const inScope = missionIds.length
    ? data.submissions.filter(s => missionIds.includes(s.missionId))
    : data.submissions

  const disetujui = inScope.filter(s => s.status === 'APPROVED')
  const ditolak = inScope.filter(s => s.status === 'REJECTED')
  const berjalan = data.barterChains.filter(c => c.status !== 'ACCEPTED' && c.status !== 'REJECTED')

  return (
    <div className="space-y-6 rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
      <div>
        <h2 className="font-display text-xl text-ink">Riwayat Keputusan</h2>
        <p className="mt-1 text-sm text-ink/60">
          Bukti yang sudah diputuskan tidak hilang dari layar. Ikut menyebut siapa pemeriksanya,
          supaya setiap keputusan bisa ditelusuri.
        </p>
      </div>

      <Section title="Diterima" count={disetujui.length}>
        {disetujui.length === 0 ? (
          <li className="rounded-md border-brut-sm bg-paper px-4 py-3 text-sm text-ink/50">
            Belum ada yang disetujui.
          </li>
        ) : (
          disetujui.map(s => <DecisionCard key={s.id} submission={s} />)
        )}
      </Section>

      <Section title="Ditolak" count={ditolak.length}>
        {ditolak.length === 0 ? (
          <li className="rounded-md border-brut-sm bg-paper px-4 py-3 text-sm text-ink/50">
            Belum ada yang ditolak.
          </li>
        ) : (
          ditolak.map(s => <DecisionCard key={s.id} submission={s} />)
        )}
      </Section>

      {data.barterChains.length > 0 && (
        <Section title="Bigger Better" count={data.barterChains.length}>
          {data.barterChains.map(c => (
            <BarterRow key={c.assignmentId} chain={c} />
          ))}

          {berjalan.length > 0 && (
            <li className="rounded-md border-brut-sm !border-warning bg-warning/10 px-4 py-2.5 text-xs font-bold text-warning">
              {berjalan.length} rantai masih berjalan. Poin tiap pertukaran memang sudah masuk,
              tetapi misinya baru dianggap selesai setelah panitia menekan{' '}
              <strong>Akhiri</strong> di halaman Barter.
            </li>
          )}
        </Section>
      )}
    </div>
  )
}

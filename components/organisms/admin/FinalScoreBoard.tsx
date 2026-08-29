'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import {
  PLATFORM_LABEL,
  SOCIAL_PLATFORMS,
  useFinalScoresQuery,
  type FinalScoreGroup,
  type FinalScoreMember,
} from '@/hooks/use-final-scores'
import { formatTime } from '@/utils/format/formatDate'
import { downloadSheet } from '@/utils/download-sheet'
import { endpoints } from '@/libs/endpoint'

/** Angka nilai selalu dua desimal; pembobotan 70% jarang menghasilkan bulat. */
const nilai = (value: number) =>
  value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const MEDAL = ['🥇', '🥈', '🥉']

/**
 * Satu suku perhitungan, dengan namanya.
 *
 * Nilai akhir yang hanya menampilkan hasilnya membuat panitia tidak punya
 * jawaban saat kelompok bertanya "kenapa kami di bawah". Tiap suku berdiri
 * sendiri supaya bisa ditunjuk satu per satu.
 */
function Suku({
  label,
  value,
  hint,
  missing,
}: {
  label: string
  value: string
  hint?: string
  missing?: boolean
}) {
  return (
    <div className={`rounded-md border-brut-sm px-3 py-2 ${missing ? '!border-warning bg-warning/10' : 'bg-paper'}`}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">{label}</p>
      <p className={`mt-0.5 font-display text-lg ${missing ? 'text-warning' : 'text-ink'}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] leading-tight text-ink/50">{hint}</p>}
    </div>
  )
}

/**
 * Membaca satu anggota dengan aman.
 *
 * Layar ini dibuka tepat saat pengumuman juara, dan versi backend yang
 * melayaninya belum tentu sudah ikut diperbarui — server lama masih mengirim
 * `instagramUsername` tunggal, bukan `accounts` per platform. Mengakses
 * `accounts.INSTAGRAM` pada bentuk lama membuat seluruh halaman mati, bukan
 * sekadar satu baris yang kosong. Bentuk apa pun yang datang diratakan di
 * sini supaya yang gagal hanya keterangan kecilnya.
 */
const readMember = (member: FinalScoreMember) => {
  const legacy = (member as unknown as { instagramUsername?: string }).instagramUsername

  return {
    accounts: member.accounts ?? { INSTAGRAM: legacy ?? '', TIKTOK: '', YOUTUBE: '' },
    postCounts: member.postCounts ?? { INSTAGRAM: member.postCount ?? 0, TIKTOK: 0, YOUTUBE: 0 },
  }
}

function GroupRow({ group, missionWeight }: { group: FinalScoreGroup; missionWeight: number }) {
  const [open, setOpen] = useState(false)

  // Angka yang belum pernah dikirim pihak eksternal ditandai, bukan
  // ditampilkan sebagai nol. Nol yang sah dan nol karena belum ada datanya
  // adalah dua hal yang sangat berbeda menjelang pengumuman juara.
  const postsMissing = group.postCountAt === null
  const nettMissing = group.externalNettAt === null

  return (
    <li className="rounded-lg border-brut bg-paper-raised shadow-brutal-sm">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left brutal-press-sm"
      >
        <span className="w-10 shrink-0 text-center font-display text-2xl">
          {MEDAL[group.rank - 1] ?? group.rank}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-xl text-ink">{group.groupName}</span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-widest text-ink/45">
            {nilai(group.missionScore)} + {nilai(group.engagementScore)}
            {(postsMissing || nettMissing) && ' · data sosial belum lengkap'}
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="block font-display text-2xl text-ink">{nilai(group.finalScore)}</span>
          <span className="block font-mono text-[10px] uppercase tracking-widest text-ink/45">
            nilai akhir
          </span>
        </span>

        <span aria-hidden className="shrink-0 font-mono text-sm text-ink/40">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="border-t border-ink/10 px-5 pb-5 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
            Penilaian 1 · misi &amp; postingan
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <Suku label="Poin sistem" value={nilai(group.systemPoint)} hint="misi, barter, yel-yel" />
            <Suku
              label="Jumlah postingan"
              value={nilai(group.postCount)}
              hint={postsMissing ? 'belum dikirim' : `masuk ${formatTime(group.postCountAt)} WIB`}
              missing={postsMissing}
            />
            <Suku label="Subtotal kotor" value={nilai(group.grossPoint)} hint="sistem + postingan" />
            <Suku
              label={`× ${Math.round(missionWeight * 100)}%`}
              value={nilai(group.missionScore)}
              hint="penilaian 1"
            />
          </div>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink/45">
            Penilaian 2 · gaung media sosial
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Suku
              label="Nett likes & share"
              value={nilai(group.externalNett)}
              hint={
                nettMissing
                  ? 'belum dikirim pihak eksternal'
                  : `masuk ${formatTime(group.externalNettAt)} WIB · sudah dibobot 30% di sisi pengirim`
              }
              missing={nettMissing}
            />
            <Suku label="Penilaian 2" value={nilai(group.engagementScore)} />
          </div>

          {group.members.length > 0 && (
            <>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink/45">
                Postingan per anggota
              </p>
              <ul className="mt-2 divide-y divide-ink/10 rounded-md border-brut bg-paper">
                {group.members.map(member => {
                  const { accounts, postCounts } = readMember(member)

                  return (
                  <li
                    key={member.fullname}
                    className="flex flex-wrap items-center gap-3 px-4 py-2.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">
                        {member.fullname}
                      </span>

                      {/* Rinci per platform. Peserta boleh mendaftarkan satu,
                          dua, atau ketiganya — yang tidak didaftarkan tidak
                          ditampilkan sama sekali, bukan ditulis "0 postingan"
                          yang terbaca seolah akunnya ada tapi menganggur. */}
                      <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-ink/45">
                        {SOCIAL_PLATFORMS.filter(p => accounts[p]).map(p => (
                          <span key={p}>
                            {PLATFORM_LABEL[p]} @{accounts[p]} ·{' '}
                            <strong className="text-ink/70">{postCounts[p]}</strong>
                          </span>
                        ))}
                        {!SOCIAL_PLATFORMS.some(p => accounts[p]) && (
                          // Melewati Checkpoint 0: postingannya tidak akan
                          // pernah bisa dicocokkan pihak eksternal.
                          <span className="text-warning">tanpa akun media sosial</span>
                        )}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full border-brut-sm px-3 py-1 font-mono text-[10px] font-bold ${
                        SOCIAL_PLATFORMS.some(p => accounts[p])
                          ? 'bg-paper-raised text-ink/70'
                          : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {member.postCount ?? 0} postingan
                    </span>
                  </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </li>
  )
}

/**
 * Papan nilai akhir.
 *
 * Terpisah dari klasemen peserta: yang itu poin kotor sepanjang hari, yang ini
 * gabungan berbobot yang baru utuh setelah pihak eksternal mengirim data media
 * sosialnya. Karena itu layar ini tidak pernah menyembunyikan bagian yang
 * belum masuk — kelompok yang datanya belum lengkap ditandai, bukan diam-diam
 * dihitung sebagai nol.
 */
export default function FinalScoreBoard() {
  const { data, isLoading, error } = useFinalScoresQuery()
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const unduh = async () => {
    setDownloadError(null)
    setIsDownloading(true)
    try {
      await downloadSheet(endpoints.admin.sheetFinalScores, 'nilai-akhir.xlsx')
    } catch (e) {
      setDownloadError((e as Error).message)
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="rounded-md border-brut !border-danger bg-paper-raised p-4 text-sm font-bold text-danger">
        Gagal memuat nilai akhir.
      </p>
    )
  }

  if (data.groups.length === 0) {
    return (
      <p className="rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
        Belum ada kelompok.
      </p>
    )
  }

  const belumLengkap = data.groups.filter(g => !g.postCountAt || !g.externalNettAt).length

  return (
    <div className="space-y-4">
      <section className="rounded-lg border-brut bg-paper-raised p-4 shadow-brutal-sm">
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
          Rumus
        </p>
        <p className="mt-1 text-sm text-ink/75">
          <strong className="text-ink">Nilai akhir</strong> = (poin sistem + jumlah postingan) ×{' '}
          {Math.round(data.weights.mission * 100)}% + nett likes &amp; share.
        </p>
        <p className="mt-1 text-xs text-ink/50">
          Nett dari pihak eksternal sudah dibobot 30% di sisi mereka, jadi ditambahkan apa adanya.
        </p>

        {belumLengkap > 0 && (
          <p className="mt-3 rounded-md border-brut-sm !border-warning bg-warning/10 px-3 py-2 text-xs font-bold text-warning">
            {belumLengkap} kelompok belum lengkap data media sosialnya. Peringkat di bawah masih
            bisa berubah setelah kirimannya masuk.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm" variant="secondary" loading={isDownloading} onClick={unduh}>
            Unduh Nilai Akhir
          </Button>
          <span className="text-xs text-ink/50">
            Berisi rincian tiap suku perhitungan, postingan per peserta per platform, dan cara
            menghitungnya.
          </span>
        </div>

        <ErrorMessage message={downloadError ?? undefined} className="mt-2" />
      </section>

      <ul className="space-y-3">
        {data.groups.map(group => (
          <GroupRow key={group.groupId} group={group} missionWeight={data.weights.mission} />
        ))}
      </ul>
    </div>
  )
}

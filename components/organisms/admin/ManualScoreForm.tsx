'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import ErrorMessage from '@/components/elements/ErrorMessage'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import {
  PLATFORM_LABEL,
  SOCIAL_PLATFORMS,
  useFinalScoresQuery,
  useSaveManualScoresMutation,
  type FinalScoreGroup,
  type SocialPlatform,
} from '@/hooks/use-final-scores'
import { AppError } from '@/libs/api'
import { formatTime } from '@/utils/format/formatDate'

/** Angka dalam bentuk isian: kosong berarti "jangan ubah", bukan nol. */
type MemberDraft = Record<SocialPlatform, string>

const seedMember = (counts: Record<SocialPlatform, number>): MemberDraft => ({
  INSTAGRAM: String(counts?.INSTAGRAM ?? 0),
  TIKTOK: String(counts?.TIKTOK ?? 0),
  YOUTUBE: String(counts?.YOUTUBE ?? 0),
})

/**
 * Satu kelompok, disimpan sendiri.
 *
 * Menyimpan per kelompok — bukan satu tombol untuk seluruh acara — supaya
 * panitia bisa mengerjakannya sepotong-sepotong tanpa takut kehilangan yang
 * sudah diketik. Tiga puluh kelompok dikali enam anggota dikali tiga platform
 * adalah lima ratus lebih isian; tidak ada yang mau mengulanginya dari awal
 * karena satu baris ditolak.
 */
function GroupCard({ group }: { group: FinalScoreGroup }) {
  const { mutate: save, isPending, error } = useSaveManualScoresMutation()
  const apiError = error as AppError | null

  const [nett, setNett] = useState(String(group.externalNett ?? 0))
  const [members, setMembers] = useState<Record<string, MemberDraft>>(() =>
    Object.fromEntries(group.members.map(m => [m.userId, seedMember(m.postCounts)])),
  )
  const [saved, setSaved] = useState(false)

  const patch = (userId: string, platform: SocialPlatform, value: string) => {
    setSaved(false)
    setMembers(prev => ({ ...prev, [userId]: { ...prev[userId], [platform]: value } }))
  }

  const isCount = (value: string) => {
    const n = Number(value)
    return value.trim() !== '' && Number.isInteger(n) && n >= 0
  }

  const nettValid = nett.trim() === '' || (Number.isFinite(Number(nett)) && Number(nett) >= 0)
  const countsValid = Object.values(members).every(m => SOCIAL_PLATFORMS.every(p => isCount(m[p])))
  const valid = nettValid && countsValid

  // Total postingan diperlihatkan sambil mengetik: itu angka yang benar-benar
  // masuk ke rumus, dan salah ketik satu digit paling cepat ketahuan di sini.
  const totalPost = Object.values(members).reduce(
    (sum, m) => sum + SOCIAL_PLATFORMS.reduce((s, p) => s + (Number(m[p]) || 0), 0),
    0,
  )

  return (
    <li className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-xl text-ink">{group.groupName}</h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
          poin sistem {group.systemPoint} · total postingan {totalPost}
        </span>
      </div>

      <div className="mt-4">
        <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/45">
          Nett likes &amp; share (penilaian 2)
        </label>
        <Input
          className="mt-1 w-48"
          type="number"
          min={0}
          step="0.01"
          value={nett}
          onChange={e => {
            setSaved(false)
            setNett(e.target.value)
          }}
          error={!nettValid}
        />
        <p className="mt-1 text-xs text-ink/50">
          Angka yang sudah dibobot 30% di sisi pemantau — ditambahkan apa adanya.
          {group.externalNettAt
            ? ` Terakhir diperbarui ${formatTime(group.externalNettAt)} WIB.`
            : ' Belum pernah diisi.'}
        </p>
      </div>

      {group.members.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
            Jumlah postingan per anggota
          </p>

          <div className="mt-2 space-y-2">
            {group.members.map(member => (
              <div
                key={member.userId}
                className="rounded-md border-brut-sm bg-paper px-3 py-2.5"
              >
                <p className="truncate text-sm font-bold text-ink">{member.fullname}</p>

                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {SOCIAL_PLATFORMS.map(platform => {
                    const handle = member.accounts?.[platform]

                    return (
                      <label key={platform} className="block">
                        <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-ink/45">
                          {PLATFORM_LABEL[platform]}
                          {/* Username yang terdaftar ikut ditulis supaya panitia
                              tahu kolom mana yang memang punya akun — dan mana
                              yang diisi tanpa akun, yang berarti unggahannya
                              tidak akan bisa diperiksa siapa pun. */}
                          {handle ? ` @${handle}` : ' (tanpa akun)'}
                        </span>
                        <Input
                          className="mt-1"
                          type="number"
                          min={0}
                          value={members[member.userId]?.[platform] ?? '0'}
                          onChange={e => patch(member.userId, platform, e.target.value)}
                          error={!isCount(members[member.userId]?.[platform] ?? '')}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ErrorMessage message={apiError?.message} className="mt-3" />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          loading={isPending}
          disabled={!valid}
          onClick={() =>
            save(
              {
                groupId: group.groupId,
                nett: nett.trim() === '' ? undefined : Number(nett),
                members: group.members.map(m => ({
                  userId: m.userId,
                  INSTAGRAM: Number(members[m.userId]?.INSTAGRAM ?? 0),
                  TIKTOK: Number(members[m.userId]?.TIKTOK ?? 0),
                  YOUTUBE: Number(members[m.userId]?.YOUTUBE ?? 0),
                })),
              },
              { onSuccess: () => setSaved(true) },
            )
          }
        >
          Simpan {group.groupName}
        </Button>

        {saved && <span className="font-mono text-xs uppercase text-success">tersimpan ✓</span>}
        {!valid && (
          <span className="text-xs font-bold text-danger">
            Jumlah postingan harus bilangan bulat, nett tidak boleh negatif.
          </span>
        )}
      </div>
    </li>
  )
}

/**
 * Input manual nilai media sosial.
 *
 * Cadangan bagi jalur /api/external. Pihak yang memantau media sosial belum
 * tentu sempat menyambungkan sistemnya sebelum hari-H, dan nilai akhir tidak
 * boleh bergantung pada integrasi yang mungkin tidak pernah jadi.
 *
 * Menulis ke kolom yang sama persis dengan jalur eksternal, jadi keduanya
 * boleh dipakai bergantian — yang terakhir menulis yang berlaku.
 */
export default function ManualScoreForm() {
  const { data, isLoading, error } = useFinalScoresQuery()
  const [search, setSearch] = useState('')

  if (isLoading) return <CardSkeleton />

  if (error || !data) {
    return (
      <p className="rounded-md border-brut !border-danger bg-paper-raised p-4 text-sm font-bold text-danger">
        Gagal memuat daftar kelompok.
      </p>
    )
  }

  const keyword = search.trim().toLowerCase()
  const visible = keyword
    ? data.groups.filter(g => g.groupName.toLowerCase().includes(keyword))
    : data.groups

  return (
    <div className="space-y-4">
      <section className="rounded-lg border-brut bg-paper-raised p-4 shadow-brutal-sm">
        <p className="text-sm text-ink/70">
          Isi di sini bila pihak pemantau media sosial tidak mengirim datanya lewat API. Angkanya
          disimpan ke tempat yang sama, jadi kedua jalur boleh dipakai bergantian —{' '}
          <strong className="text-ink">yang terakhir menulis yang berlaku</strong>.
        </p>
        <Input
          className="mt-3"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama kelompok…"
        />
      </section>

      {visible.length === 0 ? (
        <p className="rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
          Tidak ada kelompok yang cocok.
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map(group => (
            // Isian awal disusun sekali saat kartunya dipasang; key ini membuat
            // kartu benar-benar baru ketika daftarnya tersaring ulang.
            <GroupCard key={group.groupId} group={group} />
          ))}
        </ul>
      )}
    </div>
  )
}

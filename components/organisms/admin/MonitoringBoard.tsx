'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import Pagination from '@/components/fragments/Pagination'
import { useGroupDetailQuery, useMonitoringQuery, type GroupProgress } from '@/hooks/use-monitoring'
import { useDebounce } from '@/hooks/use-debounce'
import { DEFAULT_PER_PAGE } from '@/hooks/use-pagination'
import { formatTime as waktu } from '@/utils/format/formatDate'

/** Tahap onboarding kelompok, dibaca dari jejak yang sudah tersimpan. */
const tahap = (g: GroupProgress) => {
  if (g.nameSetAt) return 'Siap berangkat'
  if (g.leaderId) return 'Menamai kelompok'
  if (g.photoUrl) return 'Voting ketua'
  return 'Konfirmasi & foto'
}

function GroupDetail({ group, onClose }: { group: GroupProgress; onClose: () => void }) {
  const { data, isLoading } = useGroupDetailQuery(group.id)

  return (
    <div className="rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-ink">{group.name}</h3>
          <p className="mt-1 text-sm text-ink/60">
            {group.score} poin · {group.presentCount}/{group.memberCount} hadir · {tahap(group)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Tutup
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-4">
          <CardSkeleton />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <section>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
              Anggota &amp; kehadiran
            </p>
            <ul className="mt-2 space-y-2">
              {data?.members.map(m => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-md border-brut-sm bg-paper px-3 py-2 text-sm"
                >
                  <span className="truncate font-bold text-ink">
                    {m.fullname}
                    {m.id === group.leaderId && (
                      <span className="ml-2 font-mono text-[10px] text-primary">KETUA</span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 font-mono text-[10px] uppercase ${
                      m.checkInAt ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {m.checkInAt ? `hadir ${waktu(m.checkInAt)}` : 'belum hadir'}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
              Check-in / check-out pos
            </p>
            {data?.checkIns.length ? (
              <ul className="mt-2 space-y-2">
                {data.checkIns.map(c => (
                  <li key={c.id} className="rounded-md border-brut-sm bg-paper px-3 py-2 text-sm">
                    <p className="font-bold text-ink">{c.missionTitle}</p>
                    <p className="mt-0.5 text-xs text-ink/55">
                      masuk {waktu(c.checkedInAt)} oleh {c.checkedInByName}
                      {c.checkedOutAt
                        ? ` · keluar ${waktu(c.checkedOutAt)}`
                        : ' · belum check-out'}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink/50">Belum ada check-in pos.</p>
            )}
          </section>

          <section>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
              Riwayat misi &amp; verifikator
            </p>
            {data?.activity.length ? (
              <ul className="mt-2 space-y-2">
                {data.activity.map(a => (
                  <li key={a.id} className="rounded-md border-brut-sm bg-paper px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-ink">{a.missionTitle}</span>
                      <span
                        className={`font-mono text-[10px] uppercase ${
                          a.status === 'APPROVED'
                            ? 'text-success'
                            : a.status === 'REJECTED'
                              ? 'text-danger'
                              : 'text-warning'
                        }`}
                      >
                        {a.status === 'APPROVED'
                          ? // Submission yang divalidasi sebelum kolom nilai ada tidak
                            // menyimpan angkanya — tampilkan tanpa poin, bukan "0 poin"
                            // yang keliru menyiratkan tidak dapat nilai.
                            a.awardedPoint != null
                            ? `disetujui · ${a.awardedPoint} poin`
                            : 'disetujui'
                          : a.status === 'REJECTED'
                            ? 'ditolak'
                            : 'menunggu'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink/55">
                      dikirim {a.submittedByName} pukul {waktu(a.createdAt)}
                      {a.validatedByName ? ` · diperiksa ${a.validatedByName}` : ''}
                    </p>
                    {a.rejectReason && (
                      <p className="mt-1 text-xs font-bold text-danger">Alasan: {a.rejectReason}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink/50">Belum ada aktivitas misi.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default function MonitoringBoard() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const { data, isLoading } = useMonitoringQuery(page, perPage)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<GroupProgress | null>(null)
  const debounced = useDebounce(search, 300)

  if (isLoading) return <CardSkeleton />

  if (selected) {
    return <GroupDetail group={selected} onClose={() => setSelected(null)} />
  }

  const groups = (data?.groups ?? []).filter(g =>
    g.name.toLowerCase().includes(debounced.trim().toLowerCase()),
  )

  const totalPending = groups.reduce((sum, g) => sum + g.pendingCount, 0)
  const totalPresent = groups.reduce((sum, g) => sum + g.presentCount, 0)
  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Kelompok', groups.length],
          ['Peserta hadir', `${data?.checkedIn ?? totalPresent}/${data?.totalParticipants ?? totalMembers}`],
          ['Menunggu kelompok', data?.waitingForGroup ?? 0],
          ['Menunggu validasi', totalPending],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-md border-brut bg-paper-raised px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">{label}</p>
            <p className="mt-1 font-display text-2xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Pembentukan kelompok dilakukan dari master Akun & Kelompok, tempat
          panitia bisa melihat siapa yang dimasukkan ke mana. Mengacaknya dari
          layar pemantauan berarti menekan tombol tanpa melihat akibatnya. */}
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Cari kelompok…"
      />

      {/* Di atas daftar: pindah halaman tidak perlu menggulir melewati seluruh
          tabel lebih dulu. */}
      <Pagination
        page={data?.page ?? page}
        perPage={data?.perPage ?? perPage}
        total={data?.totalGroups ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />

      {groups.length === 0 ? (
        <p className="rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
          Belum ada kelompok.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border-brut bg-paper-raised">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b-brut font-mono text-[10px] uppercase tracking-widest text-ink/45">
                <th className="px-4 py-3">Kelompok</th>
                <th className="px-4 py-3">Tahap</th>
                <th className="px-4 py-3">Hadir</th>
                <th className="px-4 py-3">Selesai</th>
                <th className="px-4 py-3">Menunggu</th>
                <th className="px-4 py-3">Ditolak</th>
                <th className="px-4 py-3">Di pos</th>
                <th className="px-4 py-3">Poin</th>
                <th className="px-4 py-3">Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr
                  key={g.id}
                  onClick={() => setSelected(g)}
                  className="cursor-pointer border-b border-ink/10 hover:bg-paper"
                >
                  <td className="px-4 py-3 font-bold text-ink">{g.name}</td>
                  <td className="px-4 py-3 text-xs text-ink/60">{tahap(g)}</td>
                  <td className="px-4 py-3">
                    <span className={g.presentCount < g.memberCount ? 'text-danger' : 'text-success'}>
                      {g.presentCount}/{g.memberCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-success">{g.approvedCount}</td>
                  <td className="px-4 py-3 font-bold text-warning">{g.pendingCount}</td>
                  <td className="px-4 py-3 text-ink/60">{g.rejectedCount}</td>
                  <td className="px-4 py-3 text-ink/60">{g.openCheckIns || '—'}</td>
                  <td className="px-4 py-3 font-display text-ink">{g.score}</td>
                  <td className="px-4 py-3 text-xs text-ink/50">{waktu(g.lastActivityAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-ink/50">
        Ketuk baris untuk melihat rincian anggota, riwayat misi, dan check-in pos. Halaman
        menyegarkan sendiri tiap 10 detik.
      </p>

    </div>
  )
}

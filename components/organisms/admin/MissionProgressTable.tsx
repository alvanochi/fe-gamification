'use client'

import { useState } from 'react'
import Input from '@/components/elements/Input'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import Pagination from '@/components/fragments/Pagination'
import { useMissionMonitoringQuery, type MissionProgress } from '@/hooks/use-monitoring'
import { useDebounce } from '@/hooks/use-debounce'

const waktu = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

const STATUS_STYLE = {
  APPROVED: 'bg-success/15 text-success',
  PENDING: 'bg-warning/15 text-warning',
  REJECTED: 'bg-danger/15 text-danger',
} as const

/**
 * Sudut pandang per misi: "misi A sudah dikerjakan kelompok mana saja".
 * Melengkapi peta progres yang menjawab "kelompok A sampai mana".
 */
export default function MissionProgressTable() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const { data, isLoading } = useMissionMonitoringQuery(page, perPage)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const debounced = useDebounce(search, 300)

  if (isLoading) return <CardSkeleton />

  const missions = (data?.missions ?? []).filter(m =>
    m.title.toLowerCase().includes(debounced.trim().toLowerCase()),
  )
  const totalGroups = data?.totalGroups ?? 0

  const belum = (m: MissionProgress) =>
    Math.max(0, totalGroups - m.approvedCount - m.pendingCount - m.rejectedCount)

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Cari misi…"
      />

      {missions.length === 0 ? (
        <p className="rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
          Tidak ada misi yang cocok.
        </p>
      ) : (
        <ul className="space-y-3">
          {missions.map(m => {
            const isOpen = open === m.id
            return (
              <li key={m.id} className="rounded-md border-brut bg-paper-raised">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : m.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{m.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
                      {m.category === 'TERSTRUKTUR' ? 'Terstruktur' : 'Mandiri'}
                      {m.requiresCheckIn ? ' · wajib check-in' : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 font-mono text-xs">
                    <span className="text-success">{m.approvedCount} selesai</span>
                    <span className="text-warning">{m.pendingCount} menunggu</span>
                    <span className="text-ink/45">{belum(m)} belum</span>
                    <span className="text-ink/40">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-ink/10 px-4 py-3">
                    {m.groups.length === 0 ? (
                      <p className="text-sm text-ink/50">
                        Belum ada kelompok yang mengerjakan misi ini.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {m.groups.map(g => (
                          <li
                            key={`${g.groupId}-${g.at}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border-brut-sm bg-paper px-3 py-2 text-sm"
                          >
                            <span className="font-bold text-ink">{g.groupName}</span>
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-ink/45">{waktu(g.at)}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
                                  STATUS_STYLE[g.status]
                                }`}
                              >
                                {g.status === 'APPROVED'
                                  ? g.point != null
                                    ? `selesai · ${g.point} poin`
                                    : 'selesai'
                                  : g.status === 'PENDING'
                                    ? 'menunggu'
                                    : 'ditolak'}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Pagination
        page={data?.page ?? page}
        perPage={data?.perPage ?? perPage}
        total={data?.totalMissions ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />

      <p className="text-xs text-ink/50">
        Ketuk misi untuk melihat kelompok mana saja yang sudah mengerjakannya. &quot;Belum&quot;
        dihitung dari {totalGroups} kelompok terdaftar.
      </p>
    </div>
  )
}

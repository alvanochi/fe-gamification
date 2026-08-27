'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import ErrorMessage from '@/components/elements/ErrorMessage'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import Pagination from '@/components/fragments/Pagination'
import {
  useAdminGroupsQuery,
  useCreateGroupMutation,
  useDeleteGroupsMutation,
  type SkippedRow,
} from '@/hooks/use-admin-groups'
import { useDebounce } from '@/hooks/use-debounce'
import { usePagination } from '@/hooks/use-pagination'
import { AppError } from '@/libs/api'

/**
 * Daftar kelompok, berdiri sendiri di sebelah daftar akun.
 *
 * Dulu keduanya berbagi satu daftar centang: memilih beberapa nama lalu
 * menekan "Bubarkan Kelompok" sebenarnya membubarkan kelompok orang-orang itu
 * — sasaran yang tidak sama dengan yang dicentang. Di sini yang dicentang
 * adalah kelompoknya sendiri, jadi tidak ada lagi jarak antara apa yang
 * dipilih dan apa yang terjadi.
 */
export default function GroupsPanel() {
  const { data: groups, isLoading } = useAdminGroupsQuery()
  const createGroup = useCreateGroupMutation()
  const deleteGroups = useDeleteGroupsMutation()

  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [skippedRows, setSkippedRows] = useState<SkippedRow[]>([])
  const debounced = useDebounce(search, 300)

  const error =
    (createGroup.error as AppError | null) ?? (deleteGroups.error as AppError | null)

  const filtered = useMemo(() => {
    const keyword = debounced.trim().toLowerCase()
    if (!keyword) return groups ?? []
    return (groups ?? []).filter(g => g.name.toLowerCase().includes(keyword))
  }, [groups, debounced])

  const pagination = usePagination(filtered)
  const allOnPagePicked =
    pagination.pageItems.length > 0 && pagination.pageItems.every(g => picked.includes(g.id))

  if (isLoading) return <CardSkeleton />

  const totalMembers = (groups ?? []).reduce((sum, g) => sum + g.memberCount, 0)

  return (
    <div className="space-y-6">
      <section className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Kelompok', groups?.length ?? 0],
            ['Peserta berkelompok', totalMembers],
            ['Rata-rata anggota', groups?.length ? Math.round(totalMembers / groups.length) : 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-md border-brut bg-paper px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">{label}</p>
              <p className="mt-1 font-display text-2xl text-ink">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Input
            className="min-w-56 flex-1"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              pagination.resetPage()
            }}
            placeholder="Cari kelompok…"
          />
          <Button
            size="sm"
            onClick={() => {
              setNewGroupName('')
              setIsCreating(true)
            }}
          >
            + Kelompok Baru
          </Button>
        </div>

        <p className="mt-2 text-xs text-ink/50">
          Anggota kelompok ditambahkan dari tab <strong>Akun</strong>: pilih namanya, lalu tempatkan
          ke kelompok tujuan.
        </p>

        {notice && <p className="mt-3 text-sm font-bold text-success">{notice}</p>}
        <ErrorMessage message={error?.message} className="mt-3" />

        {skippedRows.length > 0 && (
          <div className="mt-3 rounded-md border-brut !border-warning bg-warning/10 p-4">
            <p className="font-bold text-ink">{skippedRows.length} kelompok dilewati</p>
            <ul className="mt-2 space-y-1 text-sm text-ink/70">
              {skippedRows.map(row => (
                <li key={row.name}>
                  <strong>{row.name}</strong> — {row.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
        <Pagination
          page={pagination.page}
          perPage={pagination.perPage}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          onPerPageChange={pagination.setPerPage}
        />

        <label className="mt-4 flex items-center gap-3 border-y border-ink/10 py-3">
          <input
            type="checkbox"
            checked={allOnPagePicked}
            onChange={() =>
              setPicked(prev =>
                allOnPagePicked
                  ? prev.filter(id => !pagination.pageItems.some(g => g.id === id))
                  : [...new Set([...prev, ...pagination.pageItems.map(g => g.id)])],
              )
            }
            className="size-4 accent-[var(--color-primary)]"
          />
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink/50">
            Pilih semua di halaman ini
          </span>
        </label>

        {pagination.pageItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink/60">
            {groups?.length ? 'Tidak ada kelompok yang cocok.' : 'Belum ada kelompok.'}
          </p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {pagination.pageItems.map(group => (
              <li key={group.id} className="flex flex-wrap items-center gap-3 py-3">
                <input
                  type="checkbox"
                  checked={picked.includes(group.id)}
                  onChange={() =>
                    setPicked(prev =>
                      prev.includes(group.id)
                        ? prev.filter(id => id !== group.id)
                        : [...prev, group.id],
                    )
                  }
                  className="size-4 shrink-0 accent-[var(--color-primary)]"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{group.name}</p>
                  <p className="truncate font-mono text-[11px] text-ink/45">
                    {group.memberCount} anggota · {group.maleCount} L / {group.femaleCount} P
                  </p>
                </div>

                <span className="shrink-0 rounded-full border-brut-sm bg-primary px-3 py-1 font-display text-sm text-primary-ink">
                  {group.score} pt
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {picked.length > 0 && (
        <div className="sticky bottom-4 z-30 flex flex-wrap items-center gap-3 rounded-lg border-brut-lg bg-paper-raised p-4 shadow-brutal-lg">
          <span className="font-display text-lg text-ink">{picked.length} kelompok dipilih</span>
          <Button size="sm" variant="danger" onClick={() => setIsConfirmingDelete(true)}>
            Bubarkan Kelompok
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPicked([])}>
            Batal pilih
          </Button>
        </div>
      )}

      <ConfirmModal
        open={isCreating}
        title="Kelompok baru"
        description={
          <>
            <p>Kelompok kosong dibuat lebih dulu; anggotanya ditempatkan dari tab Akun.</p>
            <Input
              className="mt-3"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="Nama kelompok"
            />
          </>
        }
        confirmLabel="Buat Kelompok"
        loading={createGroup.isPending}
        onConfirm={() =>
          createGroup.mutate(
            { name: newGroupName.trim(), memberIds: [] },
            {
              onSuccess: res => {
                setNotice(res.message)
                setSkippedRows([])
                setIsCreating(false)
              },
              onError: () => setIsCreating(false),
            },
          )
        }
        onCancel={() => setIsCreating(false)}
      />

      <ConfirmModal
        open={isConfirmingDelete}
        title={`Bubarkan ${picked.length} kelompok?`}
        description="Anggotanya tidak dihapus — mereka kembali menjadi peserta tanpa kelompok. Kelompok yang sudah bertanding dilewati supaya papan skornya tetap utuh."
        confirmLabel="Ya, bubarkan"
        confirmVariant="danger"
        loading={deleteGroups.isPending}
        onConfirm={() =>
          deleteGroups.mutate(picked, {
            onSuccess: res => {
              setNotice(res.message)
              setSkippedRows(res.data.skipped)
              setPicked([])
              setIsConfirmingDelete(false)
            },
            onError: () => setIsConfirmingDelete(false),
          })
        }
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </div>
  )
}

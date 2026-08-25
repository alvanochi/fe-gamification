'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import Select from '@/components/elements/Select'
import ErrorMessage from '@/components/elements/ErrorMessage'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useAssignCategoryMutation,
  useDistributeCategoriesMutation,
} from '@/hooks/use-categories'
import { useAdminGroupsQuery } from '@/hooks/use-admin-groups'
import { AppError } from '@/libs/api'
import { GroupCategory } from '@/types/group'

const DEFAULT_COLOR = '#E8543F'

/**
 * Panel kategori kelompok — mis. rombongan Merah, Biru, Kuning.
 *
 * Kategori dipakai panitia untuk memecah peserta jadi beberapa rombongan yang
 * berangkat terpisah. Warnanya ikut disimpan supaya penandaan di layar peserta
 * dan layar pemantauan memakai warna yang sama.
 */
export default function CategoryManager() {
  const { data: categories, isLoading } = useCategoriesQuery()
  const { data: groups } = useAdminGroupsQuery()

  const createCategory = useCreateCategoryMutation()
  const updateCategory = useUpdateCategoryMutation()
  const deleteCategory = useDeleteCategoryMutation()
  const assign = useAssignCategoryMutation()
  const distribute = useDistributeCategoriesMutation()

  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [pendingDelete, setPendingDelete] = useState<GroupCategory | null>(null)
  const [confirmDistribute, setConfirmDistribute] = useState(false)
  const [target, setTarget] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  const error =
    (createCategory.error as AppError | null) ??
    (deleteCategory.error as AppError | null) ??
    (assign.error as AppError | null) ??
    (distribute.error as AppError | null)

  const list = categories ?? []
  const allGroups = groups ?? []
  const uncategorised = allGroups.filter(g => !g.categoryId).length

  const togglePicked = (id: string) =>
    setPicked(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))

  const submitNew = () => {
    setNotice(null)
    createCategory.mutate(
      { name, color },
      {
        onSuccess: () => {
          setName('')
          setColor(DEFAULT_COLOR)
        },
      },
    )
  }

  if (isLoading) return <CardSkeleton />

  return (
    <div className="space-y-6">
      {/* --- Daftar kategori --- */}
      <section className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
        <h2 className="font-display text-xl text-ink">Kategori</h2>

        {list.length === 0 ? (
          <p className="mt-3 rounded-md border-brut border-dashed bg-paper px-4 py-6 text-center text-sm text-ink/55">
            Belum ada kategori. Kelompok tetap bisa berlomba tanpa ini — kategori hanya diperlukan
            bila peserta dipecah jadi beberapa rombongan.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {list.map(category => (
              <li
                key={category.id}
                className="flex flex-wrap items-center gap-3 rounded-md border-brut bg-paper px-4 py-3"
              >
                <input
                  type="color"
                  aria-label={`Warna ${category.name}`}
                  value={category.color}
                  onChange={e => updateCategory.mutate({ id: category.id, color: e.target.value })}
                  className="h-8 w-10 shrink-0 cursor-pointer rounded-sm border-brut-sm bg-paper"
                />
                <span className="min-w-0 flex-1 truncate font-bold text-ink">{category.name}</span>
                <span className="font-mono text-xs text-ink/50">
                  {category.groupCount ?? 0} kelompok
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingDelete(category)}
                >
                  Hapus
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div>
            <Label htmlFor="kategori-baru">Kategori baru</Label>
            <Input
              id="kategori-baru"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="mis. Rombongan Merah"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="warna-baru">Warna</Label>
            <input
              id="warna-baru"
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="mt-2 h-12 w-16 cursor-pointer rounded-md border-brut bg-paper"
            />
          </div>
          <Button
            size="sm"
            disabled={name.trim().length < 2}
            loading={createCategory.isPending}
            onClick={submitNew}
          >
            Tambah
          </Button>
        </div>
      </section>

      {/* --- Penempatan kelompok --- */}
      <section className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
        <h2 className="font-display text-xl text-ink">Tempatkan Kelompok</h2>
        <p className="mt-1 text-sm text-ink/60">
          {uncategorised} dari {allGroups.length} kelompok belum berkategori.
        </p>

        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          disabled={list.length === 0 || uncategorised === 0}
          loading={distribute.isPending}
          onClick={() => setConfirmDistribute(true)}
        >
          Bagi Acak &amp; Merata ({uncategorised})
        </Button>

        {allGroups.length > 0 && (
          <>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-ink/45">
              Atau pilih sendiri
            </p>

            <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
              {allGroups.map(group => {
                const category = list.find(c => c.id === group.categoryId)
                return (
                  <li key={group.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border-brut bg-paper px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={picked.includes(group.id)}
                        onChange={() => togglePicked(group.id)}
                        className="size-4 shrink-0 accent-[var(--color-primary)]"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                        {group.name}
                      </span>
                      {category ? (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.name}
                        </span>
                      ) : (
                        <span className="shrink-0 font-mono text-[10px] uppercase text-ink/40">
                          belum
                        </span>
                      )}
                    </label>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <Label htmlFor="tujuan">Pindahkan {picked.length} kelompok ke</Label>
                <Select
                  id="tujuan"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  className="mt-2"
                >
                  <option value="">— Tanpa kategori —</option>
                  {list.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                size="sm"
                disabled={picked.length === 0}
                loading={assign.isPending}
                onClick={() => {
                  setNotice(null)
                  assign.mutate(
                    { categoryId: target || null, groupIds: picked },
                    {
                      onSuccess: res => {
                        setNotice(`${res.data.assigned} kelompok dipindahkan.`)
                        setPicked([])
                      },
                    },
                  )
                }}
              >
                Pindahkan
              </Button>
            </div>
          </>
        )}

        {notice && <p className="mt-3 text-sm font-bold text-success">{notice}</p>}
        <ErrorMessage message={error?.message} className="mt-3" />
      </section>

      <ConfirmModal
        open={!!pendingDelete}
        title={`Hapus kategori ${pendingDelete?.name}?`}
        description="Kategori yang masih dipakai kelompok tidak bisa dihapus — pindahkan kelompoknya lebih dulu."
        confirmLabel="Ya, hapus"
        confirmVariant="danger"
        loading={deleteCategory.isPending}
        onConfirm={() =>
          pendingDelete &&
          deleteCategory.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmModal
        open={confirmDistribute}
        title="Bagi kelompok secara acak?"
        description={`${uncategorised} kelompok yang belum berkategori akan dibagi merata ke ${list.length} kategori. Kelompok yang sudah punya kategori tidak diubah.`}
        confirmLabel="Ya, bagi sekarang"
        loading={distribute.isPending}
        onConfirm={() =>
          distribute.mutate(undefined, {
            onSuccess: res => {
              setNotice(
                `${res.data.distributed} kelompok dibagi: ${res.data.perCategory
                  .map(c => `${c.name} +${c.added}`)
                  .join(', ')}.`,
              )
              setConfirmDistribute(false)
            },
            onError: () => setConfirmDistribute(false),
          })
        }
        onCancel={() => setConfirmDistribute(false)}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import Select from '@/components/elements/Select'
import ErrorMessage from '@/components/elements/ErrorMessage'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import Pagination from '@/components/fragments/Pagination'
import SheetPanel from '@/components/organisms/admin/SheetPanel'
import QrPrintSheet from '@/components/organisms/admin/QrPrintSheet'
import {
  useAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useSetAccountRolesBulkMutation,
  useQrTokensMutation,
  type Account,
  type AccountRole,
  type PrintableCard,
} from '@/hooks/use-accounts'
import { useDebounce } from '@/hooks/use-debounce'
import { useProfileQuery } from '@/hooks/use-profile'
import { AppError } from '@/libs/api'

const ROLE_LABEL: Record<AccountRole, string> = {
  PARTICIPANT: 'Peserta',
  ADMIN: 'Panitia Lapangan',
  SUPER_ADMIN: 'Super Admin',
}

const ROLE_BADGE: Record<AccountRole, string> = {
  PARTICIPANT: 'bg-paper text-ink/60',
  ADMIN: 'bg-secondary text-secondary-ink',
  SUPER_ADMIN: 'bg-primary text-primary-ink',
}

const EMPTY_FORM = { fullname: '', phoneNumber: '', email: '', businessName: '' }

/**
 * Manajemen akun — satu tempat untuk menemukan siapa pun di acara ini.
 *
 * Daftar akun dan lembar kartu QR dulu dua halaman berisi orang yang sama, dan
 * peserta baru muncul bila dicari. Sekarang seluruh akun tampil berhalaman, dan
 * hak akses ditegakkan pada tindakannya: membaca cukup panitia, mengubah peran
 * dan menghapus tetap Super Admin.
 */
export default function AccountManager() {
  const { data: profile } = useProfileQuery()
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN'

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<AccountRole | ''>('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const debounced = useDebounce(search, 300)

  const { data, isLoading } = useAccountsQuery(debounced.trim(), roleFilter, page, perPage)

  const createAccount = useCreateAccountMutation()
  const updateAccount = useUpdateAccountMutation()
  const deleteAccount = useDeleteAccountMutation()
  const setRoles = useSetAccountRolesBulkMutation()
  const qrTokens = useQrTokensMutation()

  const [picked, setPicked] = useState<string[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null)
  const [pendingRole, setPendingRole] = useState<AccountRole | null>(null)
  const [cards, setCards] = useState<{ cards: PrintableCard[]; skipped: string[] } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const error =
    (createAccount.error as AppError | null) ??
    (updateAccount.error as AppError | null) ??
    (deleteAccount.error as AppError | null) ??
    (setRoles.error as AppError | null) ??
    (qrTokens.error as AppError | null)

  const items = data?.items ?? []
  const counts = data?.counts

  const changeFilter = (apply: () => void) => {
    apply()
    setPage(1)
    setPicked([])
  }

  const toggle = (id: string) =>
    setPicked(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))

  const allOnPagePicked = items.length > 0 && items.every(a => picked.includes(a.id))

  const openEdit = (account: Account) => {
    setEditing(account)
    setForm({
      fullname: account.fullname,
      phoneNumber: account.phoneNumber ?? '',
      email: account.email ?? '',
      businessName: account.businessName ?? '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const saveForm = () => {
    setNotice(null)
    const payload = {
      fullname: form.fullname.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim() || null,
      businessName: form.businessName.trim() || null,
    }

    if (editing) {
      updateAccount.mutate(
        { userId: editing.id, ...payload },
        {
          onSuccess: () => {
            setNotice(`${payload.fullname} diperbarui.`)
            closeForm()
          },
        },
      )
    } else {
      createAccount.mutate(payload, {
        onSuccess: res => {
          setNotice(res.message)
          closeForm()
        },
      })
    }
  }

  const printSelected = () => {
    setNotice(null)
    qrTokens.mutate(picked, { onSuccess: res => setCards(res.data) })
  }

  if (isLoading) return <CardSkeleton />

  return (
    <div className="space-y-6">
      <SheetPanel canImportGroups={!!isSuperAdmin} />

      {/* --- Saringan & aksi massal --- */}
      <section className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="min-w-56 flex-1"
            value={search}
            onChange={e => changeFilter(() => setSearch(e.target.value))}
            placeholder="Cari nama, email, atau nomor…"
          />
          <Select
            className="w-auto"
            value={roleFilter}
            onChange={e => changeFilter(() => setRoleFilter(e.target.value as AccountRole | ''))}
          >
            <option value="">Semua peran ({counts?.all ?? 0})</option>
            <option value="PARTICIPANT">Peserta ({counts?.PARTICIPANT ?? 0})</option>
            <option value="ADMIN">Panitia ({counts?.ADMIN ?? 0})</option>
            <option value="SUPER_ADMIN">Super Admin ({counts?.SUPER_ADMIN ?? 0})</option>
          </Select>
          <Button
            size="sm"
            onClick={() => {
              closeForm()
              setShowForm(true)
            }}
          >
            + Akun Baru
          </Button>
        </div>

        {picked.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border-brut bg-paper px-4 py-3">
            <span className="font-bold text-ink">{picked.length} dipilih</span>

            <Button size="sm" variant="secondary" loading={qrTokens.isPending} onClick={printSelected}>
              Cetak Kartu QR
            </Button>

            {isSuperAdmin && (
              <>
                <Select
                  className="w-auto"
                  value=""
                  onChange={e => setPendingRole(e.target.value as AccountRole)}
                >
                  <option value="">Ubah peran ke…</option>
                  <option value="PARTICIPANT">Peserta</option>
                  <option value="ADMIN">Panitia Lapangan</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </Select>
              </>
            )}

            <Button size="sm" variant="ghost" onClick={() => setPicked([])}>
              Batal pilih
            </Button>
          </div>
        )}

        {notice && <p className="mt-3 text-sm font-bold text-success">{notice}</p>}
        <ErrorMessage message={error?.message} className="mt-3" />
      </section>

      {/* --- Form tambah/sunting --- */}
      {showForm && (
        <section className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
          <h2 className="font-display text-xl text-ink">
            {editing ? `Sunting ${editing.fullname}` : 'Akun Baru'}
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label required>Nama lengkap</Label>
              <Input
                className="mt-2"
                value={form.fullname}
                onChange={e => setForm({ ...form, fullname: e.target.value })}
              />
            </div>
            <div>
              <Label required>Nomor telepon</Label>
              <Input
                className="mt-2"
                type="tel"
                value={form.phoneNumber}
                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="08…"
              />
              <p className="mt-1 text-xs text-ink/50">
                Nomor ini sekaligus kata sandinya — inilah yang diketik peserta saat masuk.
              </p>
            </div>
            <div>
              <Label>Email (opsional)</Label>
              <Input
                className="mt-2"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Nama usaha (opsional)</Label>
              <Input
                className="mt-2"
                value={form.businessName}
                onChange={e => setForm({ ...form, businessName: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <Button variant="ghost" size="sm" onClick={closeForm}>
              Batal
            </Button>
            <Button
              size="sm"
              loading={createAccount.isPending || updateAccount.isPending}
              disabled={form.fullname.trim().length < 2 || form.phoneNumber.trim().length < 6}
              onClick={saveForm}
            >
              {editing ? 'Simpan Perubahan' : 'Tambahkan'}
            </Button>
          </div>
        </section>
      )}

      {/* --- Daftar akun --- */}
      <section className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
        <label className="flex items-center gap-3 border-b border-ink/10 pb-3">
          <input
            type="checkbox"
            checked={allOnPagePicked}
            onChange={() =>
              setPicked(prev =>
                allOnPagePicked
                  ? prev.filter(id => !items.some(a => a.id === id))
                  : [...new Set([...prev, ...items.map(a => a.id)])],
              )
            }
            className="size-4 accent-[var(--color-primary)]"
          />
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink/50">
            Pilih semua di halaman ini
          </span>
        </label>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink/60">Tidak ada akun yang cocok.</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {items.map(account => (
              <li key={account.id} className="flex flex-wrap items-center gap-3 py-3">
                <input
                  type="checkbox"
                  checked={picked.includes(account.id)}
                  onChange={() => toggle(account.id)}
                  className="size-4 shrink-0 accent-[var(--color-primary)]"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{account.fullname}</p>
                  <p className="truncate font-mono text-[11px] text-ink/45">
                    {account.phoneNumber ?? '—'}
                    {account.email ? ` · ${account.email}` : ''}
                    {account.role === 'PARTICIPANT' && !account.hasQrToken ? ' · QR belum ada' : ''}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border-brut-sm px-3 py-1 font-mono text-[10px] font-bold uppercase ${ROLE_BADGE[account.role]}`}
                >
                  {ROLE_LABEL[account.role]}
                </span>

                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(account)}>
                    Sunting
                  </Button>
                  {isSuperAdmin && (
                    <Button size="sm" variant="ghost" onClick={() => setPendingDelete(account)}>
                      Hapus
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Pagination
            page={data?.page ?? page}
            perPage={data?.perPage ?? perPage}
            total={data?.total ?? 0}
            totalPages={data?.totalPages ?? 1}
            onPageChange={setPage}
            onPerPageChange={value => changeFilter(() => setPerPage(value))}
          />
        </div>
      </section>

      <ConfirmModal
        open={!!pendingDelete}
        title={`Hapus ${pendingDelete?.fullname}?`}
        description="Akun yang sudah mengirim bukti misi atau tercatat di pos tidak bisa dihapus — riwayat penilaiannya ikut hilang. Sunting datanya bila hanya keliru."
        confirmLabel="Ya, hapus"
        confirmVariant="danger"
        loading={deleteAccount.isPending}
        onConfirm={() =>
          pendingDelete &&
          deleteAccount.mutate(pendingDelete.id, {
            onSuccess: res => {
              setNotice(res.message)
              setPicked(prev => prev.filter(id => id !== pendingDelete.id))
              setPendingDelete(null)
            },
            onError: () => setPendingDelete(null),
          })
        }
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmModal
        open={!!pendingRole}
        title="Ubah peran akun terpilih?"
        description={
          <>
            <p>
              {picked.length} akun akan menjadi{' '}
              <strong>{pendingRole ? ROLE_LABEL[pendingRole] : ''}</strong>.
            </p>
            {pendingRole === 'SUPER_ADMIN' && (
              <p className="mt-2 text-danger">
                Super Admin punya akses penuh — termasuk membuat, mengubah, dan menghapus misi.
              </p>
            )}
          </>
        }
        confirmLabel="Ya, ubah"
        confirmVariant={pendingRole === 'SUPER_ADMIN' ? 'danger' : 'primary'}
        loading={setRoles.isPending}
        onConfirm={() =>
          pendingRole &&
          setRoles.mutate(
            { userIds: picked, role: pendingRole },
            {
              onSuccess: res => {
                setNotice(
                  res.data.skippedSelf
                    ? `${res.data.updated} akun diperbarui. Akun Anda sendiri dilewati.`
                    : `${res.data.updated} akun diperbarui.`,
                )
                setPicked([])
                setPendingRole(null)
              },
              onError: () => setPendingRole(null),
            },
          )
        }
        onCancel={() => setPendingRole(null)}
      />

      {cards && (
        <QrPrintSheet cards={cards.cards} skipped={cards.skipped} onClose={() => setCards(null)} />
      )}
    </div>
  )
}

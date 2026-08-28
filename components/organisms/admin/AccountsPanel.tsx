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
import SearchSelect from '@/components/fragments/SearchSelect'
import SheetPanel from '@/components/organisms/admin/SheetPanel'
import QrPrintSheet from '@/components/organisms/admin/QrPrintSheet'
import {
  useAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useDeleteAccountsBulkMutation,
  useSetAccountRolesBulkMutation,
  useQrTokensMutation,
  type Account,
  type AccountGender,
  type AccountRole,
  type PrintableCard,
} from '@/hooks/use-accounts'
import {
  useAdminGroupsQuery,
  useCreateGroupMutation,
  useSetGroupMembersMutation,
  type SkippedRow,
} from '@/hooks/use-admin-groups'
import { useDebounce } from '@/hooks/use-debounce'
import { useMissionsQuery } from '@/hooks/use-missions'
import { DEFAULT_PER_PAGE } from '@/hooks/use-pagination'
import { AppError } from '@/libs/api'

const ROLE_LABEL: Record<AccountRole, string> = {
  PARTICIPANT: 'Peserta',
  ADMIN: 'Panitia Lapangan',
  POST_GUARD: 'Penjaga Pos',
  SUPER_ADMIN: 'Super Admin',
}

const ROLE_BADGE: Record<AccountRole, string> = {
  PARTICIPANT: 'bg-paper text-ink/60',
  ADMIN: 'bg-secondary text-secondary-ink',
  POST_GUARD: 'bg-warning text-ink',
  SUPER_ADMIN: 'bg-primary text-primary-ink',
}

const GENDER_LABEL: Record<AccountGender, string> = { L: 'Laki-laki', P: 'Perempuan' }
const GENDER_BADGE: Record<AccountGender, string> = {
  L: 'bg-secondary/25 text-ink',
  P: 'bg-primary/25 text-ink',
}

const EMPTY_FORM = {
  fullname: '',
  phoneNumber: '',
  email: '',
  businessName: '',
  gender: '',
  assignedMissionId: '',
}

/** Tindakan massal yang perlu dikonfirmasi lebih dulu. */
type PendingBulk = 'DELETE_ACCOUNTS' | 'NEW_GROUP' | null

/**
 * Daftar akun: siapa saja yang ada di acara ini, dan bagaimana datanya diubah.
 *
 * Penyusunan kelompok punya panelnya sendiri di sebelah. Yang tinggal di sini
 * hanyalah tindakan yang sasarannya orang — mencetak kartunya, mengubah
 * perannya, menghapusnya, dan menempatkannya ke sebuah kelompok.
 */
export default function AccountsPanel() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<AccountRole | ''>('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const debounced = useDebounce(search, 300)

  const { data, isLoading } = useAccountsQuery(debounced.trim(), roleFilter, page, perPage)
  const { data: groups } = useAdminGroupsQuery()
  // Hanya pos berpetugas yang bisa ditugaskan ke penjaga pos.
  const { data: missions } = useMissionsQuery()
  const posts = (missions ?? []).filter(m => m.requiresCheckIn)

  const createAccount = useCreateAccountMutation()
  const updateAccount = useUpdateAccountMutation()
  const deleteAccount = useDeleteAccountMutation()
  const deleteAccounts = useDeleteAccountsBulkMutation()
  const setRoles = useSetAccountRolesBulkMutation()
  const qrTokens = useQrTokensMutation()
  const createGroup = useCreateGroupMutation()
  const setGroupMembers = useSetGroupMembersMutation()

  const [picked, setPicked] = useState<string[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null)
  const [pendingRole, setPendingRole] = useState<AccountRole | null>(null)
  const [pendingBulk, setPendingBulk] = useState<PendingBulk>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [cards, setCards] = useState<{ cards: PrintableCard[]; skipped: string[] } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [skippedRows, setSkippedRows] = useState<SkippedRow[]>([])

  const error =
    (createAccount.error as AppError | null) ??
    (updateAccount.error as AppError | null) ??
    (deleteAccount.error as AppError | null) ??
    (deleteAccounts.error as AppError | null) ??
    (setRoles.error as AppError | null) ??
    (qrTokens.error as AppError | null) ??
    (createGroup.error as AppError | null) ??
    (setGroupMembers.error as AppError | null)

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
      gender: account.gender ?? '',
      assignedMissionId: account.assignedMissionId ?? '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  /** Hasil tindakan massal selalu dibaca sama: berapa berhasil, apa yang dilewati. */
  const reportBulk = (message: string, skipped: SkippedRow[] = []) => {
    setNotice(message)
    setSkippedRows(skipped)
    setPicked([])
    setPendingBulk(null)
  }

  const saveForm = () => {
    setNotice(null)
    const payload = {
      fullname: form.fullname.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim() || null,
      businessName: form.businessName.trim() || null,
      gender: (form.gender || null) as AccountGender | null,
      assignedMissionId: form.assignedMissionId || null,
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

  if (isLoading) return <CardSkeleton />

  return (
    <div className="space-y-6">
      <SheetPanel />

      {/* --- Saringan & pencarian --- */}
      <section className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="min-w-56 flex-1"
            value={search}
            onChange={e => changeFilter(() => setSearch(e.target.value))}
            placeholder="Cari nama, email, nomor, atau kelompok…"
          />
          <Select
            className="w-auto"
            value={roleFilter}
            onChange={e => changeFilter(() => setRoleFilter(e.target.value as AccountRole | ''))}
          >
            <option value="">Semua peran ({counts?.all ?? 0})</option>
            <option value="PARTICIPANT">Peserta ({counts?.PARTICIPANT ?? 0})</option>
            <option value="ADMIN">Panitia ({counts?.ADMIN ?? 0})</option>
            <option value="POST_GUARD">Penjaga Pos ({counts?.POST_GUARD ?? 0})</option>
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

        {notice && <p className="mt-3 text-sm font-bold text-success">{notice}</p>}
        <ErrorMessage message={error?.message} className="mt-3" />

        {skippedRows.length > 0 && (
          <div className="mt-3 rounded-md border-brut !border-warning bg-warning/10 p-4">
            <p className="font-bold text-ink">{skippedRows.length} dilewati</p>
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
              <Label>Jenis kelamin</Label>
              <Select
                className="mt-2"
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">— Belum diisi —</option>
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </Select>
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
            {editing?.role === 'POST_GUARD' && (
              <div className="sm:col-span-2">
                <Label required>Pos yang dijaga</Label>
                <Select
                  className="mt-2"
                  value={form.assignedMissionId}
                  onChange={e => setForm({ ...form, assignedMissionId: e.target.value })}
                >
                  <option value="">— Belum ditugaskan —</option>
                  {posts.map(post => (
                    <option key={post.id} value={post.id}>
                      {post.title}
                      {post.locationName ? ` · ${post.locationName}` : ''}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-xs text-ink/50">
                  Hanya misi bercentang &quot;Wajib check-in&quot; yang bisa dijaga. Penjaga pos hanya
                  bisa memindai QR pos ini, dan tidak melihat bagian panel yang lain.
                </p>
              </div>
            )}

            <div className="sm:col-span-2">
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
        {/* Di atas daftar: dengan seratus baris lebih, kendali halaman di kaki
            daftar berarti menggulir jauh hanya untuk pindah halaman. */}
        <Pagination
          page={data?.page ?? page}
          perPage={data?.perPage ?? perPage}
          total={data?.total ?? 0}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
          onPerPageChange={value => changeFilter(() => setPerPage(value))}
        />

        <label className="mt-4 flex items-center gap-3 border-y border-ink/10 py-3">
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

                {account.gender && (
                  <span
                    className={`shrink-0 rounded-sm border-brut-sm px-2 py-1 font-mono text-[10px] font-bold uppercase ${GENDER_BADGE[account.gender]}`}
                    title={GENDER_LABEL[account.gender]}
                  >
                    {account.gender}
                  </span>
                )}

                {account.role === 'PARTICIPANT' && (
                  <span
                    className={`shrink-0 rounded-sm border-brut-sm px-2 py-1 font-mono text-[10px] font-bold uppercase ${
                      account.groupName ? 'bg-paper text-ink/70' : 'bg-paper text-ink/35'
                    }`}
                  >
                    {account.groupName ?? 'tanpa kelompok'}
                  </span>
                )}

                {account.role === 'POST_GUARD' && (
                  <span
                    className={`shrink-0 rounded-sm border-brut-sm px-2 py-1 font-mono text-[10px] font-bold uppercase ${
                      account.assignedMissionTitle ? 'bg-paper text-ink/70' : 'bg-danger/20 text-danger'
                    }`}
                  >
                    {account.assignedMissionTitle ?? 'pos belum diatur'}
                  </span>
                )}

                <span
                  className={`shrink-0 rounded-full border-brut-sm px-3 py-1 font-mono text-[10px] font-bold uppercase ${ROLE_BADGE[account.role]}`}
                >
                  {ROLE_LABEL[account.role]}
                </span>

                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(account)}>
                    Sunting
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(account)}>
                    Hapus
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Baris tindakan massal, menempel di kaki layar --- */}
      {picked.length > 0 && (
        // Menempel di bawah: dengan daftar sepanjang ini, tindakan yang berada
        // di kepala halaman berarti menggulir kembali ke atas setiap kali
        // selesai memilih beberapa nama.
        <div className="sticky bottom-4 z-30 rounded-lg border-brut-lg bg-paper-raised p-4 shadow-brutal-lg">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-lg text-ink">{picked.length} dipilih</span>
            <Button size="sm" variant="ghost" onClick={() => setPicked([])}>
              Batal pilih
            </Button>
          </div>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border-brut-sm bg-paper p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
                Kelola akun
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  loading={qrTokens.isPending}
                  onClick={() => {
                    setNotice(null)
                    qrTokens.mutate(picked, { onSuccess: res => setCards(res.data) })
                  }}
                >
                  Cetak Kartu QR
                </Button>
                <Select
                  className="w-auto"
                  value=""
                  onChange={e => setPendingRole(e.target.value as AccountRole)}
                >
                  <option value="">Ubah peran ke…</option>
                  <option value="PARTICIPANT">Peserta</option>
                  <option value="ADMIN">Panitia Lapangan</option>
                  <option value="POST_GUARD">Penjaga Pos</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </Select>
                <Button size="sm" variant="danger" onClick={() => setPendingBulk('DELETE_ACCOUNTS')}>
                  Hapus Akun
                </Button>
              </div>
            </div>

            <div className="rounded-md border-brut-sm bg-paper p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
                Tempatkan ke kelompok
              </p>
              <div className="mt-2 space-y-2">
                <SearchSelect
                  options={(groups ?? []).map(group => ({
                    value: group.id,
                    label: group.name,
                    hint: `${group.memberCount} anggota · ${group.maleCount} L / ${group.femaleCount} P`,
                  }))}
                  value={undefined}
                  onChange={groupId => {
                    if (!groupId) return
                    setNotice(null)
                    setGroupMembers.mutate(
                      { groupId, userIds: picked },
                      { onSuccess: res => reportBulk(res.message) },
                    )
                  }}
                  placeholder="Cari kelompok tujuan…"
                  emptyLabel="— Batal —"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setNewGroupName('')
                    setPendingBulk('NEW_GROUP')
                  }}
                >
                  + Kelompok Baru dari Pilihan Ini
                </Button>
                <p className="text-xs text-ink/50">
                  Membubarkan kelompok dilakukan dari tab <strong>Kelompok</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
        open={pendingBulk === 'DELETE_ACCOUNTS'}
        title={`Hapus ${picked.length} akun?`}
        description="Akun yang sudah mengirim bukti misi, memberi poin, atau tercatat di pos akan dilewati beserta alasannya."
        confirmLabel="Ya, hapus"
        confirmVariant="danger"
        loading={deleteAccounts.isPending}
        onConfirm={() =>
          deleteAccounts.mutate(picked, {
            onSuccess: res => reportBulk(res.message, res.data.skipped),
            onError: () => setPendingBulk(null),
          })
        }
        onCancel={() => setPendingBulk(null)}
      />

      <ConfirmModal
        open={pendingBulk === 'NEW_GROUP'}
        title="Kelompok baru"
        description={
          <>
            <p>{picked.length} akun terpilih akan langsung menjadi anggotanya.</p>
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
            { name: newGroupName.trim(), memberIds: picked },
            {
              onSuccess: res => reportBulk(res.message),
              onError: () => setPendingBulk(null),
            },
          )
        }
        onCancel={() => setPendingBulk(null)}
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

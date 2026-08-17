'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Select from '@/components/elements/Select'
import ErrorMessage from '@/components/elements/ErrorMessage'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import Pagination from '@/components/fragments/Pagination'
import QrPrintSheet from '@/components/organisms/admin/QrPrintSheet'
import {
  useAccountsQuery,
  useQrTokensMutation,
  useSetAccountRolesBulkMutation,
  type AccountRole,
  type PrintableCard,
} from '@/hooks/use-accounts'
import { useProfileQuery } from '@/hooks/use-profile'
import { useDebounce } from '@/hooks/use-debounce'
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

/**
 * Daftar induk seluruh akun.
 *
 * Menggantikan dua halaman yang dulu berisi orang yang sama — daftar peran dan
 * lembar kartu QR. Hak akses ditegakkan pada tindakannya, bukan pada
 * halamannya: panitia lapangan boleh mencari orang dan mencetak ulang
 * kartunya, sedangkan pengubahan peran tetap milik Super Admin.
 */
export default function AccountManager() {
  const { data: profile } = useProfileQuery()
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN'

  const [search, setSearch] = useState('')
  const [role, setRole] = useState<AccountRole | ''>('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useAccountsQuery(debouncedSearch, role, page, perPage)
  const bulkRole = useSetAccountRolesBulkMutation()
  const qrTokens = useQrTokensMutation()

  const [picked, setPicked] = useState<string[]>([])
  const [pendingRole, setPendingRole] = useState<AccountRole | null>(null)
  const [sheet, setSheet] = useState<{ cards: PrintableCard[]; skipped: string[] } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const apiError =
    (bulkRole.error as AppError | null) ?? (qrTokens.error as AppError | null) ?? null

  const items = data?.items ?? []
  const allOnPagePicked = items.length > 0 && items.every(a => picked.includes(a.id))

  const toggle = (id: string) =>
    setPicked(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))

  const toggleAllOnPage = () =>
    setPicked(prev =>
      allOnPagePicked
        ? prev.filter(id => !items.some(a => a.id === id))
        : [...new Set([...prev, ...items.map(a => a.id)])],
    )

  const print = () => {
    setNotice(null)
    qrTokens.mutate(picked, {
      onSuccess: res => setSheet(res.data),
    })
  }

  // Filter mengubah isi halaman, jadi kembalikan ke halaman pertama.
  const changeFilter = (fn: () => void) => {
    fn()
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* --- Penyaring --- */}
      <div className="rounded-lg border-brut bg-paper-raised p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            value={search}
            onChange={e => changeFilter(() => setSearch(e.target.value))}
            placeholder="Cari nama, email, atau nomor telepon…"
          />
          <Select
            value={role}
            onChange={e => changeFilter(() => setRole(e.target.value as AccountRole | ''))}
            aria-label="Saring berdasarkan peran"
          >
            <option value="">Semua peran ({data?.counts.all ?? 0})</option>
            <option value="PARTICIPANT">Peserta ({data?.counts.PARTICIPANT ?? 0})</option>
            <option value="ADMIN">Panitia Lapangan ({data?.counts.ADMIN ?? 0})</option>
            <option value="SUPER_ADMIN">Super Admin ({data?.counts.SUPER_ADMIN ?? 0})</option>
          </Select>
        </div>

        {isSuperAdmin && (
          <p className="mt-3 text-xs text-ink/55">
            Panitia harus mendaftar lewat aplikasi terlebih dulu, baru perannya bisa diubah di sini.
          </p>
        )}
      </div>

      {/* --- Tindakan atas yang dipilih --- */}
      {picked.length > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-3 rounded-lg border-brut bg-primary/15 p-4 shadow-brutal-sm backdrop-blur">
          <span className="font-bold text-ink">{picked.length} akun dipilih</span>

          <Button size="sm" loading={qrTokens.isPending} onClick={print}>
            Cetak Kartu QR
          </Button>

          {isSuperAdmin &&
            (['ADMIN', 'PARTICIPANT', 'SUPER_ADMIN'] as const).map(target => (
              <Button
                key={target}
                size="sm"
                variant={target === 'SUPER_ADMIN' ? 'danger' : 'secondary'}
                onClick={() => setPendingRole(target)}
              >
                Jadikan {ROLE_LABEL[target]}
              </Button>
            ))}

          <Button size="sm" variant="ghost" onClick={() => setPicked([])}>
            Batal pilih
          </Button>
        </div>
      )}

      {notice && <p className="text-sm font-bold text-success">{notice}</p>}
      <ErrorMessage message={apiError?.message} />

      {/* --- Daftar --- */}
      {isLoading ? (
        <CardSkeleton />
      ) : items.length === 0 ? (
        <p className="rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
          Tidak ada akun yang cocok.
        </p>
      ) : (
        <>
          <label className="flex cursor-pointer items-center gap-3 px-1 text-sm font-bold text-ink/70">
            <input
              type="checkbox"
              checked={allOnPagePicked}
              onChange={toggleAllOnPage}
              className="size-4 accent-[var(--color-primary)]"
            />
            Pilih semua di halaman ini
          </label>

          <ul className="space-y-2">
            {items.map(account => (
              <li key={account.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-md border-brut px-4 py-3 ${
                    picked.includes(account.id) ? 'bg-primary/10' : 'bg-paper-raised'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={picked.includes(account.id)}
                    onChange={() => toggle(account.id)}
                    className="size-4 shrink-0 accent-[var(--color-primary)]"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-ink">{account.fullname}</span>
                    <span className="block truncate font-mono text-xs text-ink/50">
                      {account.email ?? '—'} · {account.phoneNumber ?? '—'}
                    </span>
                  </span>

                  {account.role === 'PARTICIPANT' && (
                    <span
                      className={`shrink-0 font-mono text-[10px] uppercase ${
                        account.checkInAt ? 'text-success' : 'text-ink/35'
                      }`}
                    >
                      {account.checkInAt ? 'hadir' : 'belum hadir'}
                    </span>
                  )}

                  <span
                    className={`shrink-0 rounded-full border-brut-sm px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${
                      ROLE_BADGE[account.role]
                    }`}
                  >
                    {ROLE_LABEL[account.role]}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <Pagination
            page={data?.page ?? page}
            perPage={data?.perPage ?? perPage}
            total={data?.total ?? 0}
            totalPages={data?.totalPages ?? 1}
            onPageChange={setPage}
            onPerPageChange={value => changeFilter(() => setPerPage(value))}
          />
        </>
      )}

      <ConfirmModal
        open={!!pendingRole}
        title="Ubah peran akun terpilih?"
        description={
          pendingRole && (
            <>
              <p>
                <strong>{picked.length} akun</strong> akan menjadi{' '}
                <strong>{ROLE_LABEL[pendingRole]}</strong>.
              </p>
              {pendingRole === 'SUPER_ADMIN' && (
                <p className="mt-2 text-danger">
                  Super Admin punya akses penuh — termasuk membuat, mengubah, dan menghapus misi.
                </p>
              )}
              {pendingRole === 'PARTICIPANT' && (
                <p className="mt-2">Akses panel mereka akan dicabut.</p>
              )}
            </>
          )
        }
        confirmLabel="Ya, Ubah"
        confirmVariant={pendingRole === 'SUPER_ADMIN' ? 'danger' : 'primary'}
        loading={bulkRole.isPending}
        onConfirm={() =>
          pendingRole &&
          bulkRole.mutate(
            { userIds: picked, role: pendingRole },
            {
              onSuccess: res => {
                setNotice(
                  `${res.data.updated} akun diperbarui.` +
                    (res.data.skippedSelf ? ' Akunmu sendiri dilewati.' : ''),
                )
                setPicked([])
              },
              onSettled: () => setPendingRole(null),
            },
          )
        }
        onCancel={() => setPendingRole(null)}
      />

      {sheet && (
        <QrPrintSheet
          cards={sheet.cards}
          skipped={sheet.skipped}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}

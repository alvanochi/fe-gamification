'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import ErrorMessage from '@/components/elements/ErrorMessage'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import { useAccountsQuery, useSetAccountRoleMutation, type Account } from '@/hooks/use-accounts'
import { useDebounce } from '@/hooks/use-debounce'
import { AppError } from '@/libs/api'

const ROLE_LABEL: Record<Account['role'], string> = {
  PARTICIPANT: 'Peserta',
  ADMIN: 'Panitia Lapangan',
  SUPER_ADMIN: 'Super Admin',
}

const ROLE_BADGE: Record<Account['role'], string> = {
  PARTICIPANT: 'bg-paper text-ink/60',
  ADMIN: 'bg-secondary text-secondary-ink',
  SUPER_ADMIN: 'bg-primary text-primary-ink',
}

export default function AccountManager() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { data: accounts, isLoading } = useAccountsQuery(debouncedSearch)
  const { mutate: setRole, isPending, error } = useSetAccountRoleMutation()
  const apiError = error as AppError | null

  const [pending, setPending] = useState<{ account: Account; role: Account['role'] } | null>(null)

  return (
    <div className="space-y-5">
      <div className="rounded-lg border-brut bg-paper-raised p-5">
        <p className="text-sm text-ink/70">
          Panitia harus <strong>mendaftar lewat aplikasi terlebih dulu</strong>, baru perannya bisa
          diubah di sini. Cari nama, email, atau nomor teleponnya untuk menemukannya.
        </p>
        <Input
          className="mt-3"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari peserta yang akan diangkat…"
        />
      </div>

      <ErrorMessage message={apiError?.message} />

      {isLoading ? (
        <CardSkeleton />
      ) : !accounts || accounts.length === 0 ? (
        <p className="rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
          Tidak ada akun yang cocok.
        </p>
      ) : (
        <ul className="space-y-3">
          {accounts.map(account => (
            <li key={account.id} className="rounded-md border-brut bg-paper-raised p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{account.fullname}</p>
                  <p className="truncate font-mono text-xs text-ink/50">
                    {account.email ?? '—'} · {account.phoneNumber ?? '—'}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border-brut-sm px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${
                    ROLE_BADGE[account.role]
                  }`}
                >
                  {ROLE_LABEL[account.role]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(['PARTICIPANT', 'ADMIN', 'SUPER_ADMIN'] as const)
                  .filter(role => role !== account.role)
                  .map(role => (
                    <Button
                      key={role}
                      size="sm"
                      variant={role === 'PARTICIPANT' ? 'ghost' : 'secondary'}
                      disabled={isPending}
                      onClick={() => setPending({ account, role })}
                    >
                      Jadikan {ROLE_LABEL[role]}
                    </Button>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!pending}
        title="Ubah peran akun?"
        description={
          pending && (
            <>
              <p>
                <strong>{pending.account.fullname}</strong> akan menjadi{' '}
                <strong>{ROLE_LABEL[pending.role]}</strong>.
              </p>
              {pending.role === 'SUPER_ADMIN' && (
                <p className="mt-2 text-danger">
                  Super Admin punya akses penuh — termasuk membuat, mengubah, dan menghapus misi.
                </p>
              )}
              {pending.role === 'PARTICIPANT' && pending.account.role !== 'PARTICIPANT' && (
                <p className="mt-2">Akses panelnya akan dicabut.</p>
              )}
            </>
          )
        }
        confirmLabel="Ya, Ubah"
        confirmVariant={pending?.role === 'SUPER_ADMIN' ? 'danger' : 'primary'}
        loading={isPending}
        onConfirm={() =>
          pending &&
          setRole(
            { userId: pending.account.id, role: pending.role },
            { onSettled: () => setPending(null) },
          )
        }
        onCancel={() => setPending(null)}
      />
    </div>
  )
}

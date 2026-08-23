'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useDebounce } from '@/hooks/use-debounce'
import {
  participantAuthService,
  type ParticipantSuggestion,
} from '@/services/participant-auth.service'
import { AppError } from '@/libs/api'

/**
 * Masuk sebagai peserta, di kaki beranda.
 *
 * Peserta didaftarkan panitia, jadi ia tidak tahu email apa yang dipakaikan
 * untuknya — mencari namanya sendiri jauh lebih mungkin berhasil di tengah
 * lapangan daripada mengingat alamat surel. Nomor telepon yang membuktikan
 * bahwa nama yang dipilih memang dirinya.
 */
export default function LoginSection() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<ParticipantSuggestion | null>(null)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const debounced = useDebounce(query, 350)

  const { data: matches, isFetching } = useQuery({
    queryKey: ['participant-search', debounced],
    // Server pun menolak kata kunci pendek; ini mencegah permintaan sia-sia
    // sejak dari peramban.
    enabled: debounced.trim().length >= 3 && !picked,
    queryFn: async () => (await participantAuthService.search(debounced.trim())).data,
  })

  const submit = async () => {
    if (!picked || !phone.trim()) return
    setError(null)
    setBusy(true)
    try {
      const res = await participantAuthService.login(picked.id, phone.trim())
      const { accessToken, refreshToken } = res.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      queryClient.clear()
      router.replace('/race')
    } catch (e) {
      setError((e as AppError).message || 'Gagal masuk. Coba lagi.')
      setBusy(false)
    }
  }

  return (
    <section id="masuk" className="scroll-mt-24 px-6 py-20">
      <div className="mx-auto max-w-md">
        <p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-secondary">
          Sudah Terdaftar?
        </p>
        <h2 className="mt-2 text-center font-display text-3xl text-ink sm:text-4xl">MASUK</h2>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm text-ink/60">
          Cari namamu, lalu masukkan nomor telepon yang kamu berikan saat didaftarkan panitia.
        </p>

        <div className="mt-8 rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg">
          <Label htmlFor="cari-nama" required>
            Nama lengkap
          </Label>

          {picked ? (
            <div className="mt-2 flex items-center gap-3 rounded-md border-brut bg-primary/15 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{picked.fullname}</p>
                {picked.businessName && (
                  <p className="truncate text-xs text-ink/55">{picked.businessName}</p>
                )}
              </div>
              <button
                type="button"
                className="shrink-0 font-mono text-xs uppercase text-secondary"
                onClick={() => {
                  setPicked(null)
                  setQuery('')
                  setError(null)
                }}
              >
                Ganti
              </button>
            </div>
          ) : (
            <>
              <Input
                id="cari-nama"
                className="mt-2"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ketik minimal 3 huruf…"
                autoComplete="off"
              />

              {debounced.trim().length >= 3 && (
                <div className="mt-2 overflow-hidden rounded-md border-brut bg-paper">
                  {isFetching ? (
                    <p className="px-4 py-3 text-sm text-ink/55">Mencari…</p>
                  ) : !matches?.length ? (
                    <p className="px-4 py-3 text-sm text-ink/55">
                      Nama itu tidak ditemukan. Coba ejaan lain, atau tanya panitia.
                    </p>
                  ) : (
                    <ul className="max-h-56 overflow-y-auto">
                      {matches.map(m => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => setPicked(m)}
                            className="block w-full border-b border-ink/10 px-4 py-2.5 text-left last:border-b-0 hover:bg-primary/10"
                          >
                            <span className="block truncate text-sm font-bold text-ink">
                              {m.fullname}
                            </span>
                            {m.businessName && (
                              <span className="block truncate text-xs text-ink/50">
                                {m.businessName}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-5">
            <Label htmlFor="nomor-telepon" required>
              Nomor telepon
            </Label>
            <Input
              id="nomor-telepon"
              className="mt-2"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="08…"
              disabled={!picked}
              onKeyDown={e => {
                if (e.key === 'Enter') void submit()
              }}
            />
          </div>

          <ErrorMessage message={error ?? undefined} className="mt-3" />

          <Button
            size="lg"
            className="mt-5 w-full"
            loading={busy}
            disabled={!picked || !phone.trim()}
            onClick={submit}
          >
            Masuk
          </Button>

          <p className="mt-4 text-center text-xs text-ink/50">
            Panitia masuk lewat{' '}
            <a href="/auth/login" className="font-bold text-secondary underline">
              halaman panitia
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}

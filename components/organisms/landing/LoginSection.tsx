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
    <section
      id="masuk"
      className="scroll-mt-24 border-t-brut bg-scoreboard px-6 py-24 text-scoreboard-ink"
    >
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-center gap-3">
          <span aria-hidden className="h-px w-10 bg-primary" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Garis Start
          </span>
          <span aria-hidden className="h-px w-10 bg-primary" />
        </div>

        <h2 className="mt-3 text-center font-display text-4xl text-scoreboard-ink sm:text-5xl">
          MASUK
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm text-scoreboard-ink/60">
          Cari namamu, lalu masukkan nomor telepon yang kamu berikan saat didaftarkan panitia.
        </p>

        <div className="mt-8 rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg">
          <Label htmlFor="cari-nama" required>
            <span className="mr-2 inline-flex size-5 items-center justify-center rounded-full bg-primary font-mono text-[10px] text-primary-ink">
              1
            </span>
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
                    <>
                      <p className="border-b border-ink/10 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink/45">
                        {matches.length} nama cocok · ketuk namamu
                      </p>
                      {/* `data-lenis-prevent` melepaskan daftar ini dari
                          penggulir halus halaman. Tanpa itu Lenis menelan
                          gulirannya dan memindahkan seluruh halaman, sehingga
                          daftar nama terasa macet — persis keluhan di lapangan.
                          `overscroll-contain` menahan gulirannya agar tidak
                          merembet ke halaman setelah sampai ujung. */}
                      <ul
                        data-lenis-prevent
                        className="max-h-72 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
                      >
                        {matches.map(m => (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => setPicked(m)}
                              className="block w-full border-b border-ink/10 px-4 py-3.5 text-left last:border-b-0 hover:bg-primary/10 active:bg-primary/20"
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
                      {matches.length > 6 && (
                        <p className="border-t border-ink/10 px-4 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-ink/40">
                          Gulir di dalam kotak ini · atau ketik lebih lengkap
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-5">
            <Label htmlFor="nomor-telepon" required>
              <span
                className={`mr-2 inline-flex size-5 items-center justify-center rounded-full font-mono text-[10px] ${
                  picked ? 'bg-primary text-primary-ink' : 'bg-ink/15 text-ink/45'
                }`}
              >
                2
              </span>
              Nomor telepon
            </Label>
            <Input
              id="nomor-telepon"
              className="mt-2"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={picked ? '08…' : 'Pilih namamu dulu'}
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

        </div>
      </div>
    </section>
  )
}

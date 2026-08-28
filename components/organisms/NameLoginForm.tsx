'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import ErrorMessage from '@/components/elements/ErrorMessage'
import {
  participantAuthService,
  type LoginScope,
  type LoginSuggestion,
} from '@/services/participant-auth.service'
import { AppError } from '@/libs/api'
import { userService } from '@/services/user.service'

interface NameLoginFormProps {
  /** Menentukan daftar nama yang boleh muncul, dan ke mana orangnya diantar. */
  scope: LoginScope
  /** Kata yang dipakai di tempat "namamu" — panitia disapa berbeda. */
  emptyLabel?: string
}

const COPY: Record<LoginScope, { notFound: string; landing: string }> = {
  PARTICIPANT: {
    notFound: 'Nama itu tidak ditemukan. Coba ejaan lain, atau tanya panitia.',
    landing: '/race',
  },
  PANITIA: {
    notFound: 'Nama itu tidak terdaftar sebagai panitia. Hubungi Super Admin acara.',
    landing: '/admin/monitoring',
  },
}

/**
 * Masuk dengan mencari nama sendiri, lalu membuktikannya dengan nomor telepon.
 *
 * Dipakai dua layar: kaki beranda untuk peserta, dan /auth/login untuk panitia.
 * Keduanya menghadapi persoalan yang sama — akun dibuatkan orang lain, jadi
 * tidak ada yang hafal email yang dipakaikan untuknya, sementara nomor telepon
 * selalu ada di tangan. Yang membedakan hanya daftar nama yang boleh muncul,
 * dan itu ditentukan server, bukan di sini.
 *
 * Daftarnya diambil sekali saat layar terbuka, lalu disaring di peramban.
 * Sebelumnya tiap ketikan memicu permintaan baru: di jaringan lapangan yang
 * lambat, hasilnya datang setelah orangnya mengetik huruf berikutnya, sehingga
 * daftarnya berkedip dan kadang menampilkan hasil kata kunci yang sudah lewat.
 * Menyaring beberapa ratus nama di peramban tidak terasa sama sekali, dan
 * bekerja walau sinyalnya putus setelah halaman termuat.
 */
export default function NameLoginForm({ scope, emptyLabel = 'namamu' }: NameLoginFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const copy = COPY[scope]

  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<LoginSuggestion | null>(null)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const {
    data: candidates,
    isLoading: isLoadingNames,
    error: listError,
  } = useQuery({
    queryKey: ['login-candidates', scope],
    queryFn: async () => (await participantAuthService.candidates(scope)).data,
    // Daftar peserta tidak berubah selama acara berlangsung; mengambilnya ulang
    // tiap kali layar ini dibuka hanya membuang kuota data peserta.
    staleTime: 10 * 60_000,
  })

  const keyword = query.trim().toLowerCase()

  // Pencocokannya sengaja longgar: nama di lembar panitia kerap ditulis
  // terbalik atau hanya sebagian, jadi tiap potongan kata kunci cukup ada di
  // mana saja — "ahmad khairul" tetap menemukan "Khairul Ahmad".
  const matches = useMemo(() => {
    if (!candidates) return []
    if (!keyword) return candidates

    const parts = keyword.split(/\s+/)
    return candidates.filter(c => {
      const haystack = `${c.fullname} ${c.businessName ?? ''}`.toLowerCase()
      return parts.every(part => haystack.includes(part))
    })
  }, [candidates, keyword])

  const submit = async () => {
    if (!picked || !phone.trim()) return
    setError(null)
    setBusy(true)
    try {
      const res = await participantAuthService.login(picked.id, phone.trim(), scope)
      const { accessToken, refreshToken } = res.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      // Cache dibersihkan supaya data akun sebelumnya tidak sempat terlihat
      // oleh akun berikutnya di tab yang sama.
      queryClient.clear()

      // Penjaga pos hanya punya layar pos. Mendaratkannya di Monitoring berarti
      // langsung menabrak layar "Akses Ditolak" tepat setelah berhasil masuk.
      const role = scope === 'PANITIA' ? (await userService.getProfile()).data.role : null
      router.replace(role === 'POST_GUARD' ? '/admin/post' : copy.landing)
    } catch (e) {
      setError((e as AppError).message || 'Gagal masuk. Coba lagi.')
      setBusy(false)
    }
  }

  return (
    <div>
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
            placeholder={isLoadingNames ? 'Memuat daftar nama…' : 'Ketik namamu…'}
            autoComplete="off"
            disabled={isLoadingNames || !!listError}
          />

          <div className="mt-2 overflow-hidden rounded-md border-brut bg-paper">
            {isLoadingNames ? (
              <p className="px-4 py-3 text-sm text-ink/55">Memuat daftar nama…</p>
            ) : listError ? (
              <p className="px-4 py-3 text-sm font-bold text-danger">
                Gagal memuat daftar nama. Periksa koneksi, lalu muat ulang halaman.
              </p>
            ) : !matches.length ? (
              <p className="px-4 py-3 text-sm text-ink/55">{copy.notFound}</p>
            ) : (
              <>
                <p className="border-b border-ink/10 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink/45">
                  {keyword
                    ? `${matches.length} nama cocok · ketuk ${emptyLabel}`
                    : `${matches.length} nama · ketik untuk menyaring`}
                </p>
                {/* `data-lenis-prevent` melepaskan daftar ini dari penggulir
                    halus halaman; tanpa itu Lenis menelan gulirannya dan
                    memindahkan seluruh halaman. */}
                <ul
                  data-lenis-prevent
                  className="max-h-72 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
                >
                  {matches.slice(0, 100).map(m => (
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

                {/* Ratusan baris sekaligus membuat gulirannya berat di ponsel
                    kelas bawah; sisanya muncul begitu namanya diketik. */}
                {matches.length > 100 && (
                  <p className="border-t border-ink/10 px-4 py-2 text-xs text-ink/45">
                    Menampilkan 100 nama pertama — ketik namamu untuk mempersempit.
                  </p>
                )}
              </>
            )}
          </div>
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
          placeholder={picked ? '08…' : 'Pilih nama dulu'}
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
  )
}

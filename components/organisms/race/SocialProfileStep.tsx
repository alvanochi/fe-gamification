'use client'

import { useState } from 'react'
import RaceShell from '@/components/fragments/RaceShell'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import ErrorMessage from '@/components/elements/ErrorMessage'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import { useSaveSocialProfileMutation } from '@/hooks/use-profile'
import { AppError } from '@/libs/api'
import { Profile } from '@/types/group'

const PLATFORMS = [
  { key: 'instagramAccount', label: 'Akun Instagram', placeholder: '@usahaku' },
  { key: 'tiktokAccount', label: 'Akun TikTok', placeholder: '@usahaku' },
  { key: 'youtubeAccount', label: 'Akun YouTube', placeholder: 'Nama channel atau tautannya' },
] as const

type PlatformKey = (typeof PLATFORMS)[number]['key']

/**
 * Satu platform bisa punya beberapa akun — usaha yang punya akun toko dan akun
 * pemiliknya sendiri sama-sama dinilai. Disimpan sebagai satu kolom dipisah
 * koma, dan dipecah kembali saat dibaca.
 */
const splitAccounts = (value: string | null) => {
  const parts = (value ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
  return parts.length ? parts : ['']
}

const joinAccounts = (values: string[]) =>
  values
    .map(v => v.trim())
    .filter(Boolean)
    .join(', ')

/**
 * Checkpoint 0 — profil usaha & akun media sosial.
 *
 * Peserta didaftarkan panitia dari lembar kerja yang hanya memuat nama dan
 * nomor telepon, padahal sebagian misi dinilai dari unggahan di akun mereka
 * sendiri. Ditanyakan sekali di awal, sebelum kelompok terbentuk, karena
 * setelah perlombaan dimulai tidak ada lagi yang mau berhenti untuk mengetik.
 *
 * Boleh dilewati — tetapi konsekuensinya dinyatakan terlebih dahulu, bukan
 * ditemukan sendiri belakangan ketika poinnya tidak muncul.
 */
export default function SocialProfileStep({ profile }: { profile: Profile }) {
  const { mutate: save, isPending, error } = useSaveSocialProfileMutation()
  const apiError = error as AppError | null

  const [businessName, setBusinessName] = useState(profile.businessName ?? '')
  const [accounts, setAccounts] = useState<Record<PlatformKey, string[]>>({
    instagramAccount: splitAccounts(profile.instagramAccount),
    tiktokAccount: splitAccounts(profile.tiktokAccount),
    youtubeAccount: splitAccounts(profile.youtubeAccount),
  })
  const [isSkipping, setIsSkipping] = useState(false)

  const patch = (key: PlatformKey, index: number, value: string) =>
    setAccounts(prev => ({
      ...prev,
      [key]: prev[key].map((v, i) => (i === index ? value : v)),
    }))

  const addAccount = (key: PlatformKey) =>
    setAccounts(prev => ({ ...prev, [key]: [...prev[key], ''] }))

  const removeAccount = (key: PlatformKey, index: number) =>
    setAccounts(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }))

  const filledCount = PLATFORMS.reduce(
    (sum, p) => sum + accounts[p.key].filter(v => v.trim()).length,
    0,
  )

  const submit = () =>
    save({
      businessName: businessName.trim(),
      instagramAccount: joinAccounts(accounts.instagramAccount),
      tiktokAccount: joinAccounts(accounts.tiktokAccount),
      youtubeAccount: joinAccounts(accounts.youtubeAccount),
    })

  return (
    <RaceShell
      eyebrow="Checkpoint 0 · Profil Usaha"
      title="KENALKAN USAHAMU"
      subtitle="Sebagian misi dinilai dari unggahan di akunmu sendiri. Isi sekali di sini, dan panitia bisa menemukannya saat menilai."
    >
      <div className="space-y-5">
        {/* Peringatan akun terkunci ditaruh di kepala, bukan di kaki: akun
            privat adalah penyebab paling sering nilai media sosial hangus, dan
            peserta perlu tahu itu sebelum mengetik nama akunnya. */}
        <div className="flex items-start gap-3 rounded-md border-brut !border-warning bg-warning/15 px-4 py-3">
          <span aria-hidden className="text-xl">🔓</span>
          <div>
            <p className="font-bold text-ink">Pastikan akun dalam kondisi tidak private</p>
            <p className="mt-0.5 text-sm text-ink/70">
              Panitia harus bisa membuka unggahanmu untuk menilainya. Akun yang terkunci tidak bisa
              diperiksa, dan poin misi media sosialnya tidak dihitung.
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="businessName">Nama usaha / UMKM</Label>
          <Input
            id="businessName"
            className="mt-1"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="Misal: Batik Siti"
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-ink/50">Nama yang dipakai panitia saat menyebut usahamu.</p>
        </div>

        {PLATFORMS.map(platform => (
          <div key={platform.key}>
            <Label>{platform.label}</Label>

            <div className="mt-1 space-y-2">
              {accounts[platform.key].map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={value}
                    onChange={e => patch(platform.key, index, e.target.value)}
                    placeholder={platform.placeholder}
                    autoComplete="off"
                  />
                  {accounts[platform.key].length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAccount(platform.key, index)}
                      className="shrink-0 px-2 font-bold text-danger"
                      aria-label={`Hapus ${platform.label} ke-${index + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => addAccount(platform.key)}
            >
              + Tambah akun {platform.label.replace('Akun ', '')}
            </Button>
          </div>
        ))}

        <p className="rounded-md border-brut border-dashed bg-paper px-4 py-3 text-xs text-ink/60">
          Isi yang kamu punya saja — akun yang tidak ada boleh dikosongkan. Data ini hanya dibaca
          panitia untuk menilai misi media sosial.
        </p>

        <ErrorMessage message={apiError?.message} />

        <Button
          size="lg"
          className="w-full"
          loading={isPending && !isSkipping}
          onClick={submit}
        >
          Simpan &amp; Lanjut
        </Button>

        <Button size="sm" variant="ghost" className="w-full" onClick={() => setIsSkipping(true)}>
          Lewati dulu
        </Button>

        {filledCount === 0 && (
          <p className="text-center text-xs text-ink/45">
            Belum ada akun media sosial yang diisi.
          </p>
        )}
      </div>

      <ConfirmModal
        open={isSkipping}
        title="Lewati profil usaha?"
        description={
          <>
            <p>
              Misi media sosial <strong>tidak bisa dinilai</strong> tanpa akunmu — panitia tidak punya
              tempat untuk memeriksa unggahannya, jadi poinnya tidak dihitung untuk kelompokmu.
            </p>
            <p className="mt-2">
              Kamu tetap bisa mengerjakan misi lain seperti biasa. Bila berubah pikiran, mintalah
              panitia mengisikannya dari panel akun.
            </p>
          </>
        }
        confirmLabel="Ya, Lewati"
        confirmVariant="danger"
        cancelLabel="Isi Dulu"
        loading={isPending && isSkipping}
        onConfirm={() => save({ skipped: true }, { onSettled: () => setIsSkipping(false) })}
        onCancel={() => setIsSkipping(false)}
      />
    </RaceShell>
  )
}

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

const FIELDS = [
  {
    key: 'businessName',
    label: 'Nama usaha / UMKM',
    placeholder: 'Misal: Batik Siti',
    hint: 'Nama yang dipakai panitia saat menyebut usahamu.',
  },
  {
    key: 'instagramAccount',
    label: 'Akun Instagram',
    placeholder: '@usahaku',
    hint: null,
  },
  {
    key: 'tiktokAccount',
    label: 'Akun TikTok',
    placeholder: '@usahaku',
    hint: null,
  },
  {
    key: 'youtubeAccount',
    label: 'Akun YouTube',
    placeholder: 'Nama channel atau tautannya',
    hint: null,
  },
] as const

type FieldKey = (typeof FIELDS)[number]['key']

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

  const [form, setForm] = useState<Record<FieldKey, string>>({
    businessName: profile.businessName ?? '',
    instagramAccount: profile.instagramAccount ?? '',
    tiktokAccount: profile.tiktokAccount ?? '',
    youtubeAccount: profile.youtubeAccount ?? '',
  })
  const [isSkipping, setIsSkipping] = useState(false)

  const filledSocial = [form.instagramAccount, form.tiktokAccount, form.youtubeAccount].filter(v =>
    v.trim(),
  ).length

  return (
    <RaceShell
      eyebrow="Checkpoint 0 · Profil Usaha"
      title="KENALKAN USAHAMU"
      subtitle="Sebagian misi dinilai dari unggahan di akunmu sendiri. Isi sekali di sini, dan panitia bisa menemukannya saat menilai."
    >
      <div className="space-y-4">
        {FIELDS.map(field => (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              className="mt-1"
              value={form[field.key]}
              onChange={e => setForm({ ...form, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              autoComplete="off"
            />
            {field.hint && <p className="mt-1 text-xs text-ink/50">{field.hint}</p>}
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
          onClick={() => save({ ...form })}
        >
          Simpan &amp; Lanjut
        </Button>

        <Button size="sm" variant="ghost" className="w-full" onClick={() => setIsSkipping(true)}>
          Lewati dulu
        </Button>

        {filledSocial === 0 && (
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

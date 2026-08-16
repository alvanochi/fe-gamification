'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import TextArea from '@/components/elements/TextArea'
import ErrorMessage from '@/components/elements/ErrorMessage'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import {
  useAdminSettingsQuery,
  useAnnounceMutation,
  useReleaseMissionsMutation,
  useUpdateSettingsMutation,
  type AdminSettings,
} from '@/hooks/use-settings'
import { AppError } from '@/libs/api'

/** Kolom angka yang bisa diatur panitia, beserta penjelasannya. */
const NUMBER_FIELDS: Array<{ key: keyof AdminSettings; label: string; hint: string }> = [
  {
    key: 'formationLimitMinutes',
    label: 'Batas pembentukan kelompok (menit)',
    hint: 'Hitung mundur sejak kelompok dibentuk sampai namanya disimpan.',
  },
  {
    key: 'formationGraceMinutes',
    label: 'Tenggang keterlambatan (menit)',
    hint: 'Lewat batas tapi masih dalam tenggang ini mendapat poin terlambat.',
  },
  { key: 'formationFullPoint', label: 'Poin pembentukan tepat waktu', hint: '' },
  {
    key: 'formationLatePoint',
    label: 'Poin pembentukan terlambat',
    hint: 'Lebih dari tenggang = 0 poin.',
  },
  {
    key: 'yelYelDeadlineHours',
    label: 'Tenggat yel-yel (jam)',
    hint: 'Dihitung sejak misi yel-yel dibuka.',
  },
  { key: 'yelYelOnTimePoint', label: 'Poin yel-yel tepat waktu', hint: '' },
  { key: 'yelYelLatePoint', label: 'Poin yel-yel terlambat', hint: '' },
  {
    key: 'barterPointPerStep',
    label: 'Poin per pertukaran barter',
    hint: 'Diberikan tiap pertukaran yang disetujui panitia.',
  },
  {
    key: 'leaderboardTopN',
    label: 'Jumlah tim di klasemen',
    hint: 'Berapa tim teratas yang ditampilkan.',
  },
]

const jam = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''

/**
 * Isi panel. Dipisah dari pembungkusnya supaya nilai awal formulir bisa
 * diambil langsung dari data saat komponen pertama kali dipasang — tanpa
 * menyalin prop ke state lewat effect.
 */
function ControlForm({ data }: { data: AdminSettings }) {
  const update = useUpdateSettingsMutation()
  const release = useReleaseMissionsMutation()
  const announce = useAnnounceMutation()

  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(NUMBER_FIELDS.map(f => [f.key as string, String(data[f.key] ?? '')])),
  )
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [confirmRelease, setConfirmRelease] = useState(false)

  const apiError = (update.error ?? release.error ?? announce.error) as AppError | null
  const released = data.missionsReleased

  const saveNumbers = () => {
    const patch: Record<string, number> = {}
    for (const f of NUMBER_FIELDS) {
      const value = Number(draft[f.key as string])
      if (Number.isFinite(value)) patch[f.key as string] = value
    }
    update.mutate(patch as Partial<AdminSettings>, {
      onSuccess: () => setFeedback('Pengaturan tersimpan.'),
    })
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="rounded-md border-brut !border-success bg-paper p-4 text-sm font-bold text-success">
          {feedback}
        </div>
      )}
      <ErrorMessage message={apiError?.message} />

      {/* Gerbang rilis misi */}
      <div className="rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg">
        <h3 className="font-display text-2xl text-ink">Mulai Permainan</h3>
        <p className="mt-1 text-sm text-ink/60">
          Selama belum dibuka, daftar misi peserta kosong — cocok untuk masa briefing sebelum acara
          dimulai.
        </p>

        <div
          className={`mt-4 rounded-md border-brut px-4 py-3 text-sm font-bold ${
            released ? '!border-success text-success' : '!border-warning text-warning'
          }`}
        >
          {released
            ? `Misi sudah dibuka${data.missionsReleasedAt ? ` pukul ${jam(data.missionsReleasedAt)}` : ''}.`
            : 'Misi masih tertutup. Peserta belum bisa melihat maupun mengerjakan misi.'}
        </div>

        <Button
          size="lg"
          variant={released ? 'secondary' : 'primary'}
          className="mt-4 w-full"
          loading={release.isPending}
          onClick={() => (released ? release.mutate(false) : setConfirmRelease(true))}
        >
          {released ? 'Tutup Kembali Misi' : 'Munculkan Misi'}
        </Button>
      </div>

      {/* Pengumuman */}
      <div className="rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg">
        <h3 className="font-display text-2xl text-ink">Kirim Pengumuman</h3>
        <p className="mt-1 text-sm text-ink/60">
          Muncul sebagai pop-up di aplikasi seluruh peserta saat itu juga.
        </p>

        <TextArea
          className="mt-4"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Misal: Acara resmi dimulai! Silakan buka daftar misi kalian."
        />
        <Button
          size="lg"
          className="mt-3 w-full"
          loading={announce.isPending}
          disabled={!message.trim()}
          onClick={() =>
            announce.mutate(message.trim(), {
              onSuccess: () => {
                setFeedback('Pengumuman terkirim ke seluruh peserta.')
                setMessage('')
              },
            })
          }
        >
          Kirim ke Semua Peserta
        </Button>

        {data.announcement && (
          <p className="mt-3 text-xs text-ink/50">
            Terakhir: &quot;{data.announcement}&quot;
            {data.announcedAt && ` — ${jam(data.announcedAt)}`}
          </p>
        )}
      </div>

      {/* Waktu & poin */}
      <div className="rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg">
        <h3 className="font-display text-2xl text-ink">Waktu &amp; Poin</h3>
        <p className="mt-1 text-sm text-ink/60">
          Berlaku untuk seluruh kelompok. Perubahan langsung dipakai perhitungan berikutnya.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {NUMBER_FIELDS.map(field => (
            <div key={field.key as string}>
              <Label>{field.label}</Label>
              <Input
                type="number"
                min={0}
                value={draft[field.key as string] ?? ''}
                onChange={e => setDraft(prev => ({ ...prev, [field.key as string]: e.target.value }))}
              />
              {field.hint && <p className="mt-1 text-xs text-ink/50">{field.hint}</p>}
            </div>
          ))}
        </div>

        <Button size="lg" className="mt-5 w-full" loading={update.isPending} onClick={saveNumbers}>
          Simpan Pengaturan
        </Button>
      </div>

      <ConfirmModal
        open={confirmRelease}
        title="Munculkan misi sekarang?"
        description={
          <>
            <p>Seluruh peserta akan langsung bisa melihat dan mengerjakan misi.</p>
            <p className="mt-2">
              Pastikan briefing sudah selesai. Anda masih bisa menutupnya kembali bila perlu.
            </p>
          </>
        }
        confirmLabel="Ya, Mulai Permainan"
        loading={release.isPending}
        onConfirm={() =>
          release.mutate(true, {
            onSuccess: () => setFeedback('Misi dibuka untuk seluruh peserta.'),
            onSettled: () => setConfirmRelease(false),
          })
        }
        onCancel={() => setConfirmRelease(false)}
      />
    </div>
  )
}

/**
 * Pusat kendali acara — mulai permainan, kirim pengumuman, dan atur seluruh
 * angka waktu serta poin tanpa perlu deploy ulang.
 */
export default function EventControlPanel() {
  const { data, isLoading } = useAdminSettingsQuery()

  if (isLoading || !data) return <CardSkeleton />

  // key memastikan formulir memuat ulang nilainya bila pengaturan berubah dari
  // perangkat lain.
  return <ControlForm key={data.updatedAt} data={data} />
}

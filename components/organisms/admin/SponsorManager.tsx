'use client'

import { useRef, useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import ErrorMessage from '@/components/elements/ErrorMessage'
import SponsorLogo from '@/components/fragments/SponsorLogo'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import {
  useAdminSponsorsQuery,
  useCreateSponsorMutation,
  useDeleteSponsorMutation,
  useUpdateSponsorMutation,
} from '@/hooks/use-sponsors'
import { submissionService } from '@/services/submission.service'
import { AppError } from '@/libs/api'
import { SponsorAdmin } from '@/types/sponsor'

function SponsorRow({ sponsor }: { sponsor: SponsorAdmin }) {
  const { mutate: update, isPending: isUpdating } = useUpdateSponsorMutation()
  const { mutate: remove, isPending: isDeleting, error: deleteError } = useDeleteSponsorMutation()
  const apiError = deleteError as AppError | null

  return (
    <li className="rounded-md border-brut bg-paper p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-sm border-brut-sm bg-white p-1">
          <SponsorLogo src={sponsor.logoUrl} name={sponsor.name} className="max-h-full max-w-full" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{sponsor.name}</p>
          {sponsor.linkUrl && (
            <p className="truncate font-mono text-xs text-ink/50">{sponsor.linkUrl}</p>
          )}
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink/40">
            urutan {sponsor.orderNum} · {sponsor.isActive ? 'tampil' : 'disembunyikan'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          loading={isUpdating}
          onClick={() => update({ id: sponsor.id, isActive: !sponsor.isActive })}
        >
          {sponsor.isActive ? 'Sembunyikan' : 'Tampilkan'}
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          loading={isDeleting}
          onClick={() => {
            if (confirm(`Hapus sponsor "${sponsor.name}"?`)) remove(sponsor.id)
          }}
        >
          Hapus
        </Button>
      </div>

      <ErrorMessage message={apiError?.message} className="mt-2" />
    </li>
  )
}

export default function SponsorManager() {
  const { data: sponsors, isLoading } = useAdminSponsorsQuery()
  const { mutate: create, isPending, error, isSuccess } = useCreateSponsorMutation()
  const apiError = error as AppError | null

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [orderNum, setOrderNum] = useState('0')
  const [logoUrl, setLogoUrl] = useState('')
  // Pratinjau memakai berkas lokal, bukan URL hasil unggahan. Menampilkan URL
  // penyimpanan langsung membuat kotak pratinjau kosong bila domain publiknya
  // belum bisa diakses dari jaringan panitia — padahal berkasnya sudah aman
  // tersimpan. Ini penyebab pratinjau logo terlihat gagal, sementara pratinjau
  // foto kelompok tetap muncul karena memang membaca berkas lokal.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handlePickLogo = async (file: File) => {
    setUploadError(null)
    setIsUploading(true)
    setPreviewUrl(URL.createObjectURL(file))
    try {
      setLogoUrl(await submissionService.uploadEvidence(file))
    } catch (e) {
      setUploadError((e as AppError).message)
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreate = () => {
    create(
      {
        name: name.trim(),
        logoUrl,
        linkUrl: linkUrl.trim() || undefined,
        orderNum: Number(orderNum) || 0,
      },
      {
        onSuccess: () => {
          setName('')
          setLinkUrl('')
          setOrderNum('0')
          setLogoUrl('')
          setPreviewUrl(null)
        },
      },
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5 rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg sm:p-8">
        <h3 className="font-display text-2xl text-ink">Tambah Sponsor</h3>

        {isSuccess && (
          <div className="rounded-md border-brut !border-success bg-paper p-4 text-sm font-bold text-success">
            Sponsor berhasil ditambahkan.
          </div>
        )}

        <div>
          <Label required>Nama Sponsor</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Misal: Angkringan Lik Man"
          />
        </div>

        <div>
          <Label required>Logo</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handlePickLogo(file)
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-28 w-full items-center justify-center overflow-hidden rounded-md border-brut bg-paper p-2"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Pratinjau logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-sm font-bold text-ink/50">
                {isUploading ? 'Mengunggah…' : 'Ketuk untuk pilih logo'}
              </span>
            )}
          </button>
          <ErrorMessage message={uploadError ?? undefined} />
        </div>

        <div>
          <Label>Link Sponsor (opsional)</Label>
          <Input
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://instagram.com/..."
          />
        </div>

        <div>
          <Label>Urutan Tampil</Label>
          <Input
            type="number"
            min={0}
            value={orderNum}
            onChange={e => setOrderNum(e.target.value)}
          />
        </div>

        <Button
          size="lg"
          className="w-full"
          loading={isPending}
          disabled={!name.trim() || !logoUrl || isUploading}
          onClick={handleCreate}
        >
          Simpan Sponsor
        </Button>
        <ErrorMessage message={apiError?.message} />
      </div>

      <div>
        <h3 className="font-display text-2xl text-ink">Daftar Sponsor</h3>
        {isLoading ? (
          <div className="mt-4 space-y-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : !sponsors || sponsors.length === 0 ? (
          <p className="mt-4 rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
            Belum ada sponsor terdaftar.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sponsors.map(sponsor => (
              <SponsorRow key={sponsor.id} sponsor={sponsor} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

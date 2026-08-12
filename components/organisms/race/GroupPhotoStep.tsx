'use client'

import { useRef, useState } from 'react'
import RaceShell from '@/components/fragments/RaceShell'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useGroupPhotoMutation } from '@/hooks/use-group'
import { AppError } from '@/libs/api'

export default function GroupPhotoStep({ groupId }: { groupId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const { mutate: completePhoto, isPending, error } = useGroupPhotoMutation(groupId)
  const apiError = error as AppError | null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setFileName(file.name)
    setPreviewUrl(URL.createObjectURL(file))
  }

  return (
    <RaceShell
      eyebrow="Checkpoint 3 · Foto Bersama"
      title="FOTO BARENG TIM"
      subtitle="Ambil satu foto bersama seluruh anggota yang sudah terkonfirmasi."
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border-brut bg-paper"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Pratinjau foto kelompok" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-ink/50">Ketuk untuk pilih foto dari galeri</span>
        )}
      </button>
      {fileName && <p className="mt-2 text-xs text-ink/60">{fileName}</p>}

      <Button
        size="lg"
        className="mt-6 w-full"
        loading={isPending}
        disabled={!photoFile}
        onClick={() => completePhoto(photoFile)}
      >
        Selesai, Lanjut ke Voting
      </Button>
      <ErrorMessage message={apiError?.message} className="mt-3" />
    </RaceShell>
  )
}

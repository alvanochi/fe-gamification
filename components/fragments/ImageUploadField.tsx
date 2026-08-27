'use client'

import { useRef, useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { AppError } from '@/libs/api'
import { submissionService } from '@/services/submission.service'
import { IMAGE_ACCEPT } from '@/utils/mission/type-meta'

/**
 * Unggah satu gambar, dengan pratinjaunya.
 *
 * Sebelumnya panitia hanya melihat `<input type="file">` bawaan peramban dan
 * sebaris teks "Gambar tersimpan" — tidak ada cara memastikan gambar yang
 * benar-benar terunggah, atau menggantinya setelah salah pilih. Pratinjau
 * memakai berkas lokal, bukan URL hasil unggahan, supaya kotaknya tetap terisi
 * walau domain media belum bisa dibuka dari jaringan panitia.
 */
export default function ImageUploadField({
  value,
  onChange,
  label = 'Ketuk untuk pilih gambar',
  className = '',
}: {
  value?: string
  onChange: (url: string | undefined) => void
  label?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preview = localPreview ?? value ?? null

  const pick = async (file: File) => {
    setError(null)
    setIsUploading(true)
    setLocalPreview(URL.createObjectURL(file))
    try {
      onChange(await submissionService.uploadEvidence(file))
    } catch (e) {
      setError((e as AppError).message || 'Gagal mengunggah gambar.')
      setLocalPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) void pick(file)
          // Memilih berkas yang sama dua kali berturut-turut tidak memicu
          // onChange kalau nilainya tidak dikosongkan.
          e.target.value = ''
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-40 w-full items-center justify-center overflow-hidden rounded-md border-brut bg-paper p-2"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Pratinjau gambar" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="px-4 text-center text-sm font-bold text-ink/50">
            {isUploading ? 'Mengunggah…' : label}
          </span>
        )}
      </button>

      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {preview ? 'Ganti Gambar' : 'Pilih Gambar'}
        </Button>
        {preview && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setLocalPreview(null)
              onChange(undefined)
            }}
          >
            Hapus
          </Button>
        )}
      </div>

      <ErrorMessage message={error ?? undefined} />
    </div>
  )
}

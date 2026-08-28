'use client'

import { useRef, useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { AppError } from '@/libs/api'
import { submissionService } from '@/services/submission.service'
import { IMAGE_ACCEPT } from '@/utils/mission/type-meta'

/**
 * Unggah beberapa gambar sekaligus, dengan pratinjaunya.
 *
 * Dipakai untuk foto pendamping petunjuk: sebagian misi memberi kalimat
 * perintah lalu lima foto titik yang harus dicari peserta. Kolom gambar
 * tunggal memaksa panitia memilih satu di antaranya, dan empat sisanya tidak
 * pernah sampai ke layar peserta.
 *
 * Berkas diunggah begitu dipilih — berbarengan, bukan berurutan — supaya
 * memilih lima foto tidak terasa seperti menunggu lima kali.
 */
export default function ImageListField({
  value,
  onChange,
  label = 'Ketuk untuk pilih gambar',
  max = 10,
  className = '',
}: {
  value: string[]
  onChange: (urls: string[]) => void
  label?: string
  max?: number
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFull = value.length >= max

  const pick = async (files: File[]) => {
    setError(null)
    setIsUploading(true)
    try {
      const room = max - value.length
      const urls = await Promise.all(
        files.slice(0, room).map(file => submissionService.uploadEvidence(file)),
      )
      onChange([...value, ...urls])
    } catch (e) {
      setError((e as AppError).message || 'Gagal mengunggah gambar.')
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
        multiple
        className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) void pick(files)
          // Memilih berkas yang sama dua kali berturut-turut tidak memicu
          // onChange kalau nilainya tidak dikosongkan.
          e.target.value = ''
        }}
      />

      {value.length > 0 && (
        <ul className="mb-2 grid grid-cols-3 gap-2">
          {value.map((url, index) => (
            <li key={url} className="relative">
              <span className="block aspect-square overflow-hidden rounded-md border-brut-sm bg-paper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Gambar petunjuk ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </span>
              <button
                type="button"
                aria-label={`Hapus gambar ${index + 1}`}
                onClick={() => onChange(value.filter(u => u !== url))}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-brut-sm bg-danger font-bold text-white"
              >
                ✕
              </button>
              <span className="absolute bottom-1 left-1 rounded-sm bg-ink/70 px-1.5 font-mono text-[10px] font-bold text-paper">
                {index + 1}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!isFull && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-28 w-full items-center justify-center rounded-md border-brut border-dashed bg-paper p-2"
        >
          <span className="px-4 text-center text-sm font-bold text-ink/50">
            {isUploading ? 'Mengunggah…' : value.length ? 'Tambah gambar lagi' : label}
          </span>
        </button>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={isUploading}
          disabled={isFull}
          onClick={() => inputRef.current?.click()}
        >
          Pilih Gambar
        </Button>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
          {value.length}/{max} gambar
        </span>
      </div>

      <ErrorMessage message={error ?? undefined} />
    </div>
  )
}

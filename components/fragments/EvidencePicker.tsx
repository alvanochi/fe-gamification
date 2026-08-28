'use client'

import { useEffect, useMemo } from 'react'
import MediaPicker from '@/components/fragments/MediaPicker'
import { ProofType } from '@/types/mission'
import {
  PROOF_ACCEPT,
  PROOF_TYPE_LABEL,
  allowsPhotoProof,
  allowsVideoProof,
} from '@/utils/mission/type-meta'

interface EvidencePickerProps {
  proofType: ProofType
  files: File[]
  onChange: (files: File[]) => void
  /** Batas atas mengikuti server; melewatinya berarti unggahan ditolak. */
  max?: number
}

const isVideo = (file: File) => file.type.startsWith('video/')

/**
 * Bukti misi yang boleh lebih dari satu berkas.
 *
 * Sebagian misi meminta bukti di beberapa titik sekaligus — "foto di lima titik
 * berikut" tidak bisa diwakili satu foto. Sebelumnya kolom buktinya hanya
 * menampung satu berkas, jadi peserta terpaksa memilih salah satu dan panitia
 * menilai dari bukti yang tidak lengkap.
 *
 * Berkas kedua dan seterusnya bersifat pilihan: misi yang memang hanya butuh
 * satu foto tetap selesai dengan satu ketukan, tanpa langkah tambahan.
 */
export default function EvidencePicker({
  proofType,
  files,
  onChange,
  max = 10,
}: EvidencePickerProps) {
  const previews = useMemo(() => files.map(file => URL.createObjectURL(file)), [files])

  // URL objek dilepas begitu daftarnya berubah; tanpa itu setiap foto yang
  // dipilih meninggalkan blob yang menahan memorinya sampai halaman ditutup.
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])

  const isFull = files.length >= max

  return (
    <div className="space-y-2">
      {!isFull && (
        <MediaPicker
          multiple
          onPick={file => onChange([...files, file].slice(0, max))}
          previewUrl={null}
          accept={PROOF_ACCEPT[proofType]}
          allowPhoto={allowsPhotoProof(proofType)}
          allowVideo={allowsVideoProof(proofType)}
          label={
            files.length
              ? 'Tambah bukti lagi (opsional)'
              : `Ketuk untuk membuka kamera — bukti ${PROOF_TYPE_LABEL[proofType].toLowerCase()}`
          }
        />
      )}

      {files.length > 0 && (
        <>
          <ul className="grid grid-cols-3 gap-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="relative">
                <span className="block aspect-square overflow-hidden rounded-md border-brut-sm bg-paper">
                  {isVideo(file) ? (
                    <video src={previews[index]} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previews[index]}
                      alt={`Bukti ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>
                <button
                  type="button"
                  aria-label={`Hapus bukti ${index + 1}`}
                  onClick={() => onChange(files.filter((_, i) => i !== index))}
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

          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
            {files.length} bukti siap dikirim
            {isFull ? ` · batas ${max} berkas` : ' · boleh tambah lagi'}
          </p>
        </>
      )}
    </div>
  )
}

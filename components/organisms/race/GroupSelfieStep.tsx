'use client'

import { useRef, useState } from 'react'
import RaceShell from '@/components/fragments/RaceShell'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import FormationCountdown from '@/components/organisms/race/FormationCountdown'
import { useGroupPhotoMutation } from '@/hooks/use-group'
import { AppError } from '@/libs/api'
import { Group } from '@/types/group'

/**
 * Checkpoint 2 — kenali timmu, lalu unggah satu selfie bersama.
 *
 * Menggantikan langkah saling mencentang "sudah ketemu": foto bersama sudah
 * membuktikan mereka benar-benar berkumpul, dan jauh lebih cepat untuk
 * kelompok berisi enam orang.
 */
export default function GroupSelfieStep({ group, myId }: { group: Group; myId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { mutate: completePhoto, isPending, error } = useGroupPhotoMutation(group.id)
  const apiError = error as AppError | null

  // Diri sendiri selalu di urutan teratas supaya peserta tidak perlu menggulir
  // mencari namanya di kelompok berisi enam orang.
  const me = group.members.find(m => m.id === myId)
  const others = group.members.filter(m => m.id !== myId)
  const ordered = me ? [me, ...others] : group.members

  const alreadyUploaded = !!group.photoCompletedAt
  const uploaderName = group.photoByName ?? null
  const uploadedByMe = group.photoBy === myId

  return (
    <RaceShell
      eyebrow="Checkpoint 2 · Kenali Timmu"
      title="TIM KAMU"
      subtitle="Berkumpullah dengan anggota di bawah ini, lalu unggah satu foto selfie bersama."
    >
      <FormationCountdown group={group} />

      {group.category && (
        <p
          className="mt-4 inline-block rounded-full border-brut-sm px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest"
          style={{ backgroundColor: group.category.color, color: '#fff' }}
        >
          {group.category.name}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {ordered.map(member => (
          <li
            key={member.id}
            className={`flex items-center justify-between gap-3 rounded-md border-brut px-4 py-3 ${
              member.id === myId ? 'bg-primary/15' : 'bg-paper'
            }`}
          >
            <span className="truncate font-bold text-ink">{member.fullname}</span>
            {member.id === myId && (
              <span className="shrink-0 rounded-sm border-brut-sm bg-primary px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-ink">
                Kamu
              </span>
            )}
          </li>
        ))}
      </ul>

      {alreadyUploaded ? (
        <div className="mt-6 rounded-md border-brut !border-success bg-paper px-4 py-4 text-center">
          <p className="text-sm font-bold text-success">
            {uploadedByMe
              ? 'Foto kelompok berhasil kamu unggah!'
              : `Foto kelompok sudah diunggah oleh ${uploaderName ?? 'anggota lain'}.`}
          </p>
          <p className="mt-1 text-xs text-ink/55">Lanjut ke pemilihan ketua…</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {/* capture="user" meminta kamera depan langsung terbuka di ponsel.
              Di desktop peramban tetap menampilkan pemilih berkas — itu batas
              yang tidak bisa dipaksakan dari sisi web. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              setPhotoFile(file)
              setPreviewUrl(URL.createObjectURL(file))
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border-brut bg-paper"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Pratinjau selfie kelompok" className="h-full w-full object-cover" />
            ) : (
              <span className="px-4 text-center text-sm font-bold text-ink/50">
                Ketuk untuk membuka kamera
              </span>
            )}
          </button>

          <Button
            size="lg"
            className="w-full"
            loading={isPending}
            disabled={!photoFile}
            onClick={() => completePhoto(photoFile)}
          >
            Kirim Selfie Kelompok
          </Button>

          <p className="text-xs text-ink/50">
            Cukup satu orang yang mengunggah — anggota lain akan melihat namanya di sini.
          </p>
          <ErrorMessage message={apiError?.message} />
        </div>
      )}
    </RaceShell>
  )
}

'use client'

import { useState } from 'react'
import RaceShell from '@/components/fragments/RaceShell'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { AppError } from '@/libs/api'
import { Group } from '@/types/group'
import { useUpdateGroupNameMutation } from '@/hooks/use-group'

interface NameGroupStepProps {
  group: Group
  myId: string
}

export default function NameGroupStep({ group, myId }: NameGroupStepProps) {
  const isLeader = group.leaderId === myId
  const [name, setName] = useState('')
  const { mutate: updateName, isPending, error } = useUpdateGroupNameMutation(group.id)
  const apiError = error as AppError | null
  const leaderName = group.members.find(m => m.id === group.leaderId)?.fullname ?? 'Ketua'

  if (!isLeader) {
    return (
      <RaceShell
        eyebrow="Checkpoint 3 · Penamaan Tim"
        title="MENUNGGU KETUA"
        subtitle={`${leaderName} sedang memberi nama untuk kelompok kalian.`}
      >
        <div className="rounded-md border-brut bg-paper px-4 py-6 text-center text-sm font-bold text-ink/60">
          Halaman ini akan otomatis lanjut begitu nama tim ditentukan.
        </div>
      </RaceShell>
    )
  }

  return (
    <RaceShell
      eyebrow="Checkpoint 3 · Penamaan Tim (Ketua)"
      title="BERI NAMA TIMMU"
      subtitle="Nama tim harus unik — sistem akan menolak nama yang sudah dipakai kelompok lain."
    >
      <form
        onSubmit={e => {
          e.preventDefault()
          if (name.trim()) updateName(name.trim())
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="group-name" required>
            Nama Tim
          </Label>
          <Input
            id="group-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Misal: Tim Sinar Malioboro"
            error={!!apiError}
          />
          <ErrorMessage message={apiError?.message} />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isPending}>
          Simpan Nama Tim
        </Button>
      </form>
    </RaceShell>
  )
}

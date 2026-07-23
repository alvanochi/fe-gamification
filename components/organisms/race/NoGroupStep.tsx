'use client'

import RaceShell from '@/components/fragments/RaceShell'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import RadarSearch from '@/components/elements/RadarSearch'
import { useAutoGroupMutation } from '@/hooks/use-group'
import { AppError } from '@/libs/api'

export default function NoGroupStep() {
  const { mutate: autoGroup, isPending, error } = useAutoGroupMutation()
  const apiError = error as AppError | null

  return (
    <RaceShell
      eyebrow="Checkpoint 1 · Kelompok"
      title="GABUNG KELOMPOK"
      subtitle="Sistem akan mengacak kamu ke dalam kelompok berisi maksimal 6 orang."
    >
      {isPending ? (
        <RadarSearch label="Mencari kelompokmu di sekitar…" />
      ) : (
        <Button size="lg" className="w-full" onClick={() => autoGroup()}>
          Cari Kelompokku
        </Button>
      )}
      <ErrorMessage message={apiError?.message} className="mt-3" />
    </RaceShell>
  )
}

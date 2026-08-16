'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import { useBarterQueueQuery, useValidateBarterStepMutation } from '@/hooks/use-barter-queue'
import { useSettingsQuery } from '@/hooks/use-settings'
import { AppError } from '@/libs/api'

/**
 * Antrean pertukaran Bigger Better.
 *
 * Kelompok baru boleh menukar lagi setelah pertukaran terakhirnya disetujui,
 * jadi antrean ini adalah penghambat langsung bagi mereka — perlu ditangani
 * cepat selama acara berjalan.
 */
export default function BarterQueue() {
  const { data, isLoading } = useBarterQueueQuery()
  const { data: settings } = useSettingsQuery()
  const validate = useValidateBarterStepMutation()
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const apiError = validate.error as AppError | null

  if (isLoading) return <CardSkeleton />

  const poin = settings?.barterPointPerStep ?? 20

  if (!data || data.length === 0) {
    return (
      <p className="rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
        Tidak ada pertukaran yang menunggu validasi.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/60">
        Setiap pertukaran yang disetujui bernilai <strong>{poin} poin</strong>. Pemenangnya adalah
        kelompok dengan pertukaran sah terbanyak.
      </p>
      <ErrorMessage message={apiError?.message} />

      <ul className="space-y-4">
        {data.map(step => (
          <li key={step.id} className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
                  {step.groupName} · pertukaran ke-{step.stepNo}
                </p>
                <p className="mt-1 font-display text-xl text-ink">
                  {step.itemFrom} → {step.itemTo}
                </p>
                {step.partnerName && (
                  <p className="text-sm text-ink/60">bersama {step.partnerName}</p>
                )}
              </div>
              <span className="shrink-0 rounded-full border-brut-sm bg-primary px-3 py-1 font-display text-sm text-primary-ink">
                {poin} pt
              </span>
            </div>

            {step.mediaUrl && (
              <a href={step.mediaUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.mediaUrl}
                  alt="Bukti pertukaran"
                  className="mt-3 aspect-video w-full rounded-md border-brut object-cover"
                />
              </a>
            )}

            <input
              value={reasons[step.id] ?? ''}
              onChange={e => setReasons(prev => ({ ...prev, [step.id]: e.target.value }))}
              placeholder="Alasan penolakan (opsional)"
              className="mt-3 w-full rounded-md border-brut-sm bg-paper px-3 py-2 text-sm font-medium text-ink focus:outline-none"
            />

            <div className="mt-3 flex gap-3">
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                loading={validate.isPending && validate.variables?.stepId === step.id}
                onClick={() =>
                  validate.mutate({
                    stepId: step.id,
                    status: 'REJECTED',
                    rejectReason: reasons[step.id]?.trim() || undefined,
                  })
                }
              >
                Tolak
              </Button>
              <Button
                size="sm"
                className="flex-1"
                loading={validate.isPending && validate.variables?.stepId === step.id}
                onClick={() => validate.mutate({ stepId: step.id, status: 'APPROVED' })}
              >
                Setujui
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

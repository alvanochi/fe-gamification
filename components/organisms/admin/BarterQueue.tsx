'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import ErrorMessage from '@/components/elements/ErrorMessage'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import {
  useBarterQueueQuery,
  useFinishBarterMutation,
  useValidateBarterStepMutation,
  type BarterQueueItem,
} from '@/hooks/use-barter-queue'
import { useSettingsQuery } from '@/hooks/use-settings'
import { AppError } from '@/libs/api'

type Pending = 'REJECT' | 'FINISH' | null

/**
 * Satu pertukaran yang menunggu keputusan panitia.
 *
 * Tiga keputusan yang mungkin, dan ketiganya berbeda akibatnya:
 * menyetujui membuka pertukaran berikutnya, menolak menghentikan rantainya,
 * dan mengakhiri menutup rantai itu dengan nilai akhir. Dua yang terakhir
 * tidak bisa dibatalkan, jadi keduanya lewat konfirmasi.
 */
function BarterCard({ step, pointPerStep }: { step: BarterQueueItem; pointPerStep: number }) {
  const validate = useValidateBarterStepMutation()
  const finish = useFinishBarterMutation()

  const [pending, setPending] = useState<Pending>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [finalPoint, setFinalPoint] = useState('')

  const apiError = (validate.error ?? finish.error) as AppError | null
  const parsedPoint = Number(finalPoint)
  const finalPointValid = finalPoint.trim() !== '' && Number.isInteger(parsedPoint) && parsedPoint >= 0

  return (
    <li className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
            {step.groupName} · pertukaran ke-{step.stepNo}
          </p>
          <p className="mt-1 font-display text-xl text-ink">
            {step.itemFrom} → {step.itemTo}
          </p>
          {step.partnerName && <p className="text-sm text-ink/60">bersama {step.partnerName}</p>}
          <p className="mt-1 font-mono text-[11px] text-ink/45">
            {step.approvedSteps} pertukaran sah sebelumnya
          </p>
        </div>
        <span className="shrink-0 rounded-full border-brut-sm bg-primary px-3 py-1 font-display text-sm text-primary-ink">
          {pointPerStep} pt
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

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          disabled={validate.isPending || finish.isPending}
          onClick={() => setPending('REJECT')}
        >
          Tolak
        </Button>
        <Button
          size="sm"
          className="flex-1"
          loading={validate.isPending && validate.variables?.status === 'APPROVED'}
          disabled={validate.isPending || finish.isPending}
          onClick={() => validate.mutate({ stepId: step.id, status: 'APPROVED' })}
        >
          Setujui
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={validate.isPending || finish.isPending}
          onClick={() => {
            setFinalPoint('')
            setPending('FINISH')
          }}
        >
          Akhiri
        </Button>
      </div>

      <ErrorMessage message={apiError?.message} className="mt-2" />

      <ConfirmModal
        open={pending === 'REJECT'}
        title={`Tolak pertukaran ${step.groupName}?`}
        description={
          <>
            <p>
              Rantai barter kelompok ini <strong>ditutup</strong> — mereka tidak bisa menukar lagi,
              dan misinya pindah ke bagian selesai di layar mereka.
            </p>
            <Input
              className="mt-3"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Alasan penolakan (mis. barang tidak sesuai)"
            />
          </>
        }
        confirmLabel="Ya, Tolak & Tutup"
        confirmVariant="danger"
        loading={validate.isPending && validate.variables?.status === 'REJECTED'}
        onConfirm={() =>
          validate.mutate(
            {
              stepId: step.id,
              status: 'REJECTED',
              rejectReason: rejectReason.trim() || undefined,
            },
            { onSettled: () => setPending(null) },
          )
        }
        onCancel={() => setPending(null)}
      />

      <ConfirmModal
        open={pending === 'FINISH'}
        title={`Akhiri barter ${step.groupName}?`}
        description={
          <>
            <p>
              Rantai barter kelompok ini ditutup dengan nilai akhir di bawah. Pertukaran yang masih
              menunggu ikut ditutup, dan misinya tidak muncul lagi sebagai tugas mereka.
            </p>
            <Input
              className="mt-3"
              type="number"
              min={0}
              value={finalPoint}
              onChange={e => setFinalPoint(e.target.value)}
              placeholder="Nilai akhir, misal 150"
              error={finalPoint.trim() !== '' && !finalPointValid}
            />
            <p className="mt-1 text-xs text-ink/55">
              Nilai ini ditambahkan di luar {pointPerStep} poin per pertukaran yang sudah mereka
              dapatkan.
            </p>
          </>
        }
        confirmLabel="Ya, Akhiri"
        loading={finish.isPending}
        onConfirm={() => {
          if (!finalPointValid) return
          finish.mutate(
            { assignmentId: step.assignmentId, point: parsedPoint },
            { onSettled: () => setPending(null) },
          )
        }}
        onCancel={() => setPending(null)}
      />
    </li>
  )
}

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
        Setiap pertukaran yang disetujui bernilai <strong>{poin} poin</strong>. <strong>Tolak</strong>{' '}
        menghentikan rantai kelompok itu, <strong>Akhiri</strong> menutupnya dengan nilai akhir.
      </p>

      <ul className="space-y-4">
        {data.map(step => (
          <BarterCard key={step.id} step={step} pointPerStep={poin} />
        ))}
      </ul>
    </div>
  )
}

'use client'

import RaceShell from '@/components/fragments/RaceShell'
import { AppError } from '@/libs/api'
import { Confirmation, Group } from '@/types/group'
import { areAllPairsConfirmed, buildConfirmedPairSet, isPairConfirmed } from '@/utils/group/confirmation'
import { useConfirmMemberMutation } from '@/hooks/use-group'

interface ConfirmMembersStepProps {
  group: Group
  confirmations: Confirmation[]
  myId: string
}

export default function ConfirmMembersStep({ group, confirmations, myId }: ConfirmMembersStepProps) {
  const { mutate: confirmMember, isPending, error, variables } = useConfirmMemberMutation(group.id)
  const apiError = error as AppError | null
  const confirmedPairs = buildConfirmedPairSet(confirmations)
  const others = group.members.filter(m => m.id !== myId)
  const allConfirmedByMe = others.every(m => isPairConfirmed(confirmedPairs, myId, m.id))
  const allConfirmedInGroup = areAllPairsConfirmed(group.members, confirmations)

  return (
    <RaceShell
      eyebrow="Checkpoint 2 · Konfirmasi"
      title="TEMUKAN TIMMU"
      subtitle="Cari anggota kelompokmu secara fisik, lalu centang saat kalian sudah bertemu."
    >
      <ul className="space-y-3">
        {others.map(member => {
          const confirmed = isPairConfirmed(confirmedPairs, myId, member.id)
          return (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-md border-brut bg-paper px-4 py-3"
            >
              <span className="font-bold text-ink">{member.fullname}</span>
              <button
                type="button"
                disabled={confirmed || (isPending && variables === member.id)}
                onClick={() => confirmMember(member.id)}
                className={`rounded-md border-brut-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wide brutal-press-sm
                  ${confirmed ? 'bg-success text-white' : 'bg-primary text-primary-ink'}`}
              >
                {confirmed ? 'Sudah Ketemu' : 'Tandai Ketemu'}
              </button>
            </li>
          )
        })}
        {others.length === 0 && (
          <li className="rounded-md border-brut bg-paper px-4 py-3 text-sm text-ink/70">
            Kamu masih sendirian di kelompok ini — menunggu anggota lain bergabung.
          </li>
        )}
      </ul>
      {apiError?.message && (
        <p className="mt-3 text-xs font-bold text-danger">{apiError.message}</p>
      )}

      {allConfirmedInGroup && others.length > 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-md border-brut !border-success bg-paper px-4 py-3 text-sm font-bold text-success">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Semua sudah saling konfirmasi! Menuju sesi foto...
        </p>
      )}
      {!allConfirmedInGroup && allConfirmedByMe && others.length > 0 && (
        <p className="mt-4 rounded-md border-brut bg-paper px-4 py-3 text-center text-sm font-bold text-ink/60">
          Kamu sudah konfirmasi semua orang. Menunggu anggota lain saling konfirmasi...
        </p>
      )}
    </RaceShell>
  )
}

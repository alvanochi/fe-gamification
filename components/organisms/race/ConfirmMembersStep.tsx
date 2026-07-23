'use client'

import RaceShell from '@/components/fragments/RaceShell'
import { AppError } from '@/libs/api'
import { Confirmation, Group } from '@/types/group'
import { buildConfirmedPairSet, isPairConfirmed } from '@/utils/group/confirmation'
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
    </RaceShell>
  )
}

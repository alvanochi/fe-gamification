'use client'

import { useState } from 'react'
import RaceShell from '@/components/fragments/RaceShell'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import { AppError } from '@/libs/api'
import { Group, GroupMember, VoteResult } from '@/types/group'
import { useVoteLeaderMutation } from '@/hooks/use-group'

interface VoteLeaderStepProps {
  group: Group
  myId: string
}

export default function VoteLeaderStep({ group, myId }: VoteLeaderStepProps) {
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // Kandidat yang sedang dikonfirmasi — suara tidak bisa ditarik kembali,
  // jadi jangan sampai terkirim karena salah ketuk.
  const [pendingNominee, setPendingNominee] = useState<GroupMember | null>(null)
  const { mutate: vote, isPending, variables } = useVoteLeaderMutation(group.id)
  const candidates = group.members.filter(m => m.id !== myId)

  const handleVote = (nomineeId: string) => {
    setNotice(null)
    vote(nomineeId, {
      onSuccess: response => {
        const result = response.data as VoteResult
        setVotedFor(nomineeId)
        if (result.status === 'NEEDS_REVOTE') {
          setNotice('Hasil voting seri — silakan vote ulang.')
          setVotedFor(null)
        }
      },
      onError: (err: unknown) => {
        const apiError = err as AppError
        setNotice(apiError.message || 'Gagal mengirim suara.')
      },
      onSettled: () => setPendingNominee(null),
    })
  }

  return (
    <RaceShell
      eyebrow="Checkpoint 4 · Voting Ketua"
      title="PILIH KETUA TIM"
      subtitle="Setiap anggota memilih satu nama. Ketua sah jika suara terbanyak tanpa hasil seri."
    >
      <ul className="space-y-3">
        {candidates.map(member => {
          const isSelected = votedFor === member.id
          const isLoadingThis = isPending && variables === member.id
          return (
            <li key={member.id}>
              <button
                type="button"
                disabled={isLoadingThis}
                onClick={() => setPendingNominee(member)}
                className={`flex w-full items-center justify-between rounded-md border-brut px-4 py-3 brutal-press-sm
                  ${isSelected ? 'bg-primary text-primary-ink' : 'bg-paper text-ink'}`}
              >
                <span className="font-bold">{member.fullname}</span>
                {isSelected && <span className="text-xs font-bold uppercase">Pilihanmu</span>}
              </button>
            </li>
          )
        })}
      </ul>

      {votedFor && (
        <p className="mt-4 text-sm font-bold text-ink/70">
          Suaramu tercatat. Menunggu anggota lain menyelesaikan voting…
        </p>
      )}
      {notice && <p className="mt-3 text-xs font-bold text-danger">{notice}</p>}

      <ConfirmModal
        open={!!pendingNominee}
        title="Pilih ketua ini?"
        description={
          <>
            <p>
              Kamu akan memilih <strong>{pendingNominee?.fullname}</strong> sebagai ketua kelompok.
            </p>
            <p className="mt-2">Suara yang sudah dikirim tidak bisa diubah di putaran ini.</p>
          </>
        }
        confirmLabel="Ya, Pilih Dia"
        loading={isPending}
        onConfirm={() => pendingNominee && handleVote(pendingNominee.id)}
        onCancel={() => setPendingNominee(null)}
      />
    </RaceShell>
  )
}

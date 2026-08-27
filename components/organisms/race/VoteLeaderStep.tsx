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

  // Putaran kedua mempersempit pilihan ke calon yang tadi seri di puncak.
  // Mengulang dari seluruh anggota cenderung menghasilkan kebuntuan yang sama.
  const runoff = group.runoffCandidateIds
  const isRunoff = !!runoff?.length
  const candidates = group.members.filter(
    m => m.id !== myId && (!isRunoff || runoff!.includes(m.id)),
  )
  const me = group.members.find(m => m.id === myId)

  const handleVote = (nomineeId: string) => {
    setNotice(null)
    vote(nomineeId, {
      onSuccess: response => {
        const result = response.data as VoteResult
        setVotedFor(nomineeId)
        if (result.status === 'NEEDS_RUNOFF') {
          const names = result.runoffCandidates.map(c => c.fullname).join(' dan ')
          setNotice(`Suara seri antara ${names}. Pilih salah satu dari mereka.`)
          setVotedFor(null)
        } else if (result.status === 'NEEDS_REVOTE') {
          setNotice('Belum ada yang memenuhi syarat — silakan pilih lagi.')
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
      eyebrow={isRunoff ? 'Checkpoint 4 · Putaran Kedua' : 'Checkpoint 4 · Voting Ketua'}
      title="PILIH KETUA TIM"
      subtitle={
        isRunoff
          ? 'Putaran pertama berakhir seri. Pilih satu dari calon yang tersisa.'
          : 'Setiap anggota memilih satu nama. Ketua sah jika suara terbanyak tanpa hasil seri.'
      }
    >
      {/* Namamu sendiri tidak ikut jadi kandidat — kamu tidak bisa memilih
          dirimu sendiri. Ditampilkan di sini supaya tetap jelas kamu masuk
          kelompok ini, sama seperti di checkpoint lain. */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-md border-brut bg-primary/15 px-4 py-2">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-ink">{me?.fullname ?? 'Kamu'}</span>
          {me?.phoneNumber && (
            <span className="block truncate font-mono text-[11px] text-ink/55">
              {me.phoneNumber}
            </span>
          )}
        </span>
        <span className="shrink-0 rounded-sm border-brut-sm bg-primary px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-ink">
          Kamu
        </span>
      </div>

      {isRunoff && candidates.length === 0 && (
        <p className="mb-4 rounded-md border-brut bg-warning/15 px-4 py-3 text-sm text-ink/70">
          Kamu salah satu calon di putaran ini, jadi tidak ikut memilih. Tunggu suara anggota lain.
        </p>
      )}

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
                <span className="min-w-0 text-left">
                  <span className="block truncate font-bold">{member.fullname}</span>
                  {/* Nomor telepon ikut di tiap nama, sama seperti daftar
                      anggota di checkpoint lain — kelompok ini baru saling
                      kenal beberapa menit yang lalu. */}
                  {member.phoneNumber && (
                    <span className="block truncate font-mono text-[11px] opacity-60">
                      {member.phoneNumber}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <span className="shrink-0 text-xs font-bold uppercase">Pilihanmu</span>
                )}
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

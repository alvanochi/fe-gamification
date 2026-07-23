import RaceShell from '@/components/fragments/RaceShell'
import { Group } from '@/types/group'

export default function GroupSuccessScreen({ group }: { group: Group }) {
  return (
    <RaceShell
      eyebrow="Checkpoint 6 · Siap Berangkat"
      title={group.name}
      subtitle="Selamat! Kelompokmu resmi terbentuk. Sampai jumpa di 30 misi Millionaire Race."
    >
      <ul className="space-y-2">
        {group.members.map(member => (
          <li
            key={member.id}
            className="flex items-center justify-between rounded-md border-brut bg-paper px-4 py-3"
          >
            <span className="font-bold text-ink">{member.fullname}</span>
            {member.id === group.leaderId && (
              <span className="rounded-sm border-brut-sm bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-ink">
                Ketua
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-sm text-ink/60">
        Fitur daftar misi &amp; leaderboard live akan segera hadir.
      </p>
    </RaceShell>
  )
}

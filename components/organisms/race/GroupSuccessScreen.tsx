import Link from 'next/link'
import RaceShell from '@/components/fragments/RaceShell'
import Button from '@/components/elements/Button'
import SponsorStrip from '@/components/organisms/SponsorStrip'
import { Group } from '@/types/group'

export default function GroupSuccessScreen({ group }: { group: Group }) {
  return (
    <RaceShell
      eyebrow="Checkpoint 6 · Siap Berangkat"
      title={group.name}
      subtitle="Selamat, kelompok berhasil dibuat. Silakan lanjutkan ke misi-misi kamu."
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

      <Link href="/race/missions">
        <Button size="lg" className="mt-6 w-full">
          Lihat Misi Saya
        </Button>
      </Link>
      <Link href="/leaderboard">
        <Button size="lg" variant="secondary" className="mt-3 w-full">
          Lihat Klasemen
        </Button>
      </Link>

      {/* Boarding pass QR kini dirender BoardingPassPanel di seluruh checkpoint,
          jadi tidak perlu digandakan di sini. */}

      {/* FR-10: sponsor juga tampil di halaman profil kelompok. */}
      <SponsorStrip className="mt-8" title="Mitra & Sponsor" />
    </RaceShell>
  )
}

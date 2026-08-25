import { GroupMember } from '@/types/group'

/**
 * Daftar anggota kelompok, dengan diri sendiri selalu di urutan teratas.
 *
 * Di kelompok berisi enam orang, mencari nama sendiri di tengah daftar adalah
 * hal pertama yang dilakukan peserta di setiap checkpoint — dan yang paling
 * sering membuat mereka ragu apakah dirinya benar-benar sudah masuk kelompok
 * itu. Urutan dan lencana "Kamu" menjawabnya sebelum ditanyakan.
 */
export default function MemberList({
  members,
  myId,
  leaderId,
  className = '',
}: {
  members: GroupMember[]
  myId: string
  leaderId?: string | null
  className?: string
}) {
  const me = members.find(m => m.id === myId)
  const others = members.filter(m => m.id !== myId)
  const ordered = me ? [me, ...others] : members

  return (
    <ul className={`space-y-2 ${className}`}>
      {ordered.map(member => (
        <li
          key={member.id}
          className={`flex items-center justify-between gap-3 rounded-md border-brut px-4 py-3 ${
            member.id === myId ? 'bg-primary/15' : 'bg-paper'
          }`}
        >
          <span className="truncate font-bold text-ink">{member.fullname}</span>

          <span className="flex shrink-0 gap-2">
            {member.id === leaderId && (
              <span className="rounded-sm border-brut-sm bg-secondary px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-secondary-ink">
                Ketua
              </span>
            )}
            {member.id === myId && (
              <span className="rounded-sm border-brut-sm bg-primary px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-ink">
                Kamu
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

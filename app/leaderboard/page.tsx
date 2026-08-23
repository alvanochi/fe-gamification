'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/elements/Button'
import LeaderboardTable from '@/components/organisms/LeaderboardTable'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import { useLeaderboardQuery } from '@/hooks/use-leaderboard'
import { useHasSession, useProfileQuery } from '@/hooks/use-profile'
import { useRealtime } from '@/hooks/use-realtime'

export default function LeaderboardPage() {
  const router = useRouter()
  const { data: rows, isLoading, isFetching, error, refetch, dataUpdatedAt } = useLeaderboardQuery()
  // Endpoint klasemen terbuka, jadi halaman ini tetap bisa dibuka tanpa sesi
  // (mis. dari layar proyektor); profil hanya dipakai untuk menyorot tim sendiri
  // dan hanya diminta bila memang ada token, agar tamu tidak terlempar ke login.
  const { data: profile } = useProfileQuery({ enabled: useHasSession() })
  // Poin masuk lewat siaran realtime, jadi klasemen berubah seketika tanpa
  // menunggu penyegaran berkala.
  useRealtime(null)

  return (
    <div className="min-h-[100dvh] bg-scoreboard px-4 py-10 text-scoreboard-ink sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Klasemen dibuka dari mana-mana — beranda, layar misi, panel panitia.
            Memaksa kembali ke beranda membuang tempat pembaca tadi berada. */}
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
          className="font-mono text-xs uppercase tracking-widest text-primary"
        >
          ← Kembali
        </button>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Mode Pit Stop</p>
            <h1 className="mt-1 font-display text-3xl sm:text-5xl">KLASEMEN</h1>
          </div>

          <Button size="sm" variant="secondary" loading={isFetching} onClick={() => refetch()}>
            Segarkan
          </Button>
        </div>

        <p className="mt-3 text-sm text-scoreboard-ink/60">
          Poin masuk otomatis setiap panitia menyetujui bukti misi, dan papan ini langsung ikut
          berubah saat itu juga.
          {dataUpdatedAt > 0 && (
            <> Terakhir diperbarui {new Date(dataUpdatedAt).toLocaleTimeString('id-ID')}.</>
          )}
        </p>

        <div className="mt-8 rounded-lg border-brut-lg border-primary bg-scoreboard-raised p-4 shadow-brutal-lg sm:p-6">
          {isLoading ? (
            <CardSkeleton />
          ) : error ? (
            <p className="px-2 py-6 text-center text-sm font-bold text-danger">
              Gagal memuat klasemen. Coba segarkan lagi.
            </p>
          ) : (
            <LeaderboardTable rows={rows ?? []} highlightGroupId={profile?.groupId} />
          )}
        </div>
      </div>
    </div>
  )
}

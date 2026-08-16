'use client'

import { useQueryClient } from '@tanstack/react-query'
import RaceShell from '@/components/fragments/RaceShell'
import Button from '@/components/elements/Button'
import RadarSearch from '@/components/elements/RadarSearch'

/**
 * Menunggu dibentukkan kelompok.
 *
 * SRS 5.3: "Sistem mengacak peserta hadir ke kelompok (maks 6). Algoritma acak
 * dijalankan panitia dari dashboard." Peserta tidak membentuk kelompoknya
 * sendiri — sebelumnya tombol di layar ini memanggil auto-group, sehingga
 * kelompok bisa terbentuk dua jalan sekaligus dan hasilnya tidak terkendali.
 */
export default function NoGroupStep() {
  const queryClient = useQueryClient()

  return (
    <RaceShell
      eyebrow="Checkpoint 1 · Kelompok"
      title="MENUNGGU KELOMPOK"
      subtitle="Panitia sedang membagi peserta yang sudah hadir ke dalam kelompok."
    >
      <RadarSearch label="Menunggu panitia membentuk kelompok…" />

      <div className="mt-4 rounded-md border-brut border-dashed bg-paper px-4 py-3 text-sm text-ink/70">
        Kamu tidak perlu melakukan apa pun. Layar ini lanjut sendiri begitu kelompokmu terbentuk.
        Anggota kelompok diacak sistem — kamu tidak bisa memilih sendiri.
      </div>

      <Button
        size="lg"
        variant="secondary"
        className="mt-4 w-full"
        onClick={() => queryClient.invalidateQueries({ queryKey: ['profile'] })}
      >
        Periksa Sekarang
      </Button>
    </RaceShell>
  )
}

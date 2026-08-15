'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { useQueryClient } from '@tanstack/react-query'
import RaceShell from '@/components/fragments/RaceShell'
import { Profile } from '@/types/group'

/**
 * Gerbang kehadiran — halaman penuh, bukan panel yang bisa ditutup.
 *
 * Peserta tidak bisa bergabung ke kelompok maupun membuka misi sebelum panitia
 * memindai boarding pass ini di meja registrasi. Halaman menyegarkan profilnya
 * sendiri sehingga begitu dipindai, peserta langsung lanjut tanpa perlu tahu
 * harus memuat ulang.
 */
export default function CheckInGate({ profile }: { profile: Profile }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!canvasRef.current || !profile.qrToken) return
    QRCode.toCanvas(canvasRef.current, profile.qrToken, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).catch(() => {
      // Gagal menggambar QR tidak boleh mengosongkan halaman; peserta masih
      // bisa dicarikan namanya oleh panitia.
    })
  }, [profile.qrToken])

  // Menanyakan status kehadiran secara berkala. Tanpa ini peserta akan
  // terjebak di layar ini meski sudah dipindai.
  useEffect(() => {
    const timer = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }, 3000)
    return () => clearInterval(timer)
  }, [queryClient])

  return (
    <RaceShell
      eyebrow="Checkpoint 0 · Kehadiran"
      title="BOARDING PASS"
      subtitle="Tunjukkan kode ini kepada panitia di meja registrasi untuk dipindai."
    >
      <div className="flex flex-col items-center">
        <canvas ref={canvasRef} className="rounded-md border-brut bg-white p-2" />

        <p className="mt-6 flex items-center gap-2 text-sm font-bold text-ink/70">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Menunggu dipindai panitia…
        </p>

        <div className="mt-6 w-full rounded-md border-brut border-dashed bg-paper px-4 py-3">
          <p className="text-sm text-ink/70">
            <strong>{profile.fullname}</strong>
          </p>
          <p className="mt-1 text-xs text-ink/50">{profile.email}</p>
        </div>

        <p className="mt-4 text-center text-xs text-ink/50">
          Kamu belum bisa bergabung ke kelompok atau mengerjakan misi sebelum tercatat hadir.
          Halaman ini akan lanjut sendiri begitu panitia memindai.
        </p>
      </div>
    </RaceShell>
  )
}

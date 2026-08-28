'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { useHasSession, useProfileQuery } from '@/hooks/use-profile'
import { postQrPayload } from '@/libs/qr-token'
import { MissionCheckIn } from '@/types/mission'

/**
 * QR pos, menempel di misinya sendiri.
 *
 * Dulu satu QR mengambang dipakai untuk semua pos, dan petugas harus memilih
 * pos yang benar di layarnya sebelum memindai — salah pilih berarti kelompok
 * tercatat di meja yang tidak pernah mereka datangi. Sekarang kode ini memuat
 * posnya sendiri: yang dipindai petugas sudah menyatakan misi apa, milik siapa.
 *
 * Isinya tetap sama sepanjang acara — kode ini hanya digambar ulang, tidak
 * pernah berganti — sehingga peserta bisa menunjukkannya berkali-kali untuk
 * datang maupun pergi.
 */
export default function MissionPostQr({
  missionId,
  checkIn,
}: {
  missionId: string
  checkIn?: MissionCheckIn | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { data: profile } = useProfileQuery({ enabled: useHasSession() })
  const qrToken = profile?.qrToken

  useEffect(() => {
    if (!canvasRef.current || !qrToken) return

    QRCode.toCanvas(canvasRef.current, postQrPayload(missionId, qrToken), {
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).catch(() => {
      // Kegagalan menggambar QR tidak boleh merusak halaman; peserta masih bisa
      // dicatat manual oleh petugas.
    })
  }, [missionId, qrToken])

  if (!qrToken) return null

  const isAtPost = !!checkIn && !checkIn.checkedOutAt
  const isDone = !!checkIn?.checkedOutAt

  if (isDone) {
    return (
      <p className="rounded-md border-brut !border-success bg-paper px-4 py-3 text-sm font-bold text-success">
        Sudah check-out dari pos ini.
      </p>
    )
  }

  return (
    <div className="rounded-md border-brut bg-paper p-4 text-center">
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
        {isAtPost ? 'Tunjukkan lagi untuk check-out' : 'Tunjukkan ke petugas untuk check-in'}
      </p>

      <canvas ref={canvasRef} className="mx-auto mt-3 rounded-sm" />

      <p className="mt-1 font-bold text-ink">{profile?.fullname}</p>
      {profile?.phoneNumber && (
        <p className="font-mono text-xs text-ink/50">{profile.phoneNumber}</p>
      )}

      <p className="mt-3 text-xs text-ink/60">
        {isAtPost
          ? 'Selesaikan misinya, lalu minta petugas memindai kode ini lagi untuk menutup pos.'
          : 'Cukup satu orang dari kelompok yang dipindai — seluruh anggota ikut tercatat.'}
      </p>
    </div>
  )
}

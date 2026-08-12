'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { useHasSession, useProfileQuery } from '@/hooks/use-profile'

/**
 * FR-01 — boarding pass QR milik peserta.
 *
 * Peserta menunjukkan kode ini di lapangan dan panitia memindainya untuk
 * check-in, menggantikan antrean pencatatan manual. Kode digambar di perangkat
 * peserta sendiri; qrToken tidak pernah dikirim ke peserta lain.
 */
export default function ParticipantQrCard({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { data: profile } = useProfileQuery({ enabled: useHasSession() })
  const qrToken = profile?.qrToken

  useEffect(() => {
    if (!canvasRef.current || !qrToken) return

    QRCode.toCanvas(canvasRef.current, qrToken, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).catch(() => {
      // Kegagalan menggambar QR tidak boleh merusak halaman; peserta masih bisa
      // check-in manual lewat panitia.
    })
  }, [qrToken])

  if (!qrToken) return null

  return (
    <div className={`rounded-md border-brut bg-paper p-5 text-center ${className}`}>
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
        Boarding Pass · Tunjukkan ke Panitia
      </p>
      <canvas ref={canvasRef} className="mx-auto mt-3 rounded-sm" />
      <p className="mt-3 text-xs text-ink/55">
        {profile?.checkInAt
          ? `Sudah check-in ${new Date(profile.checkInAt).toLocaleString('id-ID')}`
          : 'Belum check-in — pindai kode ini di meja registrasi.'}
      </p>
    </div>
  )
}

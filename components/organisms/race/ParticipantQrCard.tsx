'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { useHasSession, useProfileQuery } from '@/hooks/use-profile'

/**
 * FR-01 — QR pos milik peserta.
 *
 * Peserta menunjukkan kode ini di setiap pos dan petugas memindainya untuk
 * mencatat kedatangan maupun kepergian, menggantikan antrean pencatatan
 * manual. Kode digambar di perangkat peserta sendiri; qrToken tidak pernah
 * dikirim ke peserta lain.
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

  // Yang berguna dibaca peserta adalah pos terakhir yang dilaporkannya, bukan
  // tanggal lengkap kedatangannya di lokasi acara.
  const lastScan = profile?.lastPostScan

  return (
    <div className={`rounded-md border-brut bg-paper p-5 text-center ${className}`}>
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
        QR POS · Tunjukkan ke Panitia saat check-in dan check-out POS
      </p>
      <canvas ref={canvasRef} className="mx-auto mt-3 rounded-sm" />

      {/* Identitas pemegang kartu: petugas pos mencocokkannya dengan daftar
          peserta bila QR-nya gagal terbaca. */}
      <p className="mt-2 font-bold text-ink">{profile?.fullname}</p>
      {profile?.phoneNumber && (
        <p className="font-mono text-xs text-ink/50">{profile.phoneNumber}</p>
      )}
      <p className="mt-3 text-xs text-ink/55">
        {lastScan
          ? `Sudah ${lastScan.action === 'CHECK_IN' ? 'check-in' : 'check-out'} dari pos ${lastScan.postName}`
          : 'Belum ada catatan pos — tunjukkan kode ini ke petugas saat tiba di pos.'}
      </p>
    </div>
  )
}

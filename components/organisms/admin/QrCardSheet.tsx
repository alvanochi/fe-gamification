'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import Input from '@/components/elements/Input'
import Button from '@/components/elements/Button'
import CardSkeleton from '@/components/skeleton/CardSkeleton'
import { useParticipantQrCardsQuery, type ParticipantQrCard } from '@/hooks/use-qr-cards'
import { useDebounce } from '@/hooks/use-debounce'

/** Satu kartu QR siap gunting. */
function Card({ participant }: { participant: ParticipantQrCard }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const token = participant.qrToken

  useEffect(() => {
    if (!canvasRef.current || !token) return
    QRCode.toCanvas(canvasRef.current, token, {
      width: 150,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).catch(() => {
      // Satu kartu gagal digambar tidak boleh menggagalkan seluruh lembar cetak.
    })
  }, [token])

  return (
    <div className="flex break-inside-avoid flex-col items-center rounded-md border-brut bg-paper px-3 py-4 text-center">
      <p className="font-mono text-[9px] uppercase tracking-widest text-ink/45">
        Millionaire Race
      </p>
      {token ? (
        <canvas ref={canvasRef} className="mt-2" />
      ) : (
        <p className="my-8 text-xs font-bold text-danger">QR belum dibuat</p>
      )}
      <p className="mt-2 w-full truncate text-sm font-bold text-ink">{participant.fullname}</p>
      {participant.businessName && (
        <p className="w-full truncate text-[10px] text-ink/55">{participant.businessName}</p>
      )}
    </div>
  )
}

/**
 * Lembar kartu QR peserta untuk dicetak.
 *
 * Tanpa lembar ini login lewat QR mengunci dirinya sendiri — kode hanya
 * tergambar di layar peserta yang sudah masuk, padahal kode itulah yang
 * dipakai untuk masuk. Panitia mencetak dari sini, menggunting, lalu
 * membagikannya di meja registrasi.
 */
export default function QrCardSheet() {
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const { data, isLoading } = useParticipantQrCardsQuery(debounced.trim())

  const participants = data ?? []
  const withoutToken = participants.filter(p => !p.qrToken).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama, email, atau nomor…"
          className="min-w-56 flex-1"
        />
        <Button variant="secondary" size="sm" onClick={() => window.print()}>
          Cetak {participants.length > 0 && `(${participants.length})`}
        </Button>
      </div>

      <p className="text-xs text-ink/55 print:hidden">
        Kode di kartu ini adalah kunci masuk peserta — perlakukan lembar cetakannya seperti tiket,
        dan jangan sebarkan berkasnya di grup terbuka.
        {withoutToken > 0 && (
          <span className="font-bold text-danger">
            {' '}
            {withoutToken} peserta belum punya QR.
          </span>
        )}
      </p>

      {isLoading ? (
        <CardSkeleton />
      ) : participants.length === 0 ? (
        <p className="rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
          Tidak ada peserta yang cocok.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3">
          {participants.map(p => (
            <Card key={p.id} participant={p} />
          ))}
        </div>
      )}
    </div>
  )
}

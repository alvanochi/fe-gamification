'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import Button from '@/components/elements/Button'
import { qrLoginUrl } from '@/libs/qr-token'
import type { PrintableCard } from '@/hooks/use-accounts'

/** Satu kartu QR siap gunting. */
function Card({ card }: { card: PrintableCard }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    // URL, bukan token telanjang — supaya kamera bawaan ponsel peserta
    // langsung membuka halaman masuknya.
    QRCode.toCanvas(canvasRef.current, qrLoginUrl(card.qrToken), {
      width: 150,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).catch(() => {
      // Satu kartu gagal digambar tidak boleh menggagalkan seluruh lembar.
    })
  }, [card.qrToken])

  return (
    <div className="flex break-inside-avoid flex-col items-center rounded-md border-brut bg-paper px-3 py-4 text-center">
      <p className="font-mono text-[9px] uppercase tracking-widest text-ink/45">MMBC Race</p>
      <canvas ref={canvasRef} className="mt-2" />
      <p className="mt-2 w-full truncate text-sm font-bold text-ink">{card.fullname}</p>
      {card.businessName && (
        <p className="w-full truncate text-[10px] text-ink/55">{card.businessName}</p>
      )}
    </div>
  )
}

/**
 * Lembar kartu QR yang siap dicetak, muncul setelah panitia memilih orangnya.
 *
 * Sengaja hanya hidup selama layar ini terbuka — token tidak disimpan di mana
 * pun, dan hilang begitu lembar ditutup.
 */
export default function QrPrintSheet({
  cards,
  skipped,
  onClose,
}: {
  cards: PrintableCard[]
  skipped: string[]
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-paper p-4 sm:p-8 print:p-0">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h2 className="font-display text-2xl text-ink">{cards.length} Kartu Siap Cetak</h2>
            <p className="mt-1 text-sm text-ink/60">
              Kode di kartu ini adalah kunci masuk peserta — perlakukan cetakannya seperti tiket.
            </p>
            {skipped.length > 0 && (
              <p className="mt-1 text-sm font-bold text-warning">
                {skipped.length} akun panitia dilewati (mereka masuk lewat email &amp; nomor
                telepon): {skipped.join(', ')}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Tutup
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              Cetak
            </Button>
          </div>
        </div>

        {cards.length === 0 ? (
          <p className="mt-8 rounded-md border-brut bg-paper-raised p-6 text-center text-sm text-ink/60">
            Tidak ada peserta di antara yang kamu pilih.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3">
            {cards.map(card => (
              <Card key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'
import Button from '@/components/elements/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-paper px-6 text-center">
      <div className="rounded-lg border-brut-lg bg-paper-raised px-10 py-8 shadow-brutal-lg -rotate-2">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-secondary">
          Checkpoint Hilang
        </p>
        <h1 className="mt-2 font-display text-7xl text-ink">404</h1>
        <p className="mt-3 max-w-xs text-ink/70">
          Rute ini tidak ada di peta Millionaire Race. Ayo balik ke checkpoint utama.
        </p>
      </div>
      <Link href="/">
        <Button variant="primary" size="lg">
          Kembali ke Beranda
        </Button>
      </Link>
    </div>
  )
}

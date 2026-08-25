import Link from 'next/link'

interface AuthCardProps {
  /** Bagian pelengkap; kartu tetap utuh tanpa salah satunya. */
  eyebrow?: string
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function AuthCard({ eyebrow, title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-4 py-12">
      <Link href="/" className="mb-6 font-display text-lg text-ink">
        MILLIONAIRE&nbsp;RACE
      </Link>

      <div className="w-full max-w-lg rounded-lg border-brut-xl bg-paper-raised px-6 py-10 shadow-brutal-lg sm:px-10 ticket-notch-b">
        {eyebrow && (
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">{eyebrow}</p>
        )}
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink/70">{subtitle}</p>}

        <div className="mt-8">{children}</div>

        {footer && (
          <div className="mt-8 border-t-[3px] border-ink/10 pt-6 text-center text-sm text-ink/70">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

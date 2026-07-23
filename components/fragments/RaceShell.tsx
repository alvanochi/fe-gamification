interface RaceShellProps {
  eyebrow: string
  title: string
  subtitle?: string
  children: React.ReactNode
}

export default function RaceShell({ eyebrow, title, subtitle, children }: RaceShellProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-paper px-4 py-12">
      <p className="mb-6 font-display text-lg text-ink">MILLIONAIRE&nbsp;RACE</p>

      <div className="w-full max-w-xl rounded-lg border-brut-xl bg-paper-raised px-6 py-10 shadow-brutal-lg sm:px-10 ticket-notch-b">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink/70">{subtitle}</p>}

        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}

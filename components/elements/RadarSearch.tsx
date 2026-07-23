export default function RadarSearch({ label = 'Mencari kelompokmu di sekitar…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative h-40 w-40">
        {/* radar grid: concentric rings + crosshair, like a map/scanner */}
        <span className="absolute inset-0 rounded-full border-brut-sm border-ink/15" />
        <span className="absolute inset-5 rounded-full border-brut-sm border-ink/15" />
        <span className="absolute inset-10 rounded-full border-brut-sm border-ink/15" />
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-ink/10" />
        <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-ink/10" />

        {/* expanding pulse rings, like a location ping */}
        <span className="absolute inset-0 animate-ping rounded-full border-4 border-secondary/60" />
        <span
          className="absolute inset-0 animate-ping rounded-full border-4 border-primary/60"
          style={{ animationDelay: '0.6s' }}
        />

        {/* rotating radar sweep beam */}
        <span
          className="absolute inset-0 animate-spin rounded-full"
          style={{
            animationDuration: '1.6s',
            background:
              'conic-gradient(from 0deg, transparent 0deg, var(--color-secondary) 20deg, transparent 55deg)',
          }}
        />

        {/* you-are-here pin, dead center */}
        <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-brut-sm bg-primary" />
      </div>
      <p className="mt-4 text-sm font-bold uppercase tracking-wide text-ink/70">{label}</p>
    </div>
  )
}

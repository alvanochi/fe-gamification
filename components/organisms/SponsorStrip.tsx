'use client'

import { useSponsorsQuery } from '@/hooks/use-sponsors'

/**
 * Deretan logo sponsor untuk area non-intrusif (footer, halaman kelompok),
 * sesuai FR-10. Data diambil dari master sponsor, bukan daftar hardcoded.
 */
export default function SponsorStrip({
  title = 'Didukung oleh',
  className = '',
}: {
  title?: string
  className?: string
}) {
  const { data: sponsors } = useSponsorsQuery()

  // Tidak ada sponsor: jangan tampilkan kerangka kosong sama sekali.
  if (!sponsors || sponsors.length === 0) return null

  return (
    <div className={className}>
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
        {title}
      </p>
      <ul className="mt-3 flex flex-wrap items-center justify-center gap-3">
        {sponsors.map(sponsor => {
          const logo = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sponsor.logoUrl}
              alt={sponsor.name}
              title={sponsor.name}
              loading="lazy"
              className="h-10 w-auto max-w-[120px] object-contain"
            />
          )

          return (
            <li
              key={sponsor.id}
              className="flex h-14 items-center rounded-sm border-brut-sm bg-paper-raised px-3"
            >
              {sponsor.linkUrl ? (
                <a href={sponsor.linkUrl} target="_blank" rel="noopener noreferrer sponsored">
                  {logo}
                </a>
              ) : (
                logo
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

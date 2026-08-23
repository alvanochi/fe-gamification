'use client'

import SponsorLogo from '@/components/fragments/SponsorLogo'
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
            // Alas putih supaya logo gelap beralas tembus pandang tetap
            // terbaca di mode gelap.
            <span className="flex h-10 w-auto min-w-16 max-w-[120px] items-center justify-center rounded-sm bg-white px-2">
              <SponsorLogo src={sponsor.logoUrl} name={sponsor.name} className="max-h-8 max-w-full" />
            </span>
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

const STEPS = [
  { title: 'Daftar', desc: 'Isi form pendaftaran & akun sosial media UMKM-mu.' },
  { title: 'Scan QR', desc: 'Check-in di lokasi acara dengan scan QR resmi.' },
  { title: 'Gabung Tim', desc: 'Sistem mengacak kamu ke dalam grup berisi maks. 6 orang.' },
  { title: 'Konfirmasi', desc: 'Temukan & centang anggota timmu satu per satu, real-time.' },
  { title: 'Pilih Ketua', desc: 'Voting ketua tim (min. 3 suara) & beri nama tim kalian.' },
  { title: 'Ragam Misi', desc: 'Tantangan, Bigger Better (barter), & Soal lokasi ber-geofence.' },
  { title: 'Podium', desc: 'Poin terkumpul otomatis — pantau posisimu di leaderboard.' },
]

// Every card sticks at the exact same spot with an increasing z-index, so
// the next one lands directly on top of the last and fully hides it —
// since each card has an opaque background, this is a real, instant cover
// handled entirely by CSS (no scroll-scrubbed opacity to get "ghosty").
const STICKY_TOP = 120

export default function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
          Peta Perjalanan
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-5xl">CARA KERJA RACE-NYA</h2>
      </div>

      <div className="relative mx-auto max-w-xl px-6 pb-24">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="sticky mb-10 flex flex-col items-center rounded-lg border-brut-lg bg-paper-raised px-6 py-8 text-center shadow-brutal-lg sm:px-10"
            style={{ top: STICKY_TOP, zIndex: i }}
          >
            <span
              className="relative -mt-14 mb-4 flex h-12 w-12 items-center justify-center rounded-full
                border-brut-lg bg-primary font-display text-lg text-primary-ink shadow-brutal-sm"
            >
              {i + 1}
            </span>
            <h3 className="font-display text-2xl text-ink sm:text-3xl">{step.title}</h3>
            <p className="mt-2 max-w-sm text-sm text-ink/70 sm:text-base">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

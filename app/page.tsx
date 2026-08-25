import StickyNav from '@/components/organisms/landing/StickyNav'
import HeroSection from '@/components/organisms/landing/HeroSection'
import HowItWorksSection from '@/components/organisms/landing/HowItWorksSection'
// Klasemen disembunyikan dari beranda: papan skor sedang tidak dipamerkan ke
// publik. Seksinya dibiarkan utuh supaya bisa dinyalakan kembali dengan satu
// baris ketika panitia memintanya.
// import LeaderboardTeaserSection from '@/components/organisms/landing/LeaderboardTeaserSection'
import SponsorUmkmMarqueeSection from '@/components/organisms/landing/SponsorUmkmMarqueeSection'
import FooterCtaSection from '@/components/organisms/landing/FooterCtaSection'
import LoginSection from '@/components/organisms/landing/LoginSection'
import InteractiveBackground from '@/components/elements/InteractiveBackground'

export default function Home() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <InteractiveBackground />
      <StickyNav />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        {/* <LeaderboardTeaserSection /> */}
        <SponsorUmkmMarqueeSection />
      </main>
      <FooterCtaSection />
      <LoginSection />
    </div>
  )
}

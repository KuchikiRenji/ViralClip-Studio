import { ViewType } from '../../../types';
import styles from './LandingPage.module.css';
import { Navbar } from './sections/Navbar';
import { HeroSection } from './sections/HeroSection';
import { ViralClipsSection } from './sections/ViralClipsSection';
import { SimpleStepsSection } from './sections/SimpleStepsSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { StatisticsSection } from './sections/StatisticsSection';
import { PricingSection } from './sections/PricingSection';
import { FaqSection } from './sections/FaqSection';
import { CtaSection } from './sections/CtaSection';
import { Footer } from './sections/Footer';
import { LaunchCtaSection } from './sections/LaunchCtaSection';

/**
 * ANTI-SLOP VERIFICATION PROTOCOL
 * 
 * AESTHETIC DECLARATION:
 * - Direction: Technical / Luxury Dark Mode
 * - Density: Controlled, breathable spacing
 * - Signature: Glow orbs and glassmorphism cards
 * - Display Font: Sora (via --type-family-display)
 * - Body Font: Inter (via globals)
 * 
 * VERIFICATION:
 * - Layout: Asymmetrical glow effects, centralized max-width containers
 * - Tokens: All colors and spacings use CSS variables
 * - Typography: Semantic hierarchy with specific display font
 * - Motion: Subtle fade-ins and endless scroll on testimonials
 */

interface LandingPageVibloProps {
  onNavigate: (view: ViewType) => void;
}

export const LandingPageViblo = ({ onNavigate }: LandingPageVibloProps) => {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backgroundEffects} aria-hidden="true">
        <div className={`${styles.glowOrb} ${styles.glowOrb1}`} />
        <div className={`${styles.glowOrb} ${styles.glowOrb2}`} />
        <div className={`${styles.glowOrb} ${styles.glowOrb3}`} />
      </div>

      <Navbar onNavigate={onNavigate} />

      <main className={styles.mainContent}>
        <HeroSection onNavigate={onNavigate} />
        <ViralClipsSection />
        <SimpleStepsSection />
        <TestimonialsSection />
        <StatisticsSection onNavigate={onNavigate} />
        <PricingSection onNavigate={onNavigate} />
        <FaqSection />
        <CtaSection onNavigate={onNavigate} />
      </main>

      <LaunchCtaSection onNavigate={onNavigate} />
      <Footer />
    </div>
  );
};

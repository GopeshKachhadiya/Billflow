import { HeroSection } from "../components/HeroSection";
import { SocialProofStrip } from "../components/home/SocialProofStrip";
import { ProductDemoSection } from "../components/home/ProductDemoSection";
import { FeaturesSection } from "../components/FeaturesSection";
import { HowItWorksPreview } from "../components/home/HowItWorksPreview";
import { StatsBar } from "../components/home/StatsBar";
import { TestimonialsSection } from "../components/TestimonialsSection";
import { PricingSection } from "../components/PricingSection";
import { CTASection } from "../components/CTASection";

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <SocialProofStrip />
      <ProductDemoSection />
      <FeaturesSection />
      <HowItWorksPreview />
      <StatsBar />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </div>
  );
}
export default HomePage;

import { HeroSection } from "../components/HeroSection";
import { SocialProofStrip } from "../components/home/SocialProofStrip";
import { ProblemSolutionSection } from "../components/home/ProblemSolutionSection";
import { FeaturesSection } from "../components/FeaturesSection";
import { HowItWorksPreview } from "../components/home/HowItWorksPreview";
import { ProductDemoSection } from "../components/home/ProductDemoSection";
import { TestimonialsSection } from "../components/TestimonialsSection";
import { StatsBar } from "../components/home/StatsBar";
import { ComparisonSection } from "../components/home/ComparisonSection";
import { PricingSection } from "../components/PricingSection";
import { CTASection } from "../components/CTASection";

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <SocialProofStrip />
      <ProblemSolutionSection />
      <FeaturesSection />
      <HowItWorksPreview />
      <ProductDemoSection />
      <TestimonialsSection />
      <StatsBar />
      <ComparisonSection />
      <PricingSection />
      <CTASection />
    </div>
  );
}
export default HomePage;

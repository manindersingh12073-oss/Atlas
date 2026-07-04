import { redirect } from "next/navigation";

import { AudienceSection } from "@/components/landing/AudienceSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { DemoSpotlight } from "@/components/landing/DemoSpotlight";
import { FaqSection } from "@/components/landing/FaqSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { FounderStorySection } from "@/components/landing/FounderStorySection";
import { Hero } from "@/components/landing/Hero";
import { Nav } from "@/components/landing/Nav";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { ProductTour } from "@/components/landing/ProductTour";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ scrollBehavior: "smooth" }}
    >
      <Nav />
      <Hero />
      <ProblemSection />
      <ProductTour />
      <WorkflowSection />
      <UseCasesSection />
      <FeaturesSection />
      <ComparisonSection />
      <AudienceSection />
      <FounderStorySection />
      <TestimonialsSection />
      <DemoSpotlight />
      <FaqSection />
      <FinalCta />
      <Footer />
    </div>
  );
}

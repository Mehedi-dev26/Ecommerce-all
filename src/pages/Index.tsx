import { lazy, Suspense } from "react";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";

// Below-the-fold sections lazy-loaded for faster initial paint
const FeaturedProducts = lazy(() => import("@/components/FeaturedProducts"));
const WhyChooseUs = lazy(() => import("@/components/WhyChooseUs"));
const LocationSection = lazy(() => import("@/components/LocationSection"));
const CustomerReviews = lazy(() => import("@/components/CustomerReviews"));

const SectionFallback = () => <div className="h-40" aria-hidden="true" />;

const Index = () => (
  <>
    <HeroSection />
    <CategorySection />
    <Suspense fallback={<SectionFallback />}>
      <FeaturedProducts />
    </Suspense>
    <Suspense fallback={<SectionFallback />}>
      <WhyChooseUs />
    </Suspense>
    <Suspense fallback={<SectionFallback />}>
      <LocationSection />
    </Suspense>
    <Suspense fallback={<SectionFallback />}>
      <CustomerReviews />
    </Suspense>
  </>
);

export default Index;

import { lazy, Suspense } from "react";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import SEO from "@/components/SEO";
import { breadcrumb, organizationSchema, websiteSchema } from "@/lib/seo-schemas";

// Below-the-fold sections lazy-loaded for faster initial paint
const FeaturedProducts = lazy(() => import("@/components/FeaturedProducts"));
const WhyChooseUs = lazy(() => import("@/components/WhyChooseUs"));
const LocationSection = lazy(() => import("@/components/LocationSection"));
const CustomerReviews = lazy(() => import("@/components/CustomerReviews"));

const SectionFallback = () => <div className="h-40" aria-hidden="true" />;

const Index = () => (
  <>
    <SEO
      title="Surzo Shop — স্বল্প মূল্যে সেরা পণ্য | ইলেকট্রনিক্স, হোম অ্যাপ্লায়েন্স ও সাইকেল"
      description="Surzo Shop — বাংলাদেশের বিশ্বস্ত অনলাইন শপ। স্মার্টফোন, ল্যাপটপ, টিভি, ফ্রিজ, এসি, সাইকেল ও হোম অ্যাপ্লায়েন্স স্বল্প মূল্যে সেরা মানে। সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি।"
      path="/"
      keywords="Surzo Shop, surzoshop, online shop bangladesh, electronics bd, cycle bd, home appliance, smartphone bangladesh, ফ্রিজ, এসি, সাইকেল, ইলেকট্রনিক্স, সাপাহার"
      jsonLd={[organizationSchema, websiteSchema, breadcrumb([{ name: "হোম", path: "/" }])]}
    />
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


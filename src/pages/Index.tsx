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
      title="Sapahar Mango Shop — সাপাহারের সেরা ও খাঁটি আম সরাসরি বাগান থেকে"
      description="Sapahar Mango Shop — সাপাহারের বিশ্বস্ত আমের অনলাইন শপ। আম্রপালি, হাড়িভাঙা, ফজলি, কাঁঠিমুন আম ১০০% খাঁটি ও রাসায়নিকমুক্ত — সারাদেশে দ্রুত হোম ডেলিভারি।"
      path="/"
      keywords="Sapahar Mango Shop, sapahar mango, সাপাহার আম, আম্রপালি, হাড়িভাঙা, ফজলি, কাঁঠিমুন, naogaon mango, খাঁটি আম, online mango bd"
      jsonLd={[organizationSchema, websiteSchema, breadcrumb([{ name: "হোম", path: "/" }])]}
    />
    <HeroSection />
    <div className="cv-auto"><CategorySection /></div>
    <Suspense fallback={<SectionFallback />}>
      <div className="cv-auto"><FeaturedProducts /></div>
    </Suspense>
    <Suspense fallback={<SectionFallback />}>
      <div className="cv-auto"><WhyChooseUs /></div>
    </Suspense>
    <Suspense fallback={<SectionFallback />}>
      <div className="cv-auto"><LocationSection /></div>
    </Suspense>
    <Suspense fallback={<SectionFallback />}>
      <div className="cv-auto"><CustomerReviews /></div>
    </Suspense>
  </>
);

export default Index;


import { lazy, Suspense } from "react";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import SEO from "@/components/SEO";
import { breadcrumb, organizationSchema, websiteSchema, faqSchema, localBusinessSchema } from "@/lib/seo-schemas";

// Below-the-fold sections lazy-loaded for faster initial paint
const FeaturedProducts = lazy(() => import("@/components/FeaturedProducts"));
const CategoryProductSections = lazy(() => import("@/components/CategoryProductSections"));
const WhyChooseUs = lazy(() => import("@/components/WhyChooseUs"));
const LocationSection = lazy(() => import("@/components/LocationSection"));
const CustomerReviews = lazy(() => import("@/components/CustomerReviews"));

const SectionFallback = () => <div className="h-40" aria-hidden="true" />;

const Index = () => (
  <>
    <SEO
      title="Sapahar Shop — সাপাহারের সেরা ও খাঁটি আম সরাসরি বাগান থেকে"
      description="Sapahar Shop — সাপাহারের বিশ্বস্ত আমের অনলাইন শপ। আম্রপালি, হাড়িভাঙা, ফজলি, কাঁঠিমুন আম ১০০% খাঁটি ও রাসায়নিকমুক্ত — সারাদেশে দ্রুত হোম ডেলিভারি।"
      path="/"
      keywords="Sapahar Shop, sapahar shop, সাপাহার আম, আম্রপালি, হাড়িভাঙা, ফজলি, কাঁঠিমুন, naogaon mango, খাঁটি আম, online mango bd"
      jsonLd={[
        organizationSchema,
        websiteSchema,
        localBusinessSchema,
        breadcrumb([{ name: "হোম", path: "/" }]),
        faqSchema([
          { question: "Sapahar Shop কোথা থেকে আম পাঠায়?", answer: "আমরা সরাসরি নওগাঁর সাপাহার উপজেলার বাগান থেকে আম সংগ্রহ করে সারাদেশে পাঠাই।" },
          { question: "আম কি ১০০% খাঁটি ও রাসায়নিকমুক্ত?", answer: "হ্যাঁ, আমাদের সব আম গাছপাকা, ফরমালিন ও কার্বাইডমুক্ত — সরাসরি বাগান থেকে প্যাক করা হয়।" },
          { question: "ডেলিভারি কতদিনে পাবো?", answer: "ঢাকার ভেতরে ১-২ দিন এবং ঢাকার বাইরে ২-৪ দিনের মধ্যে Pathao কুরিয়ারে পৌঁছে যায়।" },
          { question: "Cash on Delivery (COD) কি আছে?", answer: "হ্যাঁ, সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা আছে। bKash ও Nagad-এও পেমেন্ট করা যাবে।" },
        ]),
      ]}
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


import mangoBanner from "@/assets/mango-banner.jpg";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative w-full overflow-hidden">
      <img
        src={mangoBanner}
        alt="নওগাঁর সাপাহারের দেশি আম"
        className="w-full object-cover h-[280px] sm:h-[420px] lg:h-[520px]"
        width={1920}
        height={720}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-lg">
            <h1 className="mb-2 text-2xl font-bold text-white sm:text-4xl lg:text-5xl leading-tight">
              সাপাহারের <span className="text-accent">দেশি আম</span>
            </h1>
            <p className="mb-1 text-sm text-white/90 sm:text-lg lg:text-xl">
              নওগাঁ জেলার সাপাহার উপজেলার বাগান থেকে সরাসরি আপনার ঘরে
            </p>
            <p className="mb-4 text-xs text-white/70 sm:text-sm">
              ১০০% প্রাকৃতিক, কেমিক্যালমুক্ত, গাছপাকা দেশি আম
            </p>
            <div className="flex gap-3">
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/products">আম অর্ডার করুন <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

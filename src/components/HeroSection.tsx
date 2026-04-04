import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import mawraBanner from "@/assets/mawra-banner.jpg";
import { useState, useEffect } from "react";

const HeroSection = () => {
  const [showText, setShowText] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowText(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="relative">
        <img src={mawraBanner} alt="MAWRA Banner" className="h-[50vh] w-full object-cover object-center sm:h-[55vh] md:h-[65vh] lg:h-[75vh]" />
      </div>

      {/* Text overlay that fades/slides away */}
      <div
        className={`absolute inset-0 flex items-center transition-all duration-700 ease-in-out ${
          showText ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/65 to-transparent" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-lg">
            <p className="mb-1.5 text-xs font-semibold tracking-widest text-secondary uppercase sm:mb-2 sm:text-sm">
              নির্ভেজাল এবং সেরা পণ্য
            </p>
            <h1 className="mb-2 text-2xl font-extrabold leading-tight text-primary-foreground sm:mb-3 sm:text-3xl md:text-4xl lg:text-5xl">
              বাংলাদেশের <span className="text-secondary">খাঁটি স্বাদ</span> আপনার ঘরে
            </h1>
            <p className="mb-4 text-xs text-primary-foreground/85 sm:mb-6 sm:text-sm md:text-base">
              ঐতিহ্যবাহী আচার, খাঁটি সরিষার তেল, মধু, খেজুর — সরাসরি বাংলাদেশ থেকে।
            </p>
            <div className="flex gap-3">
              <Button asChild size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 sm:h-11 sm:px-6 sm:text-sm">
                <Link to="/products">পণ্য দেখুন <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 sm:h-11 sm:px-6 sm:text-sm">
                <Link to="/contact">যোগাযোগ</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

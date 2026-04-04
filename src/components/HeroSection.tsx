import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import mawraBanner from "@/assets/mawra-banner.jpg";

const HeroSection = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0">
      <img src={mawraBanner} alt="MAWRA Banner" className="h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" />
    </div>
    <div className="container relative mx-auto px-4 py-16 sm:py-20 md:py-28 lg:py-36">
      <div className="max-w-lg">
        <p className="mb-2 text-sm font-medium tracking-wider text-secondary sm:text-base">নির্ভেজাল এবং সেরা পণ্য</p>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight text-primary-foreground sm:text-4xl md:text-5xl">
          বাংলাদেশের <span className="text-secondary">খাঁটি স্বাদ</span> আপনার ঘরে
        </h1>
        <p className="mb-6 text-sm text-primary-foreground/85 sm:mb-8 sm:text-base md:text-lg">
          ঐতিহ্যবাহী আচার, খাঁটি সরিষার তেল, মধু, খেজুর এবং আরও অনেক কিছু — সরাসরি বাংলাদেশ থেকে।
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Link to="/products">পণ্য দেখুন <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
            <Link to="/contact">যোগাযোগ করুন</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;

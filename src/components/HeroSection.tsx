import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import mawraBanner from "@/assets/mawra-banner.jpg";

const HeroSection = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0">
      <img src={mawraBanner} alt="MAWRA Banner" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/40" />
    </div>
    <div className="container relative mx-auto px-4 py-24 md:py-36">
      <div className="max-w-xl">
        <h1 className="mb-4 text-4xl font-extrabold leading-tight text-primary-foreground md:text-5xl">
          বাংলাদেশের <span className="text-secondary">খাঁটি স্বাদ</span> আপনার ঘরে
        </h1>
        <p className="mb-8 text-lg text-primary-foreground/90">
          ঐতিহ্যবাহী আচার, খাঁটি সরিষার তেল, মধু, খেজুর এবং আরও অনেক কিছু — সরাসরি বাংলাদেশ থেকে আপনার দোরগোড়ায়।
        </p>
        <div className="flex flex-wrap gap-4">
          <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Link to="/products">পণ্য দেখুন <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
            <Link to="/about">আমাদের সম্পর্কে</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;

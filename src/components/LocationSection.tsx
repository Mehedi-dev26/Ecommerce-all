import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

const SHOP_ADDRESS = "আশুরন্দ বাজার, সাপাহার, নওগাঁ";
// Approximate Sapahar coordinates for embed
const MAP_QUERY = encodeURIComponent("Ashurondo Bazar, Sapahar, Naogaon, Bangladesh");
const MAP_EMBED = `https://www.google.com/maps?q=${MAP_QUERY}&output=embed`;
const MAP_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${MAP_QUERY}`;

const LocationSection = () => (
  <section className="py-12 sm:py-16 bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
          আমাদের <span className="font-brand text-primary text-3xl sm:text-4xl">Location</span>
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">সরাসরি আমাদের শপে এসে দেখে যান</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8 items-stretch">
        {/* Info — left on desktop, top on mobile */}
        <div className="order-1 lg:order-1 lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground sm:text-lg">আমাদের ঠিকানা</h3>
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">{SHOP_ADDRESS}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground sm:text-lg">সময়সূচী</h3>
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">সকাল ৯টা — রাত ১০টা (প্রতিদিন)</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground sm:text-lg">হটলাইন</h3>
                <a href="tel:+8801798268989" className="mt-1 block text-sm text-muted-foreground hover:text-primary sm:text-base">
                  +880 1798-268989
                </a>
              </div>
            </div>
          </div>

          <Button asChild size="lg" className="w-full rounded-xl">
            <a href={MAP_DIRECTIONS} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-4 w-4 mr-2" />
              Direction দেখুন
            </a>
          </Button>
        </div>

        {/* Map — right on desktop, bottom on mobile */}
        <div className="order-2 lg:order-2 lg:col-span-3 rounded-2xl overflow-hidden shadow-lg border border-border bg-card">
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[360px]">
            <iframe
              title="Surzo Shop Location"
              src={MAP_EMBED}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default LocationSection;

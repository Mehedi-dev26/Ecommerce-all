import { Shield, Truck, Leaf, Heart } from "lucide-react";

const features = [
  { icon: Shield, title: "১০০% অরিজিনাল", desc: "সকল পণ্য অফিসিয়াল ওয়ারেন্টি সহ" },
  { icon: Truck, title: "দ্রুত ডেলিভারি", desc: "সারাদেশে দ্রুত হোম ডেলিভারি" },
  { icon: Leaf, title: "সেরা দাম", desc: "বাজারের সবচেয়ে কম্পিটিটিভ দাম" },
  { icon: Heart, title: "২৪/৭ সাপোর্ট", desc: "যেকোনো সমস্যায় আমরা পাশে আছি" },
];

const WhyChooseUs = () => (
  <section className="py-12 sm:py-16">
    <div className="container mx-auto px-4">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">কেন <span className="font-brand text-primary text-3xl sm:text-4xl">Sapahar Shop</span>?</h2>
        <p className="text-sm text-muted-foreground sm:text-base">আপনার পছন্দের পণ্য, সেরা মানে</p>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 sm:gap-6">
        {features.map((f, i) => (
          <div key={i} className="flex flex-col items-center rounded-xl bg-card p-4 text-center shadow-sm sm:p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 sm:mb-4 sm:h-14 sm:w-14">
              <f.icon className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-foreground sm:mb-2 sm:text-base">{f.title}</h3>
            <p className="text-xs text-muted-foreground sm:text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyChooseUs;

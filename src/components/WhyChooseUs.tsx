import { Shield, Truck, Leaf, Heart } from "lucide-react";

const features = [
  { icon: Leaf, title: "১০০% গাছপাকা", desc: "কেমিক্যালমুক্ত প্রাকৃতিক দেশি আম" },
  { icon: Truck, title: "দ্রুত ডেলিভারি", desc: "বাগান থেকে সরাসরি আপনার ঘরে" },
  { icon: Shield, title: "মান নিশ্চিত", desc: "প্রতিটি আম হাতে বাছাই করা" },
  { icon: Heart, title: "গ্রাহক সেবা", desc: "যেকোনো সমস্যায় আমরা পাশে" },
];

const WhyChooseUs = () => (
  <section className="py-12 sm:py-16">
    <div className="container mx-auto px-4">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">কেন <span className="font-brand text-primary text-3xl sm:text-4xl">Mawra</span> আম?</h2>
        <p className="text-sm text-muted-foreground sm:text-base">সাপাহারের সেরা আম, সেরা মানে</p>
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

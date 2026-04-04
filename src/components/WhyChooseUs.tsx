import { Shield, Truck, Leaf, Heart } from "lucide-react";

const features = [
  { icon: Leaf, title: "১০০% খাঁটি", desc: "প্রতিটি পণ্য সম্পূর্ণ প্রাকৃতিক এবং ভেজালমুক্ত" },
  { icon: Truck, title: "দ্রুত ডেলিভারি", desc: "সারা বাংলাদেশে দ্রুত এবং নিরাপদ ডেলিভারি" },
  { icon: Shield, title: "মান নিশ্চিত", desc: "প্রতিটি পণ্যের গুণগত মান আমরা নিশ্চিত করি" },
  { icon: Heart, title: "গ্রাহক সেবা", desc: "যেকোনো সমস্যায় আমরা সবসময় আপনার পাশে" },
];

const WhyChooseUs = () => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      <div className="mb-10 text-center">
        <h2 className="mb-2 text-3xl font-bold text-foreground">কেন আমাদের বেছে নেবেন?</h2>
        <p className="text-muted-foreground">MAWRA-তে আমরা সবসময় সেরা মান নিশ্চিত করি</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <div key={i} className="flex flex-col items-center rounded-xl bg-card p-6 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <f.icon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyChooseUs;

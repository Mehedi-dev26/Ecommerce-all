import { ShieldCheck, Users, Award, Heart, ShoppingBag } from "lucide-react";
import SEO from "@/components/SEO";
import { breadcrumb } from "@/lib/seo-schemas";

const About = () => (
  <div className="container mx-auto px-4 py-10">
    <SEO
      title="আমাদের সম্পর্কে — Sapahar Mango Shop"
      description="Sapahar Mango Shop সম্পর্কে জানুন — সাপাহারের সেরা ও খাঁটি আম (আম্রপালি, হাড়িভাঙা, ফজলি, কাঁঠিমুন) সরাসরি বাগান থেকে আপনার দোরগোড়ায়।"
      path="/about"
      jsonLd={breadcrumb([{ name: "হোম", path: "/" }, { name: "আমাদের সম্পর্কে", path: "/about" }])}
    />
    <div className="mx-auto max-w-3xl text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/30">
        <ShoppingBag className="h-12 w-12 text-primary" strokeWidth={2.2} />
      </div>
      <h1 className="mb-4 text-3xl font-bold text-foreground">
        <span className="font-brand text-4xl text-primary">Sapahar Mango Shop</span> সম্পর্কে
      </h1>
      <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
        Sapahar Mango Shop সাপাহারের একটি বিশ্বস্ত আমের অনলাইন শপ। আমরা সরাসরি সাপাহারের বাগান থেকে সেরা মানের আম্রপালি, হাড়িভাঙা, ফজলি ও কাঁঠিমুন আম সংগ্রহ করে ১০০% খাঁটি ও রাসায়নিকমুক্ত অবস্থায় আপনার দোরগোড়ায় পৌঁছে দিই।
        আমাদের লক্ষ্য — খাঁটি স্বাদ, স্বচ্ছ দাম এবং সারাদেশে দ্রুত নিরাপদ ডেলিভারি।
      </p>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-10">
      {[
        { icon: ShieldCheck, title: "১০০% খাঁটি আম", desc: "সরাসরি বাগান থেকে — কোনো রাসায়নিক নয়" },
        { icon: Users, title: "বিশ্বাসযোগ্য সেবা", desc: "হাজারো সন্তুষ্ট গ্রাহকের ভরসা" },
        { icon: Award, title: "মান নিয়ন্ত্রণ", desc: "প্রতিটি আম বাছাইয়ের পর সুরক্ষিত প্যাকিং" },
        { icon: Heart, title: "গ্রাহক সেবা", desc: "যেকোনো সমস্যায় আমরা আপনার পাশে আছি" },
      ].map((item, i) => (
        <div key={i} className="rounded-xl bg-card p-6 text-center shadow-sm border">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <item.icon className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default About;

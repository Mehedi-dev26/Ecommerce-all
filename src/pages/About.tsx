import { ShieldCheck, Users, Award, Heart, ShoppingBag } from "lucide-react";
import SEO from "@/components/SEO";
import { breadcrumb } from "@/lib/seo-schemas";

const About = () => (
  <div className="container mx-auto px-4 py-10">
    <SEO
      title="আমাদের সম্পর্কে — Surzo Shop"
      description="Surzo Shop সম্পর্কে জানুন। আমরা বাংলাদেশের বিশ্বস্ত অনলাইন শপ — অরিজিনাল ইলেকট্রনিক্স, হোম অ্যাপ্লায়েন্স ও সাইকেল স্বল্প মূল্যে সেরা মানে।"
      path="/about"
      jsonLd={breadcrumb([{ name: "হোম", path: "/" }, { name: "আমাদের সম্পর্কে", path: "/about" }])}
    />
    <div className="mx-auto max-w-3xl text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/30">
        <ShoppingBag className="h-12 w-12 text-primary" strokeWidth={2.2} />
      </div>
      <h1 className="mb-4 text-3xl font-bold text-foreground">
        <span className="font-brand text-4xl text-primary">Surzo Shop</span> সম্পর্কে
      </h1>
      <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
        Surzo Shop বাংলাদেশের একটি নির্ভরযোগ্য অনলাইন শপিং প্ল্যাটফর্ম, যেখানে আপনি পাবেন ইলেকট্রনিক্স, হোম অ্যাপ্লায়েন্স, সাইকেল ও অন্যান্য মানসম্মত পণ্য — সরাসরি অরিজিনাল উৎস থেকে, সেরা দামে।
        আমাদের লক্ষ্য — অরিজিনাল পণ্য, স্বচ্ছ দাম, এবং দ্রুত ডেলিভারি নিশ্চিত করে আপনাকে নিশ্চিন্ত শপিং অভিজ্ঞতা দেওয়া।
      </p>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-10">
      {[
        { icon: ShieldCheck, title: "১০০% অরিজিনাল", desc: "সকল পণ্য অফিসিয়াল ওয়ারেন্টি ও গ্যারান্টি সহ" },
        { icon: Users, title: "বিশ্বাসযোগ্য সেবা", desc: "হাজারো সন্তুষ্ট গ্রাহকের ভরসা" },
        { icon: Award, title: "মান নিয়ন্ত্রণ", desc: "প্রতিটি পণ্য যাচাইয়ের পর প্যাক করা হয়" },
        { icon: Heart, title: "গ্রাহক সেবা", desc: "যেকোনো সমস্যায় ২৪/৭ আমরা পাশে আছি" },
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

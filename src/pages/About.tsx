import { Leaf, Users, Award, Heart } from "lucide-react";
import mawraLogo from "@/assets/mawra-logo.jpg";

const About = () => (
  <div className="container mx-auto px-4 py-10">
    <div className="mx-auto max-w-3xl text-center">
      <img src={mawraLogo} alt="MAWRA" className="mx-auto mb-6 h-24 w-24 rounded-full object-cover shadow-lg" />
      <h1 className="mb-4 text-3xl font-bold text-foreground">MAWRA সম্পর্কে</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        MAWRA বাংলাদেশের ঐতিহ্যবাহী খাঁটি খাদ্যপণ্য সরাসরি আপনার ঘরে পৌঁছে দেওয়ার প্রতিশ্রুতি নিয়ে যাত্রা শুরু করেছে।
        আমরা বিশ্বাস করি প্রতিটি পরিবার খাঁটি ও নিরাপদ খাবার পাওয়ার যোগ্য।
      </p>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-10">
      {[
        { icon: Leaf, title: "১০০% প্রাকৃতিক", desc: "কোনো রাসায়নিক বা প্রিজার্ভেটিভ ছাড়াই তৈরি" },
        { icon: Users, title: "কৃষক বান্ধব", desc: "সরাসরি স্থানীয় কৃষকদের কাছ থেকে সংগ্রহ" },
        { icon: Award, title: "মান নিয়ন্ত্রণ", desc: "প্রতিটি পণ্য কঠোর মান পরীক্ষার মধ্য দিয়ে যায়" },
        { icon: Heart, title: "ভালোবাসায় তৈরি", desc: "ঘরোয়া রেসিপি ও ঐতিহ্যবাহী পদ্ধতিতে তৈরি" },
      ].map((item, i) => (
        <div key={i} className="rounded-xl bg-card p-6 text-center shadow-sm">
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

import { Leaf, Users, Award, Heart } from "lucide-react";
import mangoLogo from "@/assets/mango-logo.png";

const About = () => (
  <div className="container mx-auto px-4 py-10">
    <div className="mx-auto max-w-3xl text-center">
      <img src={mangoLogo} alt="Sapahar Mango" className="mx-auto mb-6 h-24 w-24 rounded-full object-contain bg-white shadow-lg ring-2 ring-primary ring-offset-2" />
      <h1 className="mb-4 text-3xl font-bold text-foreground">Sapahar Mango সম্পর্কে</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Sapahar Mango নওগাঁ জেলার সাপাহার উপজেলার ঐতিহ্যবাহী দেশি আম সরাসরি বাগান থেকে আপনার ঘরে পৌঁছে দেওয়ার প্রতিশ্রুতি নিয়ে যাত্রা শুরু করেছে।
        সাপাহারের উর্বর মাটি ও অনুকূল আবহাওয়ায় জন্মানো এই আম স্বাদে, গন্ধে ও পুষ্টিতে অতুলনীয়।
      </p>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-10">
      {[
        { icon: Leaf, title: "১০০% গাছপাকা", desc: "কোনো কার্বাইড বা কেমিক্যাল ছাড়াই গাছে পাকা আম" },
        { icon: Users, title: "কৃষক বান্ধব", desc: "সরাসরি সাপাহারের চাষীদের কাছ থেকে সংগ্রহ" },
        { icon: Award, title: "মান নিয়ন্ত্রণ", desc: "প্রতিটি আম হাতে বাছাই ও মান পরীক্ষায় উত্তীর্ণ" },
        { icon: Heart, title: "ভালোবাসায় পরিবেশন", desc: "নিরাপদ প্যাকেজিংয়ে তাজা আম আপনার কাছে" },
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

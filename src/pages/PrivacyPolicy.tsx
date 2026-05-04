import { Link } from "react-router-dom";
import { Shield, Lock, Eye, Database, UserCheck, Mail, Phone, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { breadcrumb } from "@/lib/seo-schemas";

const sections = [
  {
    icon: Database,
    title: "আমরা কী তথ্য সংগ্রহ করি",
    body: [
      "অর্ডার ও অ্যাকাউন্ট তৈরির সময়: নাম, মোবাইল নম্বর, ইমেইল, ডেলিভারি ঠিকানা (বিভাগ, জেলা, উপজেলা)।",
      "পেমেন্ট তথ্য: পেমেন্টের পদ্ধতি (ক্যাশ অন ডেলিভারি, bKash, Nagad)। আমরা কোনো কার্ড নম্বর বা পিন সংরক্ষণ করি না।",
      "ব্রাউজিং তথ্য: কুকিজ, ডিভাইস টাইপ, IP ঠিকানা ও Google Analytics-এর মাধ্যমে অ্যানোনিমাস ব্যবহারের তথ্য।",
      "সাপোর্ট চ্যাট ও রিভিউ: আপনার দেওয়া বার্তা, ছবি ও রেটিং।",
    ],
  },
  {
    icon: Eye,
    title: "তথ্য কীভাবে ব্যবহার করি",
    body: [
      "অর্ডার প্রসেস, কুরিয়ার ডেলিভারি ও কাস্টমার সাপোর্ট প্রদানের জন্য।",
      "অ্যাকাউন্ট নিরাপত্তা, ফ্রড প্রতিরোধ ও আইনি বাধ্যবাধকতা পালনের জন্য।",
      "পণ্য, অফার ও আপডেট সম্পর্কে SMS/ইমেইল নোটিফিকেশন পাঠানোর জন্য (আপনি চাইলে আনসাবস্ক্রাইব করতে পারবেন)।",
      "ওয়েবসাইটের পারফরম্যান্স ও ইউজার এক্সপেরিয়েন্স উন্নয়নের জন্য।",
    ],
  },
  {
    icon: UserCheck,
    title: "তথ্য শেয়ারিং",
    body: [
      "আমরা আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি করি না।",
      "শুধুমাত্র ডেলিভারির জন্য Pathao Courier-এর মতো লজিস্টিক পার্টনারের সাথে নাম, ফোন ও ঠিকানা শেয়ার করা হয়।",
      "পেমেন্ট প্রসেসিংয়ের জন্য নির্ভরযোগ্য পেমেন্ট গেটওয়ের সাথে প্রয়োজনীয় তথ্য বিনিময় হয়।",
      "আইন প্রয়োগকারী সংস্থার বৈধ অনুরোধে প্রয়োজনীয় তথ্য প্রদান করা হতে পারে।",
    ],
  },
  {
    icon: Lock,
    title: "ডেটা সুরক্ষা",
    body: [
      "সমস্ত ডেটা SSL/HTTPS এনক্রিপশনের মাধ্যমে ট্রান্সমিট হয়।",
      "Supabase-এর সিকিউর ক্লাউড ইনফ্রাস্ট্রাকচারে Row Level Security (RLS) সহ ডেটা স্টোর করা হয়।",
      "শুধুমাত্র অনুমোদিত অ্যাডমিন প্যানেলের মাধ্যমেই অর্ডার ও কাস্টমার তথ্য অ্যাক্সেস করা যায়।",
      "পাসওয়ার্ড hashed আকারে সংরক্ষিত; প্লেইন টেক্সট কোথাও রাখা হয় না।",
    ],
  },
  {
    icon: Shield,
    title: "আপনার অধিকার",
    body: [
      "যেকোনো সময় আপনার অ্যাকাউন্টের তথ্য দেখতে, সংশোধন বা মুছে ফেলতে পারেন।",
      "মার্কেটিং বার্তা থেকে যেকোনো সময় আনসাবস্ক্রাইব করতে পারেন।",
      "অ্যাকাউন্ট ডিলিট করতে চাইলে আমাদের সাপোর্টে যোগাযোগ করুন — সর্বোচ্চ ৭ কর্মদিবসে প্রক্রিয়া সম্পন্ন হবে।",
      "আপনার অর্ডার ইতিহাস আইনি প্রয়োজন (যেমন অ্যাকাউন্টিং) মেটাতে সংরক্ষিত থাকতে পারে।",
    ],
  },
];

const PrivacyPolicy = () => {
  return (
    <div className="bg-background">
      <SEO
        title="গোপনীয়তা নীতি — Sapahar Mango Shop"
        description="Sapahar Mango Shop কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষা করে — সম্পূর্ণ গোপনীয়তা নীতি পড়ুন।"
        path="/privacy-policy"
        jsonLd={breadcrumb([{ name: "হোম", path: "/" }, { name: "গোপনীয়তা নীতি", path: "/privacy-policy" }])}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5 text-white hover:bg-white/15 hover:text-white">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> হোমে ফিরুন</Link>
          </Button>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-2 ring-white/30 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white sm:text-4xl">গোপনীয়তা নীতি</h1>
            <p className="max-w-2xl text-sm text-white/90 sm:text-base">
              Sapahar Mango Shop আপনার ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষায় প্রতিশ্রুতিবদ্ধ। নিচে আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষা করি তা ব্যাখ্যা করা হলো।
            </p>
            <p className="mt-3 text-xs text-white/70">সর্বশেষ আপডেট: ২৩ এপ্রিল, ২০২৬</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 sm:py-14">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid gap-5 sm:gap-6">
            {sections.map((s, i) => (
              <article
                key={i}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:p-7"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <s.icon className="h-5 w-5 text-primary" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-lg font-bold text-foreground sm:text-xl">{s.title}</h2>
                </div>
                <ul className="space-y-2.5 pl-2">
                  {s.body.map((line, j) => (
                    <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}

            {/* Cookies block */}
            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <FileText className="h-5 w-5 text-primary" strokeWidth={2.5} />
                </div>
                <h2 className="text-lg font-bold text-foreground sm:text-xl">কুকিজ ও থার্ড-পার্টি সার্ভিস</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                আমরা ওয়েবসাইটের কার্যকারিতা ও অ্যানালিটিক্সের জন্য কুকিজ ব্যবহার করি। Google Analytics-এর মাধ্যমে অ্যানোনিমাস ব্যবহারের তথ্য সংগ্রহ করা হয়। আপনি ব্রাউজার সেটিংস থেকে কুকিজ নিষ্ক্রিয় করতে পারেন, তবে এতে সাইটের কিছু ফিচার সঠিকভাবে কাজ নাও করতে পারে।
              </p>
            </article>

            {/* Contact CTA */}
            <article className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5 sm:p-7">
              <h2 className="mb-2 text-lg font-bold text-foreground sm:text-xl">যোগাযোগ</h2>
              <p className="mb-4 text-sm text-muted-foreground sm:text-base">
                গোপনীয়তা সংক্রান্ত যেকোনো প্রশ্ন বা অনুরোধের জন্য আমাদের সাথে যোগাযোগ করুন:
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <a href="tel:+8801720565997" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline sm:text-base">
                  <Phone className="h-4 w-4" /> +880 1720-565997
                </a>
                <a href="mailto:sapaharmangostore@gmail.com" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline sm:text-base">
                  <Mail className="h-4 w-4" /> sapaharmangostore@gmail.com
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;

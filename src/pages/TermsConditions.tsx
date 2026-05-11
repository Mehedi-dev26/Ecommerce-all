import { Link } from "react-router-dom";
import { ScrollText, ShoppingCart, Truck, RotateCcw, CreditCard, AlertTriangle, Scale, Mail, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { breadcrumb } from "@/lib/seo-schemas";

const sections = [
  {
    icon: CheckCircle2,
    title: "শর্তাবলী মেনে নেওয়া",
    body: [
      "Sapahar Shop ব্যবহার করার মাধ্যমে আপনি স্বয়ংক্রিয়ভাবে এই শর্তাবলী মেনে নিচ্ছেন।",
      "আপনার বয়স কমপক্ষে ১৮ বছর হতে হবে অথবা অভিভাবকের অনুমতিক্রমে অর্ডার করতে হবে।",
      "ভুল বা মিথ্যা তথ্য দিয়ে অ্যাকাউন্ট তৈরি করা যাবে না; এমন অ্যাকাউন্ট সাময়িকভাবে বা স্থায়ীভাবে বন্ধ করা হতে পারে।",
    ],
  },
  {
    icon: ShoppingCart,
    title: "অর্ডার ও পণ্য",
    body: [
      "সমস্ত পণ্যের দাম বাংলাদেশী টাকায় (৳) দেখানো হয় এবং VAT/Tax অন্তর্ভুক্ত (যদি প্রযোজ্য হয়)।",
      "পণ্যের ছবি, রঙ ও বিবরণ যথাসম্ভব নির্ভুলভাবে দেখানো হয় — তবে স্ক্রিনের কারণে সামান্য পার্থক্য হতে পারে।",
      "স্টকের অপ্রাপ্যতার কারণে আমরা যেকোনো অর্ডার গ্রহণ না করার অধিকার সংরক্ষণ করি।",
      "অর্ডার নিশ্চিত হওয়ার আগে আমাদের টিম ফোন/SMS-এর মাধ্যমে যাচাই করতে পারে।",
    ],
  },
  {
    icon: CreditCard,
    title: "পেমেন্ট পদ্ধতি",
    body: [
      "ক্যাশ অন ডেলিভারি (COD) — পণ্য হাতে পেয়ে পরিশোধ করুন।",
      "bKash, Nagad ও অন্যান্য মোবাইল ব্যাংকিং অপশন ক্যাশ-ইন বা সেন্ড মানির মাধ্যমে।",
      "অনলাইন পেমেন্ট সম্পূর্ণ এনক্রিপ্টেড গেটওয়ের মাধ্যমে সম্পন্ন হয়।",
      "অগ্রিম পেমেন্টের ক্ষেত্রে অর্ডার বাতিল হলে নির্ধারিত সময়ের মধ্যে রিফান্ড দেওয়া হবে।",
    ],
  },
  {
    icon: Truck,
    title: "ডেলিভারি",
    body: [
      "ঢাকার ভিতরে সাধারণত ১-২ কর্মদিবস; ঢাকার বাইরে ২-৫ কর্মদিবসের মধ্যে ডেলিভারি দেওয়া হয়।",
      "ডেলিভারি চার্জ লোকেশন (বিভাগ > জেলা > উপজেলা) ও পণ্যের ওজনের উপর নির্ভর করে চেকআউটে দেখানো হয়।",
      "কুরিয়ার পার্টনার (যেমন Pathao) থেকে SMS-এর মাধ্যমে ট্র্যাকিং তথ্য পাবেন।",
      "ডেলিভারির সময় গ্রাহক উপস্থিত না থাকলে কুরিয়ার পার্টনারের নীতি অনুযায়ী পুনরায় ডেলিভারি বা রিটার্ন হবে।",
    ],
  },
  {
    icon: RotateCcw,
    title: "রিটার্ন ও রিফান্ড",
    body: [
      "পণ্য পাওয়ার ৭২ ঘণ্টার মধ্যে ক্ষতিগ্রস্ত, ভুল বা ত্রুটিপূর্ণ পণ্যের রিটার্ন রিকোয়েস্ট করতে পারবেন।",
      "রিটার্নের সময় পণ্য আসল প্যাকেজিং, ট্যাগ ও সমস্ত আনুষঙ্গিক সহ থাকতে হবে।",
      "ব্যবহারের কারণে ক্ষতিগ্রস্ত বা পরিবর্তিত পণ্য রিটার্ন গ্রহণযোগ্য নয়।",
      "অনুমোদিত রিফান্ড ৭-১০ কর্মদিবসের মধ্যে মূল পেমেন্ট মাধ্যমে প্রদান করা হবে।",
    ],
  },
  {
    icon: AlertTriangle,
    title: "নিষিদ্ধ ব্যবহার",
    body: [
      "ওয়েবসাইটের কন্টেন্ট, ছবি বা ব্র্যান্ড নাম অনুমতি ছাড়া কপি বা ব্যবহার করা যাবে না।",
      "ফেক অর্ডার, বট, স্ক্র্যাপিং বা সিস্টেমে অননুমোদিত প্রবেশের চেষ্টা কঠোরভাবে নিষিদ্ধ।",
      "অন্য ব্যবহারকারীদের প্রতি অপমানজনক বা অবৈধ আচরণ করলে অ্যাকাউন্ট সাসপেন্ড করা হবে।",
    ],
  },
  {
    icon: Scale,
    title: "দায়বদ্ধতা সীমা",
    body: [
      "Sapahar Shop পণ্যের গুণগতমান ও সঠিক ডেলিভারি নিশ্চিত করতে সর্বদা সচেষ্ট।",
      "তবে অপ্রত্যাশিত পরিস্থিতি (প্রাকৃতিক দুর্যোগ, ধর্মঘট, কুরিয়ার বিলম্ব) এর জন্য আমরা সরাসরি দায়ী নই।",
      "আমাদের সর্বোচ্চ দায় কোনো অর্ডারের মোট মূল্যের সমান।",
      "এই শর্তাবলী বাংলাদেশের প্রচলিত আইন দ্বারা পরিচালিত হবে এবং বিরোধ নওগাঁ আদালতের এখতিয়ারভুক্ত।",
    ],
  },
];

const TermsConditions = () => {
  return (
    <div className="bg-background">
      <SEO
        title="শর্তাবলী — Sapahar Shop"
        description="Sapahar Shop ব্যবহারের শর্তাবলী, অর্ডার ও পেমেন্ট নিয়ম, ডেলিভারি ও রিটার্ন পলিসি — সম্পূর্ণ শর্তগুলো পড়ুন।"
        path="/terms-conditions"
        jsonLd={breadcrumb([{ name: "হোম", path: "/" }, { name: "শর্তাবলী", path: "/terms-conditions" }])}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5 text-white hover:bg-white/15 hover:text-white">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> হোমে ফিরুন</Link>
          </Button>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-2 ring-white/30 backdrop-blur-sm">
              <ScrollText className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white sm:text-4xl">শর্তাবলী</h1>
            <p className="max-w-2xl text-sm text-white/90 sm:text-base">
              Sapahar Shop ব্যবহারের আগে অনুগ্রহ করে নিচের শর্তাবলী মনোযোগ দিয়ে পড়ুন। আমাদের সাইট ব্যবহার বা অর্ডার করার মাধ্যমে আপনি এই শর্তগুলো মেনে নিচ্ছেন।
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
                  <h2 className="text-lg font-bold text-foreground sm:text-xl">
                    <span className="mr-2 text-primary">{String(i + 1).padStart(2, "0")}.</span>
                    {s.title}
                  </h2>
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

            {/* Contact CTA */}
            <article className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5 sm:p-7">
              <h2 className="mb-2 text-lg font-bold text-foreground sm:text-xl">প্রশ্ন বা মতামত</h2>
              <p className="mb-4 text-sm text-muted-foreground sm:text-base">
                শর্তাবলী সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন:
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

export default TermsConditions;

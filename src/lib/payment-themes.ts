// Provider-specific theme definitions for the multi-step payment flow.

export type PaymentProvider = "bkash" | "nagad" | "rocket";

export interface PaymentInstruction {
  step: string;
  hint?: string;
}

export interface PaymentTheme {
  id: PaymentProvider;
  name: string;
  nameBn: string;
  brand: string;
  brandDark: string;
  onBrand: string;
  accent: string;
  /** Soft tint used as backdrop on selection card */
  tint: string;
  /** USSD dial code for non-smartphone users */
  ussd: string;
  /** App-based step-by-step instructions (Bengali) */
  appSteps: PaymentInstruction[];
  /** USSD/dial-code instructions for feature phones */
  ussdSteps: PaymentInstruction[];
  /** Short tagline shown on selector */
  tagline: string;
}

export const PAYMENT_THEMES: Record<PaymentProvider, PaymentTheme> = {
  bkash: {
    id: "bkash",
    name: "bKash",
    nameBn: "বিকাশ",
    brand: "#E2136E",
    brandDark: "#B30E58",
    onBrand: "#FFFFFF",
    accent: "ring-pink-500",
    tint: "#FCE7F1",
    ussd: "*247#",
    tagline: "দ্রুত ও নিরাপদ",
    appSteps: [
      { step: "বিকাশ অ্যাপ খুলে \"Send Money\" নির্বাচন করুন", hint: "Pay Bill নয়, Send Money বেছে নিন" },
      { step: "উপরের Personal নম্বরটি কপি করে পেস্ট করুন" },
      { step: "নির্দিষ্ট টাকার পরিমাণ লিখুন", hint: "নিচে দেওয়া amount-ই পাঠাবেন" },
      { step: "Reference এ আপনার Invoice ID লিখুন (ঐচ্ছিক)" },
      { step: "PIN দিয়ে Send Money সম্পন্ন করুন" },
      { step: "Confirmation SMS এর TrxID টি কপি করে নিচে দিন" },
    ],
    ussdSteps: [
      { step: "ডায়াল করুন *247#" },
      { step: "1 চাপুন → Send Money" },
      { step: "উপরের Personal নম্বরটি লিখুন" },
      { step: "Amount দিন এবং Reference এ Invoice ID দিন" },
      { step: "PIN দিয়ে confirm করুন এবং SMS এর TrxID copy করুন" },
    ],
  },
  nagad: {
    id: "nagad",
    name: "Nagad",
    nameBn: "নগদ",
    brand: "#EE7F25",
    brandDark: "#C9651A",
    onBrand: "#FFFFFF",
    accent: "ring-orange-500",
    tint: "#FFF1E3",
    ussd: "*167#",
    tagline: "ঝামেলাবিহীন পেমেন্ট",
    appSteps: [
      { step: "নগদ অ্যাপ খুলে \"Send Money\" নির্বাচন করুন" },
      { step: "উপরের Personal নম্বরটি কপি করে পেস্ট করুন" },
      { step: "নির্দিষ্ট টাকার পরিমাণ লিখুন" },
      { step: "Reference এ Invoice ID দিন (ঐচ্ছিক)" },
      { step: "PIN দিয়ে Send Money সম্পন্ন করুন" },
      { step: "SMS এ আসা TxnID কপি করে নিচে দিন" },
    ],
    ussdSteps: [
      { step: "ডায়াল করুন *167#" },
      { step: "1 চাপুন → Send Money" },
      { step: "উপরের Personal নম্বরটি লিখুন" },
      { step: "Amount এবং Reference দিন" },
      { step: "PIN দিয়ে confirm করুন এবং TxnID সংগ্রহ করুন" },
    ],
  },
  rocket: {
    id: "rocket",
    name: "Rocket",
    nameBn: "রকেট",
    brand: "#8C3494",
    brandDark: "#6E2873",
    onBrand: "#FFFFFF",
    accent: "ring-purple-500",
    tint: "#F1E6F3",
    ussd: "*322#",
    tagline: "DBBL Mobile Banking",
    appSteps: [
      { step: "Rocket অ্যাপ খুলে \"Send Money\" নির্বাচন করুন" },
      { step: "উপরের Personal নম্বরটি দিন (শেষে চেক ডিজিট সহ)" },
      { step: "Amount এবং Reference (Invoice ID) দিন" },
      { step: "PIN দিয়ে Send Money complete করুন" },
      { step: "TrxID টি SMS থেকে কপি করে নিচে দিন" },
    ],
    ussdSteps: [
      { step: "ডায়াল করুন *322#" },
      { step: "1 চাপুন → Send Money" },
      { step: "উপরের Personal নম্বর লিখুন" },
      { step: "Amount এবং Reference দিন" },
      { step: "PIN দিয়ে confirm করুন → SMS এর TrxID সংগ্রহ করুন" },
    ],
  },
};

export const PROVIDERS_ORDER: PaymentProvider[] = ["bkash", "nagad", "rocket"];

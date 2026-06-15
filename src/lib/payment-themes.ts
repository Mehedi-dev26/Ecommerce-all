// Provider-specific theme definitions for the multi-step payment flow.
// Used by /payment/:orderId/* pages to render bKash/Nagad/Rocket in their
// official brand colors (mimicking the ZiniPay-style flow from the design refs).

export type PaymentProvider = "bkash" | "nagad" | "rocket";

export interface PaymentTheme {
  id: PaymentProvider;
  name: string;
  nameBn: string;
  /** Solid brand color (used as page background on themed pages) */
  brand: string;
  /** Slightly darker brand for buttons / dark accents */
  brandDark: string;
  /** Color for text rendered on top of the brand background */
  onBrand: string;
  /** Tailwind ring/border accent for selection state on the picker */
  accent: string;
  instructions: string[];
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
    instructions: [
      "উপরের মার্চেন্ট অ্যাকাউন্ট নম্বরটি কপি করুন",
      "বিকাশ অ্যাপ খুলুন এবং \"সেন্ড মানি\" নির্বাচন করুন",
      "অ্যাকাউন্ট নম্বর পেস্ট করুন এবং নির্ধারিত পরিমাণ পাঠিয়ে দিন",
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
    instructions: [
      "উপরের মার্চেন্ট অ্যাকাউন্ট নম্বরটি কপি করুন",
      "নগদ অ্যাপ খুলুন এবং \"সেন্ড মানি\" নির্বাচন করুন",
      "অ্যাকাউন্ট নম্বর পেস্ট করুন এবং নির্ধারিত পরিমাণ পাঠিয়ে দিন",
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
    instructions: [
      "উপরের মার্চেন্ট অ্যাকাউন্ট নম্বরটি কপি করুন",
      "রকেট অ্যাপ খুলুন এবং \"সেন্ড মানি\" নির্বাচন করুন",
      "অ্যাকাউন্ট নম্বর পেস্ট করুন এবং নির্ধারিত পরিমাণ পাঠিয়ে দিন",
    ],
  },
};

export const PROVIDERS_ORDER: PaymentProvider[] = ["bkash", "nagad", "rocket"];

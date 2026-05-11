// Reusable schema.org JSON-LD builders for SEO.
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from "@/components/SEO";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: SITE_NAME,
  alternateName: [
    "Sapahar Shop",
    "sapaharmango",
    "Sapahar Shop Store",
    "সাপাহার ম্যাঙ্গো",
    "সাপাহার আম",
    "সাপাহারের আম",
  ],
  legalName: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand-logo.png`,
  image: DEFAULT_OG_IMAGE,
  description:
    "Sapahar Shop — সাপাহারের সেরা ও খাঁটি আম (আম্রপালি, হাড়িভাঙা, ফজলি, কাঁঠিমুন) সরাসরি বাগান থেকে সারাদেশে দ্রুত ডেলিভারি।",
  telephone: "+880 1720-565997",
  email: "sapaharmangostore@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "সাপাহার বাজার",
    addressLocality: "সাপাহার",
    addressRegion: "নওগাঁ",
    addressCountry: "BD",
  },
  sameAs: [
    "https://www.facebook.com/profile.php?id=61589209802561",
  ],
  areaServed: "BD",
  currenciesAccepted: "BDT",
  paymentAccepted: "Cash on Delivery, bKash, Nagad",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "120",
    bestRating: "5",
    worstRating: "1",
  },
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: [
    "Sapahar Shop",
    "sapaharmango",
    "Sapahar Shop Store",
    "সাপাহার ম্যাঙ্গো",
    "সাপাহার আম",
    "sapaharama.pro.bd",
  ],
  url: SITE_URL,
  inLanguage: "bn-BD",
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/brand-logo.png`,
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const breadcrumb = (items: Array<{ name: string; path: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: it.name,
    item: `${SITE_URL}${it.path === "/" ? "" : it.path}`,
  })),
});

export const faqSchema = (items: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((it) => ({
    "@type": "Question",
    name: it.question,
    acceptedAnswer: { "@type": "Answer", text: it.answer },
  })),
});

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#localbusiness`,
  name: SITE_NAME,
  image: `${SITE_URL}/brand-logo.png`,
  url: SITE_URL,
  telephone: "+880 1720-565997",
  priceRange: "৳৳",
  address: {
    "@type": "PostalAddress",
    streetAddress: "সাপাহার বাজার",
    addressLocality: "সাপাহার",
    addressRegion: "নওগাঁ",
    addressCountry: "BD",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 25.1446,
    longitude: 88.6097,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "22:00",
    },
  ],
  areaServed: { "@type": "Country", name: "Bangladesh" },
};

export const productSchema = (p: {
  id: string;
  name: string;
  name_bn?: string | null;
  description?: string | null;
  description_bn?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  price: number;
  compare_price?: number | null;
  stock: number;
  category_name?: string | null;
  rating?: number;
  reviewCount?: number;
}) => {
  const url = `${SITE_URL}/products/${p.id}`;
  const imgs = (p.images && p.images.length ? p.images : [p.image_url].filter(Boolean)) as string[];
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name_bn || p.name,
    alternateName: p.name,
    description: p.description_bn || p.description || `${p.name_bn || p.name} — Sapahar Shop থেকে অর্ডার করুন।`,
    image: imgs.length ? imgs : [DEFAULT_OG_IMAGE],
    sku: p.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: p.category_name || undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BDT",
      price: p.price,
      availability:
        p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
  if (p.rating && p.reviewCount && p.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: p.rating.toFixed(1),
      reviewCount: p.reviewCount,
    };
  }
  return schema;
};

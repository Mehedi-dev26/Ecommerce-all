// Reusable schema.org JSON-LD builders for SEO.
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from "@/components/SEO";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: SITE_NAME,
  alternateName: [
    "surzoshop",
    "SurzoShop",
    "Surzoshop",
    "surzo shop",
    "Surzo",
    "সূর্য শপ",
    "সুরজো শপ",
  ],
  legalName: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand-logo.png`,
  image: DEFAULT_OG_IMAGE,
  description:
    "Surzo Shop (surzoshop) — বাংলাদেশের বিশ্বস্ত অনলাইন শপ। ইলেকট্রনিক্স, হোম অ্যাপ্লায়েন্স ও সাইকেল স্বল্প মূল্যে সেরা মানে।",
  telephone: "+880 1779-80168",
  email: "surzoshop@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "আশুরন্দ বাজার",
    addressLocality: "সাপাহার",
    addressRegion: "নওগাঁ",
    addressCountry: "BD",
  },
  sameAs: [
    "https://www.facebook.com/surzoshop",
    "https://www.instagram.com/surzoshop",
    "https://www.youtube.com/@surzoshop",
  ],
  areaServed: "BD",
  currenciesAccepted: "BDT",
  paymentAccepted: "Cash on Delivery, bKash, Nagad",
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: ["Surzo Shop", "SurzoShop", "সূর্য শপ", "surzoshop"],
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
    description: p.description_bn || p.description || `${p.name_bn || p.name} — Surzo Shop থেকে অর্ডার করুন।`,
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

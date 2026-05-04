import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://sapaharama.pro.bd";
export const SITE_NAME = "Sapahar Mango Shop";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-cover.jpg`;

interface SEOProps {
  title: string;
  description: string;
  /** Path-only canonical, e.g. "/products". Defaults to current route. */
  path?: string;
  image?: string;
  type?: "website" | "article" | "product";
  /** Comma-separated keywords. Optional — engines mostly ignore but harmless. */
  keywords?: string;
  /** Mark page as noindex (e.g. cart/checkout). */
  noindex?: boolean;
  /** Extra JSON-LD blocks. Each must be a valid schema.org object. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SEO = ({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  keywords,
  noindex = false,
  jsonLd,
}: SEOProps) => {
  const cleanPath = path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const canonical = `${SITE_URL}${cleanPath === "/" ? "" : cleanPath}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <html lang="bn" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="bn_BD" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(b)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;

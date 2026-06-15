// Helper to build SEO-friendly product URLs.
// New format: /products/{vendor-slug}/{serial-number}
// Legacy fallback: /products/{uuid}

export interface ProductUrlInput {
  id: string;
  serial_number?: number | null;
  vendor_shop_slug?: string | null;
}

export const getProductUrl = (p: ProductUrlInput): string => {
  if (p.vendor_shop_slug && p.serial_number) {
    // Encode the slug so Bengali / Unicode characters survive routing safely.
    return `/products/${encodeURIComponent(p.vendor_shop_slug)}/${p.serial_number}`;
  }
  return `/products/${p.id}`;
};

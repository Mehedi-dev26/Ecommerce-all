// Helpers for vendor contact (WhatsApp + Phone) — falls back to main shop.

export const cleanPhone = (raw?: string | null): string => {
  if (!raw) return "";
  const digits = raw.replace(/[^\d+]/g, "");
  // For wa.me we need digits with country code, no '+'
  if (digits.startsWith("+")) return digits.slice(1);
  // Bangladesh local 01XXXXXXXXX -> 8801XXXXXXXXX
  if (digits.startsWith("0")) return `88${digits}`;
  return digits;
};

export const buildWhatsAppUrl = (phone: string, message: string): string => {
  const num = cleanPhone(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
};

export const buildTelUrl = (phone: string): string => {
  const num = (phone || "").replace(/[^\d+]/g, "");
  return `tel:${num.startsWith("+") ? num : num.startsWith("0") ? `+88${num}` : `+${num}`}`;
};

export interface ProductWaPayload {
  name_bn: string;
  price: number;
  weight?: string | number | null;
  productUrl: string;
  imageUrl?: string | null;
  shopName?: string | null;
}

export const buildProductWhatsAppMessage = (p: ProductWaPayload): string => {
  const lines = [
    `আসসালামু আলাইকুম${p.shopName ? `, ${p.shopName}` : ""} 🌿`,
    "",
    `আমি এই পণ্যটি সম্পর্কে জানতে চাচ্ছি:`,
    "",
    `🛒 পণ্য: ${p.name_bn}`,
    `💰 মূল্য: ৳${Number(p.price).toLocaleString("en-BD")}${p.weight ? ` / ${p.weight}` : ""}`,
    `🔗 লিংক: ${p.productUrl}`,
  ];
  if (p.imageUrl) lines.push("", `📸 ছবি: ${p.imageUrl}`);
  lines.push("", "অনুগ্রহ করে বিস্তারিত জানাবেন। ধন্যবাদ!");
  return lines.join("\n");
};

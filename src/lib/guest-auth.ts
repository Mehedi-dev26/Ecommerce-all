const GUEST_EMAIL_DOMAIN = "example.com";
const VENDOR_EMAIL_DOMAIN = "sapaharshop.com";

export const normalizeGuestPhone = (phone: string) => phone.replace(/\D/g, "");

export const getGuestAuthEmail = (phone: string) =>
  `customer.${normalizeGuestPhone(phone)}@${GUEST_EMAIL_DOMAIN}`;

export const getVendorAuthEmail = (phone: string) =>
  `vendor.${normalizeGuestPhone(phone)}@${VENDOR_EMAIL_DOMAIN}`;

export const getGuestAuthEmailCandidates = (phone: string) => {
  const normalizedPhone = normalizeGuestPhone(phone);

  return Array.from(
    new Set([
      `customer.${normalizedPhone}@${GUEST_EMAIL_DOMAIN}`,
      `${normalizedPhone}@sapahar-customer.local`,
      `sapahar.customer.${normalizedPhone}@gmail.com`,
      `customer.${normalizedPhone}@sapaharmango.com`,
      // Legacy aliases — kept so previously created guest accounts can still sign in
      `customer.${normalizedPhone}@surzoshop.com`,
      `${normalizedPhone}@surzoshop-customer.local`,
      `surzoshop.customer.${normalizedPhone}@gmail.com`,
    ]),
  );
};

export const getPhoneAuthEmailCandidates = (phone: string) => {
  const normalizedPhone = normalizeGuestPhone(phone);

  return Array.from(
    new Set([
      getVendorAuthEmail(normalizedPhone),
      ...getGuestAuthEmailCandidates(normalizedPhone),
    ]),
  );
};

export const getGuestAuthPassword = (pin: string) => `guest-pin-${pin}`;

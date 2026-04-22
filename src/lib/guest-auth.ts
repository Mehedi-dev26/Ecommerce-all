const GUEST_EMAIL_DOMAIN = "example.com";

export const normalizeGuestPhone = (phone: string) => phone.replace(/\D/g, "");

export const getGuestAuthEmail = (phone: string) =>
  `customer.${normalizeGuestPhone(phone)}@${GUEST_EMAIL_DOMAIN}`;

export const getGuestAuthPassword = (pin: string) => `guest-pin-${pin}`;

// Public office contact shown on the landing. Real channels from the firm's
// site; overridable per environment, never hardcoded in components.
export const SITE_CONTACT = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '(65) 3358-4126',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contato@caseadmjudicial.com.br',
  address:
    process.env.NEXT_PUBLIC_CONTACT_ADDRESS ??
    'Av. Dr. Hélio Ribeiro, 525 — Ed. Helbor Dual Business, Sala 209-214, Alvorada, Cuiabá/MT',
} as const;

export const MAPS_SEARCH_URL = `https://www.google.com/maps/search/${encodeURIComponent(SITE_CONTACT.address)}`;

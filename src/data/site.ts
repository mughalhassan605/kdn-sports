// Brand facts. Anything marked PLACEHOLDER has to come from KDN before launch.

export const site = {
  /** Shown name (decided 2026-10-06: "KDN Production", matching the domain; the old Pic-Time gallery still says "Kdnsports"). */
  name: "KDN Production",
  /** Wordmark parts (bold word, small word). Change both here to rebrand the header and footer. */
  wordmark: ["KDN", "Production"] as const,
  /** Planned domain (not registered yet as of 2026-10-06). */
  domain: "kdnproduction.de",
  url: "https://kdnproduction.de",
  /** PLACEHOLDER mailbox on the planned domain. */
  email: "hallo@kdnproduction.de",
  /** PLACEHOLDER social handles. */
  instagram: "https://www.instagram.com/",
  youtube: "https://www.youtube.com/",
  /** The newest gallery: chip in the hero, landing of the flight. PLACEHOLDER event until real galleries exist. */
  featuredEvent: "fight-night",
  heroMedia: "fn-001",
  payments: ["PayPal", "Klarna", "Visa", "Mastercard", "Apple Pay", "Google Pay"],
};

/** Payment methods offered at checkout (ids match dict.checkout.methods). */
export const paymentMethods = ["paypal", "klarna", "card", "applepay", "googlepay"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

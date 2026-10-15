export const SITE_NAME = "Lavena Saboaria Artesanal";
export const SITE_TAGLINE = "Sinta a pureza. Viva Lavena.";
export const SITE_DESCRIPTION =
  "Sabonetes, sabonetes líquidos, geleias e mousses de banho artesanais, feitos à mão com ingredientes selecionados e aromas delicados. Beleza que vem da natureza, para você.";

export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const FALLBACK_SETTINGS = {
  whatsappNumber: null,
  instagramUrl: null,
  announcement: null,
  deliveryInfo: null,
  heroSlides: [{ src: "/images/logo-lavena.png", href: "" }],
  siteTheme: "padrao",
  giftImage: null,
};

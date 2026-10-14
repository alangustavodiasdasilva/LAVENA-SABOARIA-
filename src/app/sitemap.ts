import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/loja`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/presente`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
  try {
    const [products, kits] = await Promise.all([
      prisma.product.findMany({ where: { isVisible: true }, select: { slug: true, updatedAt: true } }),
      prisma.kit.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ]);
    products.forEach((p) =>
      entries.push({ url: `${SITE_URL}/produto/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.8 })
    );
    kits.forEach((k) =>
      entries.push({ url: `${SITE_URL}/kit/${k.slug}`, lastModified: k.updatedAt, changeFrequency: "weekly", priority: 0.7 })
    );
  } catch (e) {
    console.error("[sitemap] banco indisponível, usando só as páginas fixas:", e);
  }
  return entries;
}

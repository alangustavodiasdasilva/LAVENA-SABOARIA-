import "server-only";
import { cache } from "react";
import prisma from "./prisma";
import { cached } from "./store-cache";
import { mapBag, mapKit, mapProduct } from "./mappers";
import type { Catalog, OrderLineInput } from "./orders";
import type { BagDTO, CategoryDTO, KitDTO, ProductDTO, PublicSettings } from "./types";

/**
 * Leituras públicas da loja. Lançam erro se o banco falhar; as páginas usam `safe()`
 * para mostrar um estado de indisponibilidade em vez de quebrar.
 */

export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<{ data: T; failed: boolean }> {
  try {
    return { data: await fn(), failed: false };
  } catch (e) {
    console.error("[data] falha ao consultar o banco:", e);
    return { data: fallback, failed: true };
  }
}

const productInclude = { category: true, variants: true } as const;

/** Produtos visíveis: destaques primeiro, depois os mais novos. */
export async function getStoreProducts(): Promise<ProductDTO[]> {
  return cached(["products"], async () => {
    const rows = await prisma.product.findMany({
      where: { isVisible: true },
      include: productInclude,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(mapProduct);
  });
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  return cached(["product", slug], async () => {
    const row = await prisma.product.findFirst({
      where: { slug, isVisible: true },
      include: productInclude,
    });
    return row ? mapProduct(row) : null;
  });
}

export async function getProductById(id: string): Promise<ProductDTO | null> {
  const row = await prisma.product.findFirst({ where: { id, isVisible: true }, include: productInclude });
  return row ? mapProduct(row) : null;
}

/** Categorias que têm pelo menos um produto visível, com a contagem. */
export async function getStoreCategories(): Promise<(CategoryDTO & { count: number })[]> {
  return cached(["categories"], async () => {
    const rows = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { products: { where: { isVisible: true } } } } },
    });
    return rows
      .filter((c) => c._count.products > 0)
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: c._count.products }));
  });
}

export async function getStoreKits(): Promise<KitDTO[]> {
  return cached(["kits"], async () => {
    const rows = await prisma.kit.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(mapKit);
  });
}

export async function getKitBySlug(slug: string): Promise<KitDTO | null> {
  return cached(["kit", slug], async () => {
    const row = await prisma.kit.findFirst({ where: { slug, isActive: true } });
    return row ? mapKit(row) : null;
  });
}

export async function getKitById(id: string): Promise<KitDTO | null> {
  const row = await prisma.kit.findFirst({ where: { id, isActive: true } });
  return row ? mapKit(row) : null;
}

export async function getStoreBags(): Promise<BagDTO[]> {
  return cached(["bags"], async () => {
    const rows = await prisma.bag.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
    return rows.map(mapBag);
  });
}

const DEFAULT_HERO = "/images/logo-lavena.png";

export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  const s = await cached(["settings"], async () => {
    const row = await prisma.settings.findUnique({ where: { id: "default" } });
    return row ? { ...row, updatedAt: row.updatedAt.toISOString(), sessionsValidFrom: null, adminPassword: null } : null;
  });
  const slides: { src: string; href: string }[] = [];
  const seen = new Set<string>();
  const push = (src: string | null | undefined, href: string | null | undefined) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    slides.push({ src, href: href || "" });
  };
  if (s) {
    push(s.heroImageUrl, s.heroImageUrlLink);
    s.heroImages.forEach((src, i) => push(src, s.heroImageLinks[i]));
  }
  if (slides.length === 0) slides.push({ src: DEFAULT_HERO, href: "" });
  return {
    whatsappNumber: s?.whatsappNumber || null,
    instagramUrl: s?.instagramUrl || null,
    announcement: s?.announcement || null,
    deliveryInfo: s?.deliveryInfo || null,
    heroSlides: slides,
    siteTheme: s?.siteTheme || "padrao",
    giftImage: s?.giftImageUrl || null,
  };
});

/** Catálogo mínimo necessário para validar um pedido (somente o que foi pedido). */
export async function getCatalogForOrder(lines: OrderLineInput[], bagId?: string | null): Promise<Catalog> {
  const productIds = [...new Set(lines.filter((l) => l.kind === "product" && l.productId).map((l) => l.productId as string))];
  const kitIds = [...new Set(lines.filter((l) => l.kind === "kit" && l.kitId).map((l) => l.kitId as string))];
  const [products, kits, bags] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds } }, include: productInclude })
      : Promise.resolve([]),
    kitIds.length ? prisma.kit.findMany({ where: { id: { in: kitIds } } }) : Promise.resolve([]),
    bagId ? prisma.bag.findMany({ where: { id: bagId, isActive: true } }) : Promise.resolve([]),
  ]);
  return { products: products.map(mapProduct), kits: kits.map(mapKit), bags: bags.map(mapBag) };
}

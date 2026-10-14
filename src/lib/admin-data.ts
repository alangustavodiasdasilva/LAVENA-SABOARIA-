import "server-only";
import type { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { isPasswordWeak } from "./auth";
import { bagSellingPrice, round2 } from "./pricing";
import { mapKit, mapOrder, mapProduct, parseOrderItems } from "./mappers";
import { isStorageConfigured } from "./storage";
import type {
  AdminBagDTO,
  AdminCategoryDTO,
  AdminSettingsDTO,
  DashboardStats,
  LowStockItem,
  MaterialDTO,
  RecipeDTO,
} from "./admin-types";
import type { KitDTO, OrderDTO, OrderStatus, ProductDTO } from "./types";

export async function getAdminProducts(): Promise<ProductDTO[]> {
  const rows = await prisma.product.findMany({
    include: { category: true, variants: true },
    orderBy: [{ createdAt: "desc" }],
  });
  return rows.map(mapProduct);
}

export async function getAdminProduct(id: string): Promise<ProductDTO | null> {
  const row = await prisma.product.findUnique({ where: { id }, include: { category: true, variants: true } });
  return row ? mapProduct(row) : null;
}

export async function getAdminCategories(): Promise<AdminCategoryDTO[]> {
  const rows = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, productCount: c._count.products }));
}

export async function getAdminKits(): Promise<KitDTO[]> {
  const rows = await prisma.kit.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapKit);
}

export async function getAdminKit(id: string): Promise<KitDTO | null> {
  const row = await prisma.kit.findUnique({ where: { id } });
  return row ? mapKit(row) : null;
}

export async function getAdminBags(): Promise<AdminBagDTO[]> {
  const rows = await prisma.bag.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    imageUrl: b.imageUrl,
    amountPaid: b.amountPaid,
    quantity: b.quantity,
    margin: b.margin,
    isActive: b.isActive,
    notes: b.notes,
    price: bagSellingPrice(b),
  }));
}

export async function getMaterials(): Promise<MaterialDTO[]> {
  const rows = await prisma.pricingMaterial.findMany({ orderBy: { name: "asc" } });
  return rows.map((m) => ({
    id: m.id,
    name: m.name,
    amountPaid: m.amountPaid,
    quantity: m.quantity,
    unit: m.unit,
    notes: m.notes,
  }));
}

export async function getRecipes(): Promise<RecipeDTO[]> {
  const rows = await prisma.pricingRecipe.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    productId: r.productId,
    batchYield: r.batchYield,
    profitMargin: r.profitMargin,
    items: Array.isArray(r.itemsJson)
      ? (r.itemsJson as unknown[]).filter(
          (i): i is { materialId: string; quantity: number } =>
            !!i && typeof i === "object" && typeof (i as { materialId?: unknown }).materialId === "string"
        )
      : [],
    laborCost: r.laborCost,
    packagingCost: r.packagingCost,
    notes: r.notes,
  }));
}

export async function getAdminSettings(): Promise<AdminSettingsDTO> {
  const s = await prisma.settings.findUnique({ where: { id: "default" } });
  const slides: { src: string; href: string }[] = [];
  if (s?.heroImageUrl) slides.push({ src: s.heroImageUrl, href: s.heroImageUrlLink || "" });
  (s?.heroImages ?? []).forEach((src, i) => slides.push({ src, href: s?.heroImageLinks[i] || "" }));
  return {
    whatsappNumber: s?.whatsappNumber ?? null,
    instagramUrl: s?.instagramUrl ?? null,
    announcement: s?.announcement ?? null,
    deliveryInfo: s?.deliveryInfo ?? null,
    heroSlides: slides,
  };
}

export async function getAdminOrders(opts: { status?: OrderStatus | "ALL"; q?: string; take?: number } = {}): Promise<OrderDTO[]> {
  const where: Prisma.OrderWhereInput = {};
  if (opts.status && opts.status !== "ALL") where.status = opts.status;
  const q = opts.q?.trim();
  if (q) {
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { customerPhone: { contains: q.replace(/\D/g, "") || "§", mode: "insensitive" } },
    ];
  }
  const rows = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: opts.take ?? 200 });
  return rows.map(mapOrder);
}

export async function getAdminOrder(id: string): Promise<OrderDTO | null> {
  const row = await prisma.order.findUnique({ where: { id } });
  return row ? mapOrder(row) : null;
}

export async function countNewOrders(): Promise<number> {
  return prisma.order.count({ where: { status: "NEW" } });
}

const DAY = 24 * 60 * 60 * 1000;
const dayFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }); // YYYY-MM-DD

export async function getDashboardStats(): Promise<DashboardStats> {
  const since30 = new Date(Date.now() - 30 * DAY);
  const [products, categoriesCount, orders30, newOrders, unpaid, recent, settings, passwordWeak] = await Promise.all([
    prisma.product.findMany({ include: { variants: true } }),
    prisma.category.count(),
    prisma.order.findMany({ where: { createdAt: { gte: since30 }, status: { not: "CANCELED" } } }),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.findMany({ where: { paid: false, status: { in: ["NEW", "CONFIRMED", "DELIVERED"] } }, select: { total: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.settings.findUnique({ where: { id: "default" } }),
    isPasswordWeak(),
  ]);

  const revenueLast30 = round2(orders30.reduce((s, o) => s + o.total, 0));

  const lowStock: LowStockItem[] = [];
  let outOfStock = 0;
  for (const p of products) {
    const check = (status: string, qty: number, label: string | null) => {
      if (status === "OUT_OF_STOCK") outOfStock += 1;
      else if (status === "IN_STOCK" && qty > 0 && qty <= Math.max(1, p.lowStockAlert)) {
        lowStock.push({ productId: p.id, name: p.name, label, quantity: qty });
      }
    };
    check(p.stockStatus, p.stockQuantity, p.variants.length > 0 ? p.size : null);
    p.variants.forEach((v) => check(v.stockStatus, v.stockQuantity, v.name));
  }
  lowStock.sort((a, b) => a.quantity - b.quantity);

  // vendas dos últimos 14 dias
  const days: DashboardStats["salesByDay"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    days.push({ date: keyFmt.format(d), label: dayFmt.format(d), total: 0, count: 0 });
  }
  for (const o of orders30) {
    const slot = days.find((d) => d.date === keyFmt.format(o.createdAt));
    if (slot) {
      slot.total = round2(slot.total + o.total);
      slot.count += 1;
    }
  }

  // produtos mais pedidos (30 dias)
  const tally = new Map<string, { name: string; quantity: number; total: number }>();
  for (const o of orders30) {
    for (const it of parseOrderItems(o.itemsJson)) {
      if (it.kind === "bag") continue;
      const t = tally.get(it.name) ?? { name: it.name, quantity: 0, total: 0 };
      t.quantity += it.quantity;
      t.total += it.quantity * it.unitPrice;
      tally.set(it.name, t);
    }
  }
  const topProducts = [...tally.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  return {
    newOrders,
    ordersLast30: orders30.length,
    revenueLast30,
    avgTicket: orders30.length ? round2(revenueLast30 / orders30.length) : 0,
    pendingPaymentCount: unpaid.length,
    pendingPaymentTotal: round2(unpaid.reduce((s, o) => s + o.total, 0)),
    productsVisible: products.filter((p) => p.isVisible).length,
    productsHidden: products.filter((p) => !p.isVisible).length,
    outOfStock,
    lowStock: lowStock.slice(0, 8),
    recentOrders: recent.map(mapOrder),
    salesByDay: days,
    topProducts,
    setup: {
      hasCategories: categoriesCount > 0,
      hasProducts: products.length > 0,
      hasWhatsapp: !!settings?.whatsappNumber,
      hasHero: !!(settings && (settings.heroImages.length > 0 || settings.heroImageUrl)),
      passwordChanged: !passwordWeak,
      storageConfigured: isStorageConfigured(),
    },
  };
}

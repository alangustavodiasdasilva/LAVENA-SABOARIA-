import type { Bag, Category, Kit, Order, Product, ProductVariant } from "@prisma/client";
import { bagSellingPrice } from "./pricing";
import type {
  BagDTO,
  CategoryDTO,
  DeliveryMethod,
  KitDTO,
  OrderDTO,
  OrderItem,
  OrderStatus,
  ProductDTO,
  StockStatus,
  VariantDTO,
} from "./types";
import { DELIVERY_METHODS, ORDER_STATUSES, STOCK_STATUSES } from "./types";

function stock(s: string): StockStatus {
  return (STOCK_STATUSES as readonly string[]).includes(s) ? (s as StockStatus) : "IN_STOCK";
}

export function mapCategory(c: Category): CategoryDTO {
  return { id: c.id, name: c.name, slug: c.slug };
}

export function mapVariant(v: ProductVariant): VariantDTO {
  return {
    id: v.id,
    name: v.name,
    price: v.price,
    salePrice: v.salePrice,
    imageUrl: v.imageUrl,
    stockStatus: stock(v.stockStatus),
    stockQuantity: v.stockQuantity,
  };
}

export type ProductRow = Product & { category: Category | null; variants: ProductVariant[] };

export function mapProduct(p: ProductRow): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    benefits: p.benefits,
    ingredients: p.ingredients,
    price: p.price,
    salePrice: p.salePrice,
    size: p.size,
    imageUrl: p.imageUrl,
    images: p.images,
    stockStatus: stock(p.stockStatus),
    stockQuantity: p.stockQuantity,
    lowStockAlert: p.lowStockAlert,
    categoryId: p.categoryId,
    category: p.category ? mapCategory(p.category) : null,
    isFeatured: p.isFeatured,
    isVisible: p.isVisible,
    variants: [...p.variants].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(mapVariant),
    createdAt: p.createdAt.toISOString(),
  };
}

export function mapKit(k: Kit): KitDTO {
  return {
    id: k.id,
    name: k.name,
    slug: k.slug,
    description: k.description,
    price: k.price,
    salePrice: k.salePrice,
    imageUrl: k.imageUrl,
    images: k.images,
    productIds: k.productIds,
    isActive: k.isActive,
    isFeatured: k.isFeatured,
    stockStatus: stock(k.stockStatus),
    stockQuantity: k.stockQuantity,
  };
}

export function mapBag(b: Bag): BagDTO {
  return {
    id: b.id,
    name: b.name,
    imageUrl: b.imageUrl,
    price: bagSellingPrice(b),
  };
}

export function parseOrderItems(json: unknown): OrderItem[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (i): i is OrderItem =>
      !!i && typeof i === "object" && typeof (i as OrderItem).name === "string" && typeof (i as OrderItem).unitPrice === "number"
  );
}

export function mapOrder(o: Order): OrderDTO {
  return {
    id: o.id,
    code: o.code,
    type: o.type === "GIFT" ? "GIFT" : "CART",
    status: ((ORDER_STATUSES as readonly string[]).includes(o.status) ? o.status : "NEW") as OrderStatus,
    paid: o.paid,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    deliveryMethod: ((DELIVERY_METHODS as readonly string[]).includes(o.deliveryMethod)
      ? o.deliveryMethod
      : "TO_ARRANGE") as DeliveryMethod,
    address: o.address,
    notes: o.notes,
    recipientName: o.recipientName,
    cardMessage: o.cardMessage,
    items: parseOrderItems(o.itemsJson),
    subtotal: o.subtotal,
    total: o.total,
    adminNotes: o.adminNotes,
    stockDeducted: o.stockDeducted,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

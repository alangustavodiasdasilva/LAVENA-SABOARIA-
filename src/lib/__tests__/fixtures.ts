import type { BagDTO, KitDTO, ProductDTO } from "../types";

export function product(over: Partial<ProductDTO> = {}): ProductDTO {
  return {
    id: "p1",
    name: "Sabonete de Mel",
    slug: "sabonete-de-mel",
    description: "Suave e nutritivo",
    benefits: null,
    ingredients: null,
    price: 20,
    salePrice: null,
    size: "100g",
    imageUrl: "https://img/p1.webp",
    images: [],
    stockStatus: "IN_STOCK",
    stockQuantity: 0,
    lowStockAlert: 3,
    categoryId: "c1",
    category: { id: "c1", name: "Sabonetes", slug: "sabonetes" },
    isFeatured: false,
    isVisible: true,
    variants: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

export function kit(over: Partial<KitDTO> = {}): KitDTO {
  return {
    id: "k1",
    name: "Spa Day",
    slug: "spa-day",
    description: null,
    price: 80,
    salePrice: 70,
    imageUrl: null,
    images: [],
    productIds: ["p1"],
    isActive: true,
    isFeatured: false,
    stockStatus: "IN_STOCK",
    stockQuantity: 0,
    ...over,
  };
}

export function bag(over: Partial<BagDTO> = {}): BagDTO {
  return { id: "b1", name: "Sacola Kraft", imageUrl: null, price: 6, ...over };
}

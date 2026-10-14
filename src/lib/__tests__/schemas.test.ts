import { describe, expect, it } from "vitest";
import {
  bagSchema,
  kitSchema,
  normalizeInstagram,
  placeOrderSchema,
  productSchema,
  recipeSchema,
} from "../schemas";

const baseProduct = {
  name: "Sabonete de Lavanda",
  description: "Relaxante",
  price: 20,
  categoryId: "c1",
  isFeatured: false,
  isVisible: true,
  stockStatus: "IN_STOCK",
  stockQuantity: 0,
  lowStockAlert: 3,
  images: [],
  variants: [],
};

describe("productSchema", () => {
  it("aceita produto mínimo e normaliza vazios para null", () => {
    const r = productSchema.parse({ ...baseProduct, benefits: "", size: "  ", salePrice: 0 });
    expect(r.benefits).toBeNull();
    expect(r.size).toBeNull();
    expect(r.salePrice).toBeNull();
    expect(r.imageUrl).toBeNull();
  });
  it("exige nome, descrição e categoria", () => {
    expect(productSchema.safeParse({ ...baseProduct, name: "a" }).success).toBe(false);
    expect(productSchema.safeParse({ ...baseProduct, description: "" }).success).toBe(false);
    expect(productSchema.safeParse({ ...baseProduct, categoryId: "" }).success).toBe(false);
  });
  it("promoção precisa ser menor que o preço", () => {
    const r = productSchema.safeParse({ ...baseProduct, salePrice: 25 });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/promocional/);
  });
  it("recusa preço negativo ou NaN", () => {
    expect(productSchema.safeParse({ ...baseProduct, price: -1 }).success).toBe(false);
    expect(productSchema.safeParse({ ...baseProduct, price: Number.NaN }).success).toBe(false);
  });
  it("recusa imagem com endereço estranho", () => {
    expect(productSchema.safeParse({ ...baseProduct, imageUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(productSchema.safeParse({ ...baseProduct, imageUrl: "https://x/y.webp" }).success).toBe(true);
    expect(productSchema.safeParse({ ...baseProduct, imageUrl: "/images/a.png" }).success).toBe(true);
  });
  it("valida variações", () => {
    const bad = productSchema.safeParse({
      ...baseProduct,
      variants: [{ name: "", price: 10, stockStatus: "IN_STOCK", stockQuantity: 0 }],
    });
    expect(bad.success).toBe(false);
    const good = productSchema.parse({
      ...baseProduct,
      variants: [{ name: "200g", price: 35, salePrice: 30, stockStatus: "IN_STOCK", stockQuantity: 2 }],
    });
    expect(good.variants[0].id).toBeNull();
  });
});

describe("kitSchema / bagSchema / recipeSchema", () => {
  it("kit exige ao menos um produto", () => {
    const r = kitSchema.safeParse({ name: "Spa", price: 50, images: [], productIds: [], isActive: true, isFeatured: false, stockStatus: "IN_STOCK", stockQuantity: 0 });
    expect(r.success).toBe(false);
  });
  it("sacola exige quantidade >= 1", () => {
    expect(bagSchema.safeParse({ name: "Kraft", amountPaid: 10, quantity: 0, margin: 100, isActive: true }).success).toBe(false);
    expect(bagSchema.safeParse({ name: "Kraft", amountPaid: 10, quantity: 5, margin: 100, isActive: true }).success).toBe(true);
  });
  it("receita aplica padrões de custo", () => {
    const r = recipeSchema.parse({ name: "Mel", batchYield: 10, profitMargin: 100, items: [] });
    expect(r.laborCost).toBe(0);
    expect(r.packagingCost).toBe(0);
  });
});

describe("placeOrderSchema", () => {
  const base = {
    type: "CART",
    customerName: "Ana Souza",
    deliveryMethod: "TO_ARRANGE",
    lines: [{ kind: "product", productId: "p1", quantity: 2 }],
  };
  it("aceita pedido simples", () => expect(placeOrderSchema.safeParse(base).success).toBe(true));
  it("normaliza telefone para dígitos", () => {
    expect(placeOrderSchema.parse({ ...base, customerPhone: "(11) 99999-8888" }).customerPhone).toBe("11999998888");
  });
  it("recusa telefone curto", () => expect(placeOrderSchema.safeParse({ ...base, customerPhone: "1234" }).success).toBe(false));
  it("recusa pedido vazio e quantidade absurda", () => {
    expect(placeOrderSchema.safeParse({ ...base, lines: [] }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, lines: [{ kind: "product", productId: "p1", quantity: 500 }] }).success).toBe(false);
  });
  it("recusa nome curto", () => expect(placeOrderSchema.safeParse({ ...base, customerName: "A" }).success).toBe(false));
});

describe("normalizeInstagram", () => {
  it("aceita @, domínio e URL", () => {
    expect(normalizeInstagram("@lavena.saboaria")).toBe("https://instagram.com/lavena.saboaria");
    expect(normalizeInstagram("instagram.com/lavena")).toBe("https://instagram.com/lavena");
    expect(normalizeInstagram("https://www.instagram.com/lavena/")).toBe("https://instagram.com/lavena");
    expect(normalizeInstagram("lavena")).toBe("https://instagram.com/lavena");
  });
  it("vazio vira null", () => expect(normalizeInstagram("  ")).toBeNull());
});

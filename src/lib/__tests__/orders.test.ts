import { describe, expect, it } from "vitest";
import { generateOrderCode, resolveOrderLines } from "../orders";
import { bag, kit, product } from "./fixtures";

const catalog = (over = {}) => ({
  products: [product()],
  kits: [kit()],
  bags: [bag()],
  ...over,
});

describe("resolveOrderLines", () => {
  it("usa o preço do catálogo, nunca o do cliente", () => {
    const r = resolveOrderLines(
      [{ kind: "product", productId: "p1", quantity: 2, price: 0.01 } as any],
      catalog({ products: [product({ price: 20, salePrice: 15 })] })
    );
    expect(r.errors).toEqual([]);
    expect(r.items[0].unitPrice).toBe(15);
    expect(r.subtotal).toBe(30);
  });

  it("junta linhas repetidas", () => {
    const r = resolveOrderLines(
      [
        { kind: "product", productId: "p1", quantity: 1 },
        { kind: "product", productId: "p1", variantId: "", quantity: 2 },
      ],
      catalog()
    );
    expect(r.items).toHaveLength(1);
    expect(r.items[0].quantity).toBe(3);
  });

  it("resolve variação e nomeia com o peso", () => {
    const p = product({
      variants: [{ id: "v1", name: "200g", price: 35, salePrice: null, imageUrl: "https://img/v1.webp", stockStatus: "IN_STOCK", stockQuantity: 0 }],
    });
    const r = resolveOrderLines([{ kind: "product", productId: "p1", variantId: "v1", quantity: 1 }], catalog({ products: [p] }));
    expect(r.items[0].name).toBe("Sabonete de Mel (200g)");
    expect(r.items[0].unitPrice).toBe(35);
    expect(r.items[0].imageUrl).toBe("https://img/v1.webp");
  });

  it("nomeia a opção base com o tamanho quando há variações", () => {
    const p = product({
      variants: [{ id: "v1", name: "200g", price: 35, salePrice: null, imageUrl: null, stockStatus: "IN_STOCK", stockQuantity: 0 }],
    });
    const r = resolveOrderLines([{ kind: "product", productId: "p1", quantity: 1 }], catalog({ products: [p] }));
    expect(r.items[0].name).toBe("Sabonete de Mel (100g)");
  });

  it("recusa produto esgotado, oculto ou inexistente", () => {
    expect(resolveOrderLines([{ kind: "product", productId: "p1", quantity: 1 }], catalog({ products: [product({ stockStatus: "OUT_OF_STOCK" })] })).errors[0]).toMatch(/esgotado/);
    expect(resolveOrderLines([{ kind: "product", productId: "p1", quantity: 1 }], catalog({ products: [product({ isVisible: false })] })).errors).toHaveLength(1);
    expect(resolveOrderLines([{ kind: "product", productId: "zzz", quantity: 1 }], catalog()).errors).toHaveLength(1);
  });

  it("respeita estoque controlado", () => {
    const r = resolveOrderLines([{ kind: "product", productId: "p1", quantity: 5 }], catalog({ products: [product({ stockQuantity: 3 })] }));
    expect(r.errors[0]).toMatch(/Só temos 3 unidades/);
    expect(r.items).toHaveLength(0);
  });

  it("marca itens sob encomenda como reserva", () => {
    const r = resolveOrderLines([{ kind: "product", productId: "p1", quantity: 1 }], catalog({ products: [product({ stockStatus: "IN_PRODUCTION" })] }));
    expect(r.items[0].reserve).toBe(true);
  });

  it("resolve kit com preço promocional", () => {
    const r = resolveOrderLines([{ kind: "kit", kitId: "k1", quantity: 2 }], catalog());
    expect(r.items[0]).toMatchObject({ kind: "kit", name: "Kit Spa Day", unitPrice: 70, quantity: 2 });
    expect(r.subtotal).toBe(140);
  });

  it("recusa kit inativo", () => {
    const r = resolveOrderLines([{ kind: "kit", kitId: "k1", quantity: 1 }], catalog({ kits: [kit({ isActive: false })] }));
    expect(r.errors).toHaveLength(1);
  });

  it("inclui a embalagem escolhida", () => {
    const r = resolveOrderLines([{ kind: "product", productId: "p1", quantity: 1 }], catalog(), "b1");
    expect(r.items.at(-1)).toMatchObject({ kind: "bag", unitPrice: 6, quantity: 1 });
    expect(r.subtotal).toBe(26);
  });

  it("avisa embalagem inexistente", () => {
    const r = resolveOrderLines([{ kind: "product", productId: "p1", quantity: 1 }], catalog(), "nope");
    expect(r.errors).toHaveLength(1);
  });
});

describe("generateOrderCode", () => {
  it("tem o formato LV-XXXXX sem caracteres ambíguos", () => {
    for (let i = 0; i < 200; i++) expect(generateOrderCode()).toMatch(/^LV-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/);
  });
});

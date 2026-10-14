import { describe, expect, it } from "vitest";
import {
  availableUnits,
  defaultOption,
  lowStockNote,
  productAvailability,
  productOptions,
  startingPrice,
  statusFromQuantity,
} from "../stock";
import { product } from "./fixtures";

const variant = (over = {}) => ({
  id: "v1",
  name: "200g",
  price: 35,
  salePrice: null,
  imageUrl: null,
  stockStatus: "IN_STOCK" as const,
  stockQuantity: 0,
  ...over,
});

describe("opções do produto", () => {
  it("produto simples tem só a opção base", () => {
    const opts = productOptions(product({ size: null }));
    expect(opts).toHaveLength(1);
    expect(opts[0].label).toBe("Único");
  });
  it("base vem antes das variações", () => {
    const opts = productOptions(product({ variants: [variant()] }));
    expect(opts.map((o) => o.label)).toEqual(["100g", "200g"]);
  });
  it("base sem tamanho com variações vira 'Padrão'", () => {
    const opts = productOptions(product({ size: null, variants: [variant()] }));
    expect(opts[0].label).toBe("Padrão");
  });
});

describe("estoque", () => {
  it("quantidade 0 em estoque = sem limite", () => {
    expect(availableUnits({ stockStatus: "IN_STOCK", stockQuantity: 0 })).toBeNull();
  });
  it("quantidade controlada limita", () => {
    expect(availableUnits({ stockStatus: "IN_STOCK", stockQuantity: 4 })).toBe(4);
  });
  it("sob encomenda não limita", () => {
    expect(availableUnits({ stockStatus: "IN_PRODUCTION", stockQuantity: 4 })).toBeNull();
  });
  it("avisa estoque baixo", () => {
    expect(lowStockNote({ stockStatus: "IN_STOCK", stockQuantity: 2 }, 3)).toBe("Últimas 2 unidades");
    expect(lowStockNote({ stockStatus: "IN_STOCK", stockQuantity: 1 }, 3)).toBe("Última unidade");
    expect(lowStockNote({ stockStatus: "IN_STOCK", stockQuantity: 10 }, 3)).toBeNull();
  });
  it("status acompanha a quantidade", () => {
    expect(statusFromQuantity("IN_STOCK", 0)).toBe("OUT_OF_STOCK");
    expect(statusFromQuantity("IN_PRODUCTION", 0)).toBe("OUT_OF_STOCK");
    expect(statusFromQuantity("OUT_OF_STOCK", 5)).toBe("IN_STOCK");
    expect(statusFromQuantity("IN_PRODUCTION", 5)).toBe("IN_PRODUCTION");
  });
});

describe("disponibilidade", () => {
  it("disponível", () => expect(productAvailability(product())).toBe("available"));
  it("reserva", () => expect(productAvailability(product({ stockStatus: "IN_PRODUCTION" }))).toBe("reserve"));
  it("esgotado", () => expect(productAvailability(product({ stockStatus: "OUT_OF_STOCK" }))).toBe("soldout"));
  it("base esgotada mas variação disponível", () => {
    const p = product({ stockStatus: "OUT_OF_STOCK", variants: [variant()] });
    expect(productAvailability(p)).toBe("available");
    expect(defaultOption(p).id).toBe("v1");
  });
  it("a partir de usa o menor preço disponível", () => {
    const p = product({ price: 20, variants: [variant({ price: 12 }), variant({ id: "v2", price: 5, stockStatus: "OUT_OF_STOCK" })] });
    expect(startingPrice(p)).toBe(12);
  });
});

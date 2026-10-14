import { describe, expect, it } from "vitest";
import {
  bagSellingPrice,
  calcRecipe,
  costPerBaseUnit,
  discountPercent,
  effectivePrice,
  isOnSale,
  toBaseUnit,
} from "../pricing";

describe("preço efetivo", () => {
  it("usa preço normal sem promoção", () => expect(effectivePrice({ price: 20 })).toBe(20));
  it("usa promoção válida", () => {
    expect(effectivePrice({ price: 20, salePrice: 15 })).toBe(15);
    expect(isOnSale({ price: 20, salePrice: 15 })).toBe(true);
    expect(discountPercent({ price: 20, salePrice: 15 })).toBe(25);
  });
  it("ignora promoção inválida (zero ou maior que o preço)", () => {
    expect(effectivePrice({ price: 20, salePrice: 0 })).toBe(20);
    expect(effectivePrice({ price: 20, salePrice: 25 })).toBe(20);
    expect(discountPercent({ price: 20, salePrice: 25 })).toBe(0);
  });
});

describe("sacolas", () => {
  it("custo unitário + margem", () => {
    // R$ 30 por 10 sacolas = R$ 3 cada, +100% = R$ 6
    expect(bagSellingPrice({ amountPaid: 30, quantity: 10, margin: 100 })).toBe(6);
  });
  it("quantidade zero não divide por zero", () => {
    expect(bagSellingPrice({ amountPaid: 10, quantity: 0, margin: 0 })).toBe(10);
  });
});

describe("calculadora", () => {
  it("normaliza unidades", () => {
    expect(toBaseUnit(2, "kg")).toEqual({ value: 2000, baseUnit: "g" });
    expect(toBaseUnit(1.5, "l")).toEqual({ value: 1500, baseUnit: "ml" });
    expect(toBaseUnit(3, "un")).toEqual({ value: 3, baseUnit: "un" });
  });
  it("custo por unidade base", () => {
    expect(costPerBaseUnit({ amountPaid: 50, quantity: 1, unit: "kg" })).toBeCloseTo(0.05);
  });
  it("calcula receita completa", () => {
    const r = calcRecipe({
      materials: [
        { id: "glicerina", amountPaid: 50, quantity: 1, unit: "kg" }, // R$ 0,05 / g
        { id: "essencia", amountPaid: 20, quantity: 100, unit: "ml" }, // R$ 0,20 / ml
      ],
      items: [
        { materialId: "glicerina", quantity: 500 }, // 25
        { materialId: "essencia", quantity: 10 }, // 2
      ],
      batchYield: 10,
      profitMargin: 100,
      laborCost: 5,
      packagingCost: 3,
    });
    expect(r.materialsTotal).toBeCloseTo(27);
    expect(r.batchTotal).toBeCloseTo(35);
    expect(r.costPerUnit).toBeCloseTo(3.5);
    expect(r.suggestedPrice).toBeCloseTo(7);
    expect(r.profitPerUnit).toBeCloseTo(3.5);
  });
  it("ignora matéria-prima inexistente e rendimento inválido", () => {
    const r = calcRecipe({
      materials: [],
      items: [{ materialId: "x", quantity: 10 }],
      batchYield: 0,
      profitMargin: 50,
      laborCost: 10,
      packagingCost: 0,
    });
    expect(r.materialsTotal).toBe(0);
    expect(r.costPerUnit).toBe(10);
  });
});

// Regras de preço. Funções puras, usadas na loja, no servidor e no admin.

type Priced = { price: number; salePrice?: number | null };

export function isOnSale(p: Priced): boolean {
  return !!p.salePrice && p.salePrice > 0 && p.salePrice < p.price;
}

export function effectivePrice(p: Priced): number {
  return isOnSale(p) ? (p.salePrice as number) : p.price;
}

export function discountPercent(p: Priced): number {
  if (!isOnSale(p)) return 0;
  return Math.round(((p.price - (p.salePrice as number)) / p.price) * 100);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ─── Sacolas de presente ───
export type BagCost = { amountPaid: number; quantity: number; margin: number };

/** Preço de venda de UMA sacola: custo unitário + margem (%). */
export function bagSellingPrice(bag: BagCost): number {
  const unitCost = bag.amountPaid / Math.max(1, bag.quantity);
  return round2(unitCost * (1 + bag.margin / 100));
}

// ─── Calculadora de precificação (matérias-primas e receitas) ───
export type MaterialLike = { id: string; amountPaid: number; quantity: number; unit: string };

export function toBaseUnit(qty: number, unit: string): { value: number; baseUnit: "g" | "ml" | "un" } {
  if (unit === "kg") return { value: qty * 1000, baseUnit: "g" };
  if (unit === "l") return { value: qty * 1000, baseUnit: "ml" };
  if (unit === "ml") return { value: qty, baseUnit: "ml" };
  if (unit === "g") return { value: qty, baseUnit: "g" };
  return { value: qty, baseUnit: "un" };
}

export function baseUnitLabel(unit: string): string {
  return toBaseUnit(1, unit).baseUnit;
}

/** Custo de 1 g / 1 ml / 1 un da matéria-prima. */
export function costPerBaseUnit(m: Pick<MaterialLike, "amountPaid" | "quantity" | "unit">): number {
  const base = toBaseUnit(m.quantity, m.unit).value;
  if (!base) return 0;
  return m.amountPaid / base;
}

export type RecipeCalcInput = {
  items: { materialId: string; quantity: number }[];
  materials: MaterialLike[];
  batchYield: number;
  profitMargin: number;
  laborCost: number;
  packagingCost: number;
};

export type RecipeCalcResult = {
  materialsTotal: number;
  batchTotal: number;
  costPerUnit: number;
  suggestedPrice: number;
  profitPerUnit: number;
  breakdown: { materialId: string; cost: number }[];
};

export function calcRecipe(input: RecipeCalcInput): RecipeCalcResult {
  const yieldN = Math.max(1, Math.floor(input.batchYield) || 1);
  let materialsTotal = 0;
  const breakdown: { materialId: string; cost: number }[] = [];
  for (const it of input.items) {
    const m = input.materials.find((x) => x.id === it.materialId);
    if (!m) continue;
    const cost = costPerBaseUnit(m) * (Number(it.quantity) || 0);
    materialsTotal += cost;
    breakdown.push({ materialId: m.id, cost });
  }
  const batchTotal = materialsTotal + (input.laborCost || 0) + (input.packagingCost || 0);
  const costPerUnit = batchTotal / yieldN;
  const suggestedPrice = costPerUnit * (1 + (input.profitMargin || 0) / 100);
  return {
    materialsTotal,
    batchTotal,
    costPerUnit,
    suggestedPrice,
    profitPerUnit: suggestedPrice - costPerUnit,
    breakdown,
  };
}

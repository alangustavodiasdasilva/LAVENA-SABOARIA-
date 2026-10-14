import type { BagDTO, KitDTO, OrderItem, ProductDTO } from "./types";
import { effectivePrice, round2 } from "./pricing";
import { availableUnits, optionDisplayName, productOptions } from "./stock";

export type OrderLineInput = {
  kind: "product" | "kit";
  productId?: string;
  variantId?: string | null;
  kitId?: string;
  quantity: number;
};

export type Catalog = { products: ProductDTO[]; kits: KitDTO[]; bags: BagDTO[] };

export type ResolvedOrder = { items: OrderItem[]; subtotal: number; errors: string[] };

/**
 * Converte as linhas enviadas pelo navegador em itens com preço e nome confiáveis,
 * sempre a partir do catálogo atual. Nunca confia em preço vindo do cliente.
 */
export function resolveOrderLines(
  lines: OrderLineInput[],
  catalog: Catalog,
  bagId?: string | null
): ResolvedOrder {
  const errors: string[] = [];
  const items: OrderItem[] = [];

  // Junta linhas repetidas (mesmo produto + opção, ou mesmo kit)
  const merged = new Map<string, OrderLineInput>();
  for (const l of lines) {
    const key =
      l.kind === "kit" ? `kit:${l.kitId}` : `product:${l.productId}:${l.variantId || ""}`;
    const prev = merged.get(key);
    if (prev) prev.quantity += l.quantity;
    else merged.set(key, { ...l, variantId: l.variantId || "" });
  }

  for (const l of merged.values()) {
    if (l.kind === "kit") {
      const kit = catalog.kits.find((k) => k.id === l.kitId && k.isActive);
      if (!kit) {
        errors.push("Um dos kits do pedido não está mais disponível.");
        continue;
      }
      if (kit.stockStatus === "OUT_OF_STOCK") {
        errors.push(`O kit ${kit.name} está esgotado.`);
        continue;
      }
      const units = kit.stockStatus === "IN_STOCK" && kit.stockQuantity > 0 ? kit.stockQuantity : null;
      if (units != null && l.quantity > units) {
        errors.push(`Só temos ${units} ${units === 1 ? "unidade" : "unidades"} do kit ${kit.name}.`);
        continue;
      }
      items.push({
        kind: "kit",
        kitId: kit.id,
        name: `Kit ${kit.name}`,
        unitPrice: effectivePrice(kit),
        quantity: l.quantity,
        imageUrl: kit.imageUrl,
        reserve: kit.stockStatus === "IN_PRODUCTION",
      });
      continue;
    }

    const product = catalog.products.find((p) => p.id === l.productId && p.isVisible);
    if (!product) {
      errors.push("Um dos produtos do pedido não está mais disponível.");
      continue;
    }
    const options = productOptions(product);
    const option = options.find((o) => o.id === (l.variantId || ""));
    if (!option) {
      errors.push(`A opção escolhida de ${product.name} não existe mais.`);
      continue;
    }
    const label = optionDisplayName(product, option);
    if (option.stockStatus === "OUT_OF_STOCK") {
      errors.push(`${label} está esgotado.`);
      continue;
    }
    const units = availableUnits(option);
    if (units != null && l.quantity > units) {
      errors.push(`Só temos ${units} ${units === 1 ? "unidade" : "unidades"} de ${label}.`);
      continue;
    }
    items.push({
      kind: "product",
      productId: product.id,
      variantId: option.id || null,
      name: label,
      unitPrice: effectivePrice(option),
      quantity: l.quantity,
      imageUrl: option.imageUrl || product.imageUrl || product.images[0] || null,
      reserve: option.stockStatus === "IN_PRODUCTION",
    });
  }

  if (bagId) {
    const bag = catalog.bags.find((b) => b.id === bagId);
    if (!bag) errors.push("A embalagem escolhida não está mais disponível.");
    else
      items.push({
        kind: "bag",
        bagId: bag.id,
        name: `Embalagem: ${bag.name}`,
        unitPrice: bag.price,
        quantity: 1,
        imageUrl: bag.imageUrl,
      });
  }

  const subtotal = round2(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0));
  return { items, subtotal, errors };
}

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Código curto e legível do pedido, ex.: LV-7K3Q9. */
export function generateOrderCode(random: (n: number) => number = (n) => Math.floor(Math.random() * n)): string {
  let s = "";
  for (let i = 0; i < 5; i++) s += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  return `LV-${s}`;
}

export type CartQuoteLine = {
  key: string;
  ok: boolean;
  name: string;
  unitPrice: number;
  imageUrl: string | null;
  reserve: boolean;
  /** Máximo que dá para comprar (null = sem limite). */
  maxQty: number | null;
  problem: string | null;
};

/** Cotação linha a linha do carrinho com os dados atuais do catálogo. */
export function quoteCartLines(
  lines: (OrderLineInput & { key: string })[],
  catalog: Catalog
): CartQuoteLine[] {
  return lines.map((l) => {
    const bad = (problem: string): CartQuoteLine => ({
      key: l.key,
      ok: false,
      name: "",
      unitPrice: 0,
      imageUrl: null,
      reserve: false,
      maxQty: 0,
      problem,
    });
    if (l.kind === "kit") {
      const kit = catalog.kits.find((k) => k.id === l.kitId && k.isActive);
      if (!kit) return bad("Este kit não está mais disponível.");
      if (kit.stockStatus === "OUT_OF_STOCK") return bad("Kit esgotado.");
      return {
        key: l.key,
        ok: true,
        name: `Kit ${kit.name}`,
        unitPrice: effectivePrice(kit),
        imageUrl: kit.imageUrl,
        reserve: kit.stockStatus === "IN_PRODUCTION",
        maxQty: kit.stockStatus === "IN_STOCK" && kit.stockQuantity > 0 ? kit.stockQuantity : null,
        problem: null,
      };
    }
    const product = catalog.products.find((p) => p.id === l.productId && p.isVisible);
    if (!product) return bad("Este produto não está mais disponível.");
    const option = productOptions(product).find((o) => o.id === (l.variantId || ""));
    if (!option) return bad("Esta opção não existe mais.");
    if (option.stockStatus === "OUT_OF_STOCK") return bad("Produto esgotado.");
    const label = optionDisplayName(product, option);
    return {
      key: l.key,
      ok: true,
      name: label,
      unitPrice: effectivePrice(option),
      imageUrl: option.imageUrl || product.imageUrl || product.images[0] || null,
      reserve: option.stockStatus === "IN_PRODUCTION",
      maxQty: availableUnits(option),
      problem: null,
    };
  });
}

import type { KitDTO, ProductDTO, StockStatus } from "./types";
import { effectivePrice } from "./pricing";

/** Id da "opção base" (o próprio produto, quando ele também tem variações). */
export const BASE_OPTION_ID = "";

export type ProductOption = {
  id: string;
  label: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  stockStatus: StockStatus;
  stockQuantity: number;
};

/** Opções de compra: o produto base primeiro, depois as variações (peso/tamanho). */
export function productOptions(p: ProductDTO): ProductOption[] {
  const base: ProductOption = {
    id: BASE_OPTION_ID,
    label: p.size?.trim() || (p.variants.length > 0 ? "Padrão" : "Único"),
    price: p.price,
    salePrice: p.salePrice,
    imageUrl: p.imageUrl,
    stockStatus: p.stockStatus,
    stockQuantity: p.stockQuantity,
  };
  return [
    base,
    ...p.variants.map((v) => ({
      id: v.id,
      label: v.name,
      price: v.price,
      salePrice: v.salePrice,
      imageUrl: v.imageUrl,
      stockStatus: v.stockStatus,
      stockQuantity: v.stockQuantity,
    })),
  ];
}

export function isPurchasableStatus(status: StockStatus): boolean {
  return status === "IN_STOCK" || status === "IN_PRODUCTION";
}

export function isReserveStatus(status: StockStatus): boolean {
  return status === "IN_PRODUCTION";
}

/**
 * Unidades que ainda podem ser vendidas. `null` = sem limite (estoque não controlado
 * ou produto sob encomenda). Estoque 0 com status "Em estoque" significa não controlado:
 * ao zerar uma quantidade controlada o sistema já muda o status para "Esgotado".
 */
export function availableUnits(o: Pick<ProductOption, "stockStatus" | "stockQuantity">): number | null {
  if (o.stockStatus === "IN_STOCK" && o.stockQuantity > 0) return o.stockQuantity;
  return null;
}

export function lowStockNote(
  o: Pick<ProductOption, "stockStatus" | "stockQuantity">,
  lowStockAlert: number
): string | null {
  const units = availableUnits(o);
  if (units == null) return null;
  if (units <= Math.max(1, lowStockAlert)) return units === 1 ? "Última unidade" : `Últimas ${units} unidades`;
  return null;
}

export type Availability = "available" | "reserve" | "soldout";

export function statusAvailability(status: StockStatus): Availability {
  if (status === "IN_STOCK") return "available";
  if (status === "IN_PRODUCTION") return "reserve";
  return "soldout";
}

/** Disponibilidade do produto como um todo (qualquer opção disponível conta). */
export function productAvailability(p: ProductDTO): Availability {
  const opts = productOptions(p);
  if (opts.some((o) => o.stockStatus === "IN_STOCK")) return "available";
  if (opts.some((o) => o.stockStatus === "IN_PRODUCTION")) return "reserve";
  return "soldout";
}

export function kitAvailability(k: Pick<KitDTO, "stockStatus">): Availability {
  return statusAvailability(k.stockStatus);
}

/** Opção que deve vir selecionada ao abrir o produto: a base, ou a primeira disponível. */
export function defaultOption(p: ProductDTO): ProductOption {
  const opts = productOptions(p);
  return (
    opts.find((o) => o.stockStatus === "IN_STOCK") ||
    opts.find((o) => o.stockStatus === "IN_PRODUCTION") ||
    opts[0]
  );
}

/** Menor preço efetivo entre as opções disponíveis (para "a partir de"). */
export function startingPrice(p: ProductDTO): number {
  const opts = productOptions(p).filter((o) => isPurchasableStatus(o.stockStatus));
  const list = opts.length > 0 ? opts : productOptions(p);
  return Math.min(...list.map((o) => effectivePrice(o)));
}

/** Decide o status a partir da quantidade, mantendo "Em produção" quando for o caso. */
export function statusFromQuantity(current: StockStatus, qty: number): StockStatus {
  if (qty <= 0 && (current === "IN_STOCK" || current === "IN_PRODUCTION")) return "OUT_OF_STOCK";
  if (qty > 0 && current === "OUT_OF_STOCK") return "IN_STOCK";
  return current;
}

/** Nome mostrado no pedido/sacola: "Sabonete de Mel (200g)". A opção base usa o tamanho quando há variações. */
export function optionDisplayName(p: Pick<ProductDTO, "name" | "size" | "variants">, option: Pick<ProductOption, "id" | "label">): string {
  if (option.id === "") {
    return p.variants.length > 0 && p.size?.trim() ? `${p.name} (${p.size.trim()})` : p.name;
  }
  return `${p.name} (${option.label})`;
}

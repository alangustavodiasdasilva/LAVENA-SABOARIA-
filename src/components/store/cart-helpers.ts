import { effectivePrice } from "@/lib/pricing";
import { optionDisplayName, type ProductOption } from "@/lib/stock";
import type { CartLine, KitDTO, ProductDTO } from "@/lib/types";

type NewLine = Omit<CartLine, "quantity" | "key">;

export function productLine(p: ProductDTO, option: ProductOption): NewLine {
  return {
    kind: "product",
    productId: p.id,
    variantId: option.id || undefined,
    slug: p.slug,
    name: optionDisplayName(p, option),
    price: effectivePrice(option),
    imageUrl: option.imageUrl || p.imageUrl || p.images[0] || "",
    reserve: option.stockStatus === "IN_PRODUCTION",
  };
}

export function kitLine(k: KitDTO): NewLine {
  return {
    kind: "kit",
    kitId: k.id,
    slug: k.slug,
    name: `Kit ${k.name}`,
    price: effectivePrice(k),
    imageUrl: k.imageUrl || k.images[0] || "",
    reserve: k.stockStatus === "IN_PRODUCTION",
  };
}

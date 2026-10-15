import { z } from "zod";
import { DELIVERY_METHODS, STOCK_STATUSES } from "./types";
import { THEME_IDS } from "./themes";

const text = (max: number, label = "Texto") =>
  z.string().trim().max(max, `${label} muito longo (máx. ${max} caracteres).`);

const optionalText = (max: number, label?: string) =>
  text(max, label)
    .nullish()
    .transform((v) => (v ? v : null));

/** URL https, caminho local (/images/...) ou imagem em data URL (fallback sem Storage). */
const imageRef = z
  .string()
  .max(700_000, "Imagem muito grande.")
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/") || v.startsWith("data:image/"), "Endereço de imagem inválido.");

const optionalImage = imageRef.nullish().transform((v) => (v ? v : null));

const money = (label: string) =>
  z.number({ error: `${label} inválido.` }).finite(`${label} inválido.`).min(0, `${label} não pode ser negativo.`).max(100000, `${label} muito alto.`);

const stockStatus = z.enum(STOCK_STATUSES, { error: "Status de estoque inválido." });

const integer = (label: string, max = 100000) =>
  z.number({ error: `${label} inválida.` }).int(`${label} inválida.`).min(0, `${label} não pode ser negativa.`).max(max, `${label} muito alta.`);

function salePriceRule(
  v: { price: number; salePrice?: number | null },
  ctx: z.RefinementCtx
) {
  if (v.salePrice != null && v.salePrice !== 0 && v.salePrice >= v.price) {
    ctx.addIssue({ code: "custom", message: "O preço promocional deve ser menor que o preço normal.", path: ["salePrice"] });
  }
}

const normalizeSale = (v: number | null | undefined) => (v ? v : null);

export const variantSchema = z
  .object({
    id: z.string().max(64).optional().nullable(),
    name: text(40, "Nome da variação").min(1, "Dê um nome para cada variação (ex.: Lavanda ou 200g)."),
    size: optionalText(40, "Tamanho da variação"),
    price: money("Preço da variação"),
    salePrice: money("Preço promocional da variação").nullish(),
    imageUrl: optionalImage,
    stockStatus: stockStatus,
    stockQuantity: integer("Quantidade"),
  })
  .superRefine(salePriceRule)
  .transform((v) => ({ ...v, id: v.id || null, salePrice: normalizeSale(v.salePrice) }));

export const productSchema = z
  .object({
    name: text(120, "Nome").min(2, "Informe o nome do produto."),
    description: text(2000, "Descrição").min(1, "A descrição é obrigatória."),
    benefits: optionalText(2000, "Benefícios"),
    ingredients: optionalText(2000, "Ingredientes"),
    price: money("Preço"),
    salePrice: money("Preço promocional").nullish(),
    size: optionalText(40, "Tamanho"),
    essence: optionalText(40, "Essência"),
    imageUrl: optionalImage,
    images: z.array(imageRef).max(12, "Use no máximo 12 fotos na galeria."),
    categoryId: z.string().min(1, "Escolha uma categoria.").max(64),
    isFeatured: z.boolean(),
    isVisible: z.boolean(),
    stockStatus: stockStatus,
    stockQuantity: integer("Quantidade em estoque"),
    lowStockAlert: integer("Alerta de estoque baixo", 1000),
    variants: z.array(variantSchema).max(12, "Use no máximo 12 variações."),
  })
  .superRefine(salePriceRule)
  .transform((v) => ({ ...v, salePrice: normalizeSale(v.salePrice) }));
export type ProductInput = z.input<typeof productSchema>;

export const kitSchema = z
  .object({
    name: text(120, "Nome").min(2, "Informe o nome do kit."),
    description: optionalText(1000, "Descrição"),
    price: money("Preço"),
    salePrice: money("Preço promocional").nullish(),
    imageUrl: optionalImage,
    images: z.array(imageRef).max(8),
    productIds: z.array(z.string().max(64)).min(1, "Selecione ao menos 1 produto para o kit.").max(40),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    stockStatus: stockStatus,
    stockQuantity: integer("Quantidade em estoque"),
  })
  .superRefine(salePriceRule)
  .transform((v) => ({ ...v, salePrice: normalizeSale(v.salePrice) }));
export type KitInput = z.input<typeof kitSchema>;

export const bagSchema = z.object({
  name: text(80, "Nome").min(2, "Informe o nome da sacola."),
  imageUrl: optionalImage,
  amountPaid: money("Valor pago"),
  quantity: z.number({ error: "Quantidade inválida." }).int("Quantidade inválida.").min(1, "A quantidade deve ser pelo menos 1.").max(100000),
  margin: z.number({ error: "Margem inválida." }).finite().min(0, "A margem não pode ser negativa.").max(10000),
  isActive: z.boolean(),
  notes: optionalText(500, "Observações"),
});
export type BagInput = z.input<typeof bagSchema>;

export const categorySchema = z.object({ name: text(60, "Nome").min(2, "Informe o nome da categoria.") });

export const materialSchema = z.object({
  name: text(80, "Nome").min(1, "Informe o nome da matéria-prima."),
  amountPaid: money("Valor pago"),
  quantity: z.number({ error: "Quantidade inválida." }).finite().gt(0, "A quantidade deve ser maior que zero.").max(10_000_000),
  unit: z.enum(["g", "kg", "ml", "l", "un"], { error: "Unidade inválida." }),
  notes: optionalText(300),
});
export type MaterialInput = z.input<typeof materialSchema>;

export const recipeSchema = z.object({
  name: text(80, "Nome").min(1, "Informe o nome da receita."),
  productId: z.string().max(64).nullish().transform((v) => (v ? v : null)),
  batchYield: z.number({ error: "Rendimento inválido." }).int("Rendimento inválido.").min(1, "O rendimento deve ser pelo menos 1.").max(100000),
  profitMargin: z.number({ error: "Margem inválida." }).finite().min(0, "A margem não pode ser negativa.").max(10000),
  laborCost: money("Mão de obra").default(0),
  packagingCost: money("Embalagem").default(0),
  items: z
    .array(
      z.object({
        materialId: z.string().min(1).max(64),
        quantity: z.number().finite().gt(0).max(10_000_000),
      })
    )
    .max(60),
  notes: optionalText(1000),
});
export type RecipeInput = z.input<typeof recipeSchema>;

/** "@lavena", "instagram.com/lavena" ou URL completa -> https://instagram.com/lavena */
export function normalizeInstagram(input: string | null | undefined): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  const m = raw.match(/(?:instagram\.com\/)?@?([A-Za-z0-9._]{1,30})\/?(?:\?.*)?$/);
  if (!m) return null;
  return `https://instagram.com/${m[1]}`;
}

export const settingsSchema = z.object({
  whatsappNumber: z.string().max(30).nullish(),
  instagramUrl: z.string().max(200).nullish(),
  announcement: optionalText(160, "Aviso"),
  deliveryInfo: optionalText(600, "Informações de entrega"),
  siteTheme: z.enum(THEME_IDS, { error: "Versão do site inválida." }).default("padrao"),
  giftImage: optionalImage,
  heroSlides: z
    .array(z.object({ src: imageRef, href: z.string().max(300).nullish().transform((v) => v || "") }))
    .max(10, "Use no máximo 10 imagens no topo."),
});
export type SettingsInput = z.input<typeof settingsSchema>;

export const orderLineSchema = z.object({
  kind: z.enum(["product", "kit"]),
  productId: z.string().max(64).optional(),
  variantId: z.string().max(64).nullish(),
  kitId: z.string().max(64).optional(),
  quantity: z.number().int().min(1, "Quantidade inválida.").max(99, "Quantidade máxima por item: 99."),
});

export const placeOrderSchema = z.object({
  type: z.enum(["CART", "GIFT"]),
  customerName: text(80, "Nome").min(2, "Informe seu nome."),
  customerPhone: z
    .string()
    .max(30)
    .nullish()
    .transform((v) => (v ? v.replace(/\D/g, "") : null))
    .refine((v) => v === null || (v.length >= 10 && v.length <= 13), "Telefone inválido. Use DDD + número."),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  address: optionalText(300, "Endereço"),
  notes: optionalText(500, "Observação"),
  recipientName: optionalText(80, "Nome de quem recebe"),
  cardMessage: optionalText(300, "Mensagem do cartão"),
  bagId: z.string().max(64).nullish().transform((v) => v || null),
  lines: z.array(orderLineSchema).min(1, "Seu pedido está vazio.").max(60, "Pedido com itens demais."),
  /** Campo isca: pessoas não veem; robôs preenchem. */
  website: z.string().max(200).optional(),
});
export type PlaceOrderInput = z.input<typeof placeOrderSchema>;

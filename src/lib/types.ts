// Tipos compartilhados entre servidor e cliente. Tudo aqui é serializável (JSON).

export const STOCK_STATUSES = ["IN_STOCK", "IN_PRODUCTION", "OUT_OF_STOCK"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const ORDER_STATUSES = ["NEW", "CONFIRMED", "DELIVERED", "CANCELED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DELIVERY_METHODS = ["TO_ARRANGE", "PICKUP", "DELIVERY"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export type CategoryDTO = { id: string; name: string; slug: string };

export type VariantDTO = {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  stockStatus: StockStatus;
  stockQuantity: number;
};

export type ProductDTO = {
  id: string;
  name: string;
  slug: string;
  description: string;
  benefits: string | null;
  ingredients: string | null;
  price: number;
  salePrice: number | null;
  size: string | null;
  imageUrl: string | null;
  images: string[];
  stockStatus: StockStatus;
  stockQuantity: number;
  lowStockAlert: number;
  categoryId: string;
  category: CategoryDTO | null;
  isFeatured: boolean;
  isVisible: boolean;
  variants: VariantDTO[];
  createdAt: string;
};

export type KitDTO = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  images: string[];
  productIds: string[];
  isActive: boolean;
  isFeatured: boolean;
  stockStatus: StockStatus;
  stockQuantity: number;
};

/** Sacola de presente. Para o público só o preço final de venda é exposto (nunca custo/margem). */
export type BagDTO = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
};

export type HeroSlide = { src: string; href: string };

export type PublicSettings = {
  whatsappNumber: string | null;
  instagramUrl: string | null;
  announcement: string | null;
  deliveryInfo: string | null;
  heroSlides: HeroSlide[];
};

/** Linha de pedido, já com preço resolvido pelo servidor. */
export type OrderItem = {
  kind: "product" | "kit" | "bag";
  productId?: string;
  variantId?: string | null;
  kitId?: string;
  bagId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string | null;
  reserve?: boolean;
  /** Unidades já descontadas do estoque ao confirmar o pedido (para poder devolver). */
  deducted?: number;
};

export type OrderDTO = {
  id: string;
  code: string;
  type: "CART" | "GIFT";
  status: OrderStatus;
  paid: boolean;
  customerName: string;
  customerPhone: string | null;
  deliveryMethod: DeliveryMethod;
  address: string | null;
  notes: string | null;
  recipientName: string | null;
  cardMessage: string | null;
  items: OrderItem[];
  subtotal: number;
  total: number;
  adminNotes: string | null;
  stockDeducted: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Item do carrinho guardado no navegador. */
export type CartLine = {
  key: string;
  kind: "product" | "kit";
  productId?: string;
  variantId?: string;
  kitId?: string;
  /** endereço da página do produto/kit, para linkar na sacola */
  slug?: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  reserve: boolean;
};

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; /** falha de sistema (banco fora do ar etc.), não do usuário */ transient?: boolean };

/** Resposta de um pedido registrado pelo cliente. */
export type PlacedOrder = {
  code: string;
  total: number;
  items: OrderItem[];
  message: string;
  whatsappUrl: string | null;
};

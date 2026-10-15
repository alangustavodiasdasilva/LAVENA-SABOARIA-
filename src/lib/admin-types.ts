import type { HeroSlide, OrderDTO, ProductDTO } from "./types";

export type AdminBagDTO = {
  id: string;
  name: string;
  imageUrl: string | null;
  amountPaid: number;
  quantity: number;
  margin: number;
  isActive: boolean;
  notes: string | null;
  /** preço de venda calculado */
  price: number;
};

export type MaterialDTO = {
  id: string;
  name: string;
  amountPaid: number;
  quantity: number;
  unit: string;
  notes: string | null;
};

export type RecipeDTO = {
  id: string;
  name: string;
  productId: string | null;
  batchYield: number;
  profitMargin: number;
  items: { materialId: string; quantity: number }[];
  laborCost: number;
  packagingCost: number;
  notes: string | null;
};

export type AdminSettingsDTO = {
  whatsappNumber: string | null;
  instagramUrl: string | null;
  announcement: string | null;
  deliveryInfo: string | null;
  heroSlides: HeroSlide[];
  siteTheme: string;
  giftImage: string | null;
};

export type AdminCategoryDTO = { id: string; name: string; slug: string; productCount: number };

export type LowStockItem = { productId: string; name: string; label: string | null; quantity: number };

export type DashboardStats = {
  newOrders: number;
  ordersLast30: number;
  revenueLast30: number;
  avgTicket: number;
  pendingPaymentCount: number;
  pendingPaymentTotal: number;
  productsVisible: number;
  productsHidden: number;
  outOfStock: number;
  lowStock: LowStockItem[];
  recentOrders: OrderDTO[];
  /** últimos 14 dias, do mais antigo ao mais recente */
  salesByDay: { date: string; label: string; total: number; count: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
  setup: {
    hasCategories: boolean;
    hasProducts: boolean;
    hasWhatsapp: boolean;
    hasHero: boolean;
    passwordChanged: boolean;
    storageConfigured: boolean;
  };
};

export type AdminProduct = ProductDTO;

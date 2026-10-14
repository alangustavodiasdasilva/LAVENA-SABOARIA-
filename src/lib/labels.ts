import type { DeliveryMethod, OrderStatus, StockStatus } from "./types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "Novo",
  CONFIRMED: "Confirmado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

export const DELIVERY_LABEL: Record<DeliveryMethod, string> = {
  TO_ARRANGE: "A combinar",
  PICKUP: "Retirada",
  DELIVERY: "Entrega",
};

export const STOCK_LABEL: Record<StockStatus, string> = {
  IN_STOCK: "Em estoque",
  IN_PRODUCTION: "Sob encomenda",
  OUT_OF_STOCK: "Esgotado",
};

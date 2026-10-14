import "server-only";
import type { Prisma } from "@prisma/client";
import { statusFromQuantity } from "./stock";
import type { OrderItem, StockStatus } from "./types";

type Tx = Prisma.TransactionClient;

/**
 * Desconta do estoque os itens do pedido que têm quantidade controlada.
 * Anota em cada item quantas unidades saíram (`deducted`) para poder devolver depois.
 * Itens sob encomenda (reserva) e itens sem controle de estoque não são tocados.
 */
export async function deductOrderStock(tx: Tx, items: OrderItem[]): Promise<OrderItem[]> {
  const out: OrderItem[] = [];
  for (const it of items) {
    const item = { ...it, deducted: 0 };
    if (!it.reserve && it.kind !== "bag") {
      if (it.kind === "product" && it.variantId) {
        const v = await tx.productVariant.findUnique({ where: { id: it.variantId } });
        if (v && v.stockStatus === "IN_STOCK" && v.stockQuantity > 0) {
          const dec = Math.min(v.stockQuantity, it.quantity);
          const qty = v.stockQuantity - dec;
          await tx.productVariant.update({
            where: { id: v.id },
            data: { stockQuantity: qty, stockStatus: statusFromQuantity(v.stockStatus as StockStatus, qty) },
          });
          item.deducted = dec;
        }
      } else if (it.kind === "product" && it.productId) {
        const p = await tx.product.findUnique({ where: { id: it.productId } });
        if (p && p.stockStatus === "IN_STOCK" && p.stockQuantity > 0) {
          const dec = Math.min(p.stockQuantity, it.quantity);
          const qty = p.stockQuantity - dec;
          await tx.product.update({
            where: { id: p.id },
            data: { stockQuantity: qty, stockStatus: statusFromQuantity(p.stockStatus as StockStatus, qty) },
          });
          item.deducted = dec;
        }
      } else if (it.kind === "kit" && it.kitId) {
        const k = await tx.kit.findUnique({ where: { id: it.kitId } });
        if (k && k.stockStatus === "IN_STOCK" && k.stockQuantity > 0) {
          const dec = Math.min(k.stockQuantity, it.quantity);
          const qty = k.stockQuantity - dec;
          await tx.kit.update({
            where: { id: k.id },
            data: { stockQuantity: qty, stockStatus: statusFromQuantity(k.stockStatus as StockStatus, qty) },
          });
          item.deducted = dec;
        }
      }
    }
    out.push(item);
  }
  return out;
}

/** Devolve ao estoque o que foi descontado antes (pedido cancelado). */
export async function restoreOrderStock(tx: Tx, items: OrderItem[]): Promise<OrderItem[]> {
  const out: OrderItem[] = [];
  for (const it of items) {
    const back = it.deducted || 0;
    if (back > 0) {
      if (it.kind === "product" && it.variantId) {
        const v = await tx.productVariant.findUnique({ where: { id: it.variantId } });
        if (v) {
          const qty = v.stockQuantity + back;
          await tx.productVariant.update({
            where: { id: v.id },
            data: { stockQuantity: qty, stockStatus: statusFromQuantity(v.stockStatus as StockStatus, qty) },
          });
        }
      } else if (it.kind === "product" && it.productId) {
        const p = await tx.product.findUnique({ where: { id: it.productId } });
        if (p) {
          const qty = p.stockQuantity + back;
          await tx.product.update({
            where: { id: p.id },
            data: { stockQuantity: qty, stockStatus: statusFromQuantity(p.stockStatus as StockStatus, qty) },
          });
        }
      } else if (it.kind === "kit" && it.kitId) {
        const k = await tx.kit.findUnique({ where: { id: it.kitId } });
        if (k) {
          const qty = k.stockQuantity + back;
          await tx.kit.update({
            where: { id: k.id },
            data: { stockQuantity: qty, stockStatus: statusFromQuantity(k.stockStatus as StockStatus, qty) },
          });
        }
      }
    }
    out.push({ ...it, deducted: 0 });
  }
  return out;
}

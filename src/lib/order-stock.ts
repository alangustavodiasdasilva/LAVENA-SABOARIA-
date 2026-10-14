import "server-only";
import type { Prisma } from "@prisma/client";
import { statusFromQuantity } from "./stock";
import type { OrderItem, StockStatus } from "./types";

type Tx = Prisma.TransactionClient;

type StockRow = { id: string; stockStatus: string; stockQuantity: number };

/** Operações de estoque de uma tabela (produto, variação ou kit). */
type StockTable = {
  find: (id: string) => Promise<StockRow | null>;
  /** Altera a quantidade só se ela ainda for `expected` (atualização condicional, sem corrida). */
  swap: (id: string, expected: number, data: { stockQuantity: number; stockStatus: StockStatus }) => Promise<number>;
};

function tables(tx: Tx): { variant: StockTable; product: StockTable; kit: StockTable } {
  return {
    variant: {
      find: (id) => tx.productVariant.findUnique({ where: { id } }),
      swap: async (id, expected, data) =>
        (await tx.productVariant.updateMany({ where: { id, stockQuantity: expected }, data })).count,
    },
    product: {
      find: (id) => tx.product.findUnique({ where: { id } }),
      swap: async (id, expected, data) =>
        (await tx.product.updateMany({ where: { id, stockQuantity: expected }, data })).count,
    },
    kit: {
      find: (id) => tx.kit.findUnique({ where: { id } }),
      swap: async (id, expected, data) =>
        (await tx.kit.updateMany({ where: { id, stockQuantity: expected }, data })).count,
    },
  };
}

function tableFor(t: ReturnType<typeof tables>, it: OrderItem): { table: StockTable; id: string } | null {
  if (it.kind === "product" && it.variantId) return { table: t.variant, id: it.variantId };
  if (it.kind === "product" && it.productId) return { table: t.product, id: it.productId };
  if (it.kind === "kit" && it.kitId) return { table: t.kit, id: it.kitId };
  return null;
}

const MAX_TRIES = 5;

/**
 * Compare-and-swap: lê a quantidade, calcula a nova e só grava se ninguém mexeu nesse meio-tempo.
 * Se mexeram, lê de novo e tenta outra vez. Evita descontar duas vezes em pedidos simultâneos.
 * `compute` devolve a nova quantidade e quantas unidades mudaram (ou null para não mexer).
 */
async function adjust(
  table: StockTable,
  id: string,
  compute: (row: StockRow) => { qty: number; moved: number } | null
): Promise<number> {
  for (let i = 0; i < MAX_TRIES; i++) {
    const row = await table.find(id);
    if (!row) return 0;
    const next = compute(row);
    if (!next) return 0;
    const status = statusFromQuantity(row.stockStatus as StockStatus, next.qty);
    if ((await table.swap(id, row.stockQuantity, { stockQuantity: next.qty, stockStatus: status })) === 1) {
      return next.moved;
    }
  }
  throw new Error("Estoque alterado ao mesmo tempo por outra operação. Tente de novo.");
}

/**
 * Desconta do estoque os itens do pedido que têm quantidade controlada.
 * Anota em cada item quantas unidades saíram (`deducted`) para poder devolver depois.
 * Itens sob encomenda (reserva) e itens sem controle de estoque não são tocados.
 */
export async function deductOrderStock(tx: Tx, items: OrderItem[]): Promise<OrderItem[]> {
  const t = tables(tx);
  const out: OrderItem[] = [];
  for (const it of items) {
    const item = { ...it, deducted: 0 };
    const target = !it.reserve && it.kind !== "bag" ? tableFor(t, it) : null;
    if (target) {
      item.deducted = await adjust(target.table, target.id, (row) => {
        if (row.stockStatus !== "IN_STOCK" || row.stockQuantity <= 0) return null;
        const dec = Math.min(row.stockQuantity, it.quantity);
        return { qty: row.stockQuantity - dec, moved: dec };
      });
    }
    out.push(item);
  }
  return out;
}

/** Devolve ao estoque o que foi descontado antes (pedido cancelado). */
export async function restoreOrderStock(tx: Tx, items: OrderItem[]): Promise<OrderItem[]> {
  const t = tables(tx);
  const out: OrderItem[] = [];
  for (const it of items) {
    const back = it.deducted || 0;
    const target = back > 0 ? tableFor(t, it) : null;
    if (target) {
      await adjust(target.table, target.id, (row) => ({ qty: row.stockQuantity + back, moved: back }));
    }
    out.push({ ...it, deducted: 0 });
  }
  return out;
}

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { deductOrderStock, restoreOrderStock } from "../order-stock";
import type { OrderItem } from "../types";

type Row = { id: string; stockStatus: string; stockQuantity: number };

/** Banco falso em memória, com `updateMany` condicional como o do Prisma. */
function fakeTx(rows: Record<string, Row>, onFirstRead?: () => void) {
  let reads = 0;
  const table = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      const r = rows[where.id];
      const copy = r ? { ...r } : null;
      if (reads++ === 0) onFirstRead?.();
      return copy;
    },
    updateMany: async ({ where, data }: { where: { id: string; stockQuantity: number }; data: Partial<Row> }) => {
      const r = rows[where.id];
      if (!r || r.stockQuantity !== where.stockQuantity) return { count: 0 };
      Object.assign(r, data);
      return { count: 1 };
    },
  };
  return { productVariant: table, product: table, kit: table } as never;
}

const item = (over: Partial<OrderItem> = {}): OrderItem => ({
  kind: "product",
  productId: "p1",
  name: "Sabonete",
  unitPrice: 10,
  quantity: 2,
  ...over,
});

describe("baixa de estoque", () => {
  it("desconta e anota as unidades", async () => {
    const rows = { p1: { id: "p1", stockStatus: "IN_STOCK", stockQuantity: 5 } };
    const out = await deductOrderStock(fakeTx(rows), [item()]);
    expect(out[0].deducted).toBe(2);
    expect(rows.p1.stockQuantity).toBe(3);
  });

  it("zerar a quantidade muda o status para esgotado", async () => {
    const rows = { p1: { id: "p1", stockStatus: "IN_STOCK", stockQuantity: 2 } };
    await deductOrderStock(fakeTx(rows), [item()]);
    expect(rows.p1.stockStatus).toBe("OUT_OF_STOCK");
  });

  it("estoque 0 em estoque (sem controle) não é tocado", async () => {
    const rows = { p1: { id: "p1", stockStatus: "IN_STOCK", stockQuantity: 0 } };
    const out = await deductOrderStock(fakeTx(rows), [item()]);
    expect(out[0].deducted).toBe(0);
    expect(rows.p1.stockQuantity).toBe(0);
  });

  it("não vende além do que tem", async () => {
    const rows = { p1: { id: "p1", stockStatus: "IN_STOCK", stockQuantity: 1 } };
    const out = await deductOrderStock(fakeTx(rows), [item({ quantity: 5 })]);
    expect(out[0].deducted).toBe(1);
    expect(rows.p1.stockQuantity).toBe(0);
  });

  it("reserva e sacola não descontam", async () => {
    const rows = { p1: { id: "p1", stockStatus: "IN_STOCK", stockQuantity: 5 } };
    const out = await deductOrderStock(fakeTx(rows), [item({ reserve: true }), item({ kind: "bag", bagId: "b1" })]);
    expect(out.map((i) => i.deducted)).toEqual([0, 0]);
    expect(rows.p1.stockQuantity).toBe(5);
  });

  it("outra venda no meio da leitura: relê e não desconta duas vezes", async () => {
    const rows = { p1: { id: "p1", stockStatus: "IN_STOCK", stockQuantity: 5 } };
    // depois da 1ª leitura, outro pedido leva 3 unidades
    const tx = fakeTx(rows, () => {
      rows.p1.stockQuantity = 2;
    });
    const out = await deductOrderStock(tx, [item({ quantity: 2 })]);
    expect(out[0].deducted).toBe(2);
    expect(rows.p1.stockQuantity).toBe(0); // 5 - 3 (outro) - 2 (este), sem perder nenhuma baixa
  });

  it("devolve ao estoque e reativa o produto esgotado", async () => {
    const rows = { p1: { id: "p1", stockStatus: "OUT_OF_STOCK", stockQuantity: 0 } };
    const out = await restoreOrderStock(fakeTx(rows), [item({ deducted: 2 })]);
    expect(rows.p1.stockQuantity).toBe(2);
    expect(rows.p1.stockStatus).toBe("IN_STOCK");
    expect(out[0].deducted).toBe(0);
  });
});

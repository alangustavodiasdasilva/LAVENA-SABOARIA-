"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { adminAction, clientIp } from "@/lib/auth";
import { UserError, parseInput, runAction } from "@/lib/action";
import { getCatalogForOrder, getPublicSettings } from "@/lib/data";
import { parseOrderItems } from "@/lib/mappers";
import { deductOrderStock, restoreOrderStock } from "@/lib/order-stock";
import { generateOrderCode, quoteCartLines, resolveOrderLines, type OrderLineInput } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";
import { placeOrderSchema, type PlaceOrderInput } from "@/lib/schemas";
import { ORDER_STATUSES, type OrderStatus, type PlacedOrder } from "@/lib/types";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";

const idSchema = z.string().min(1).max(64);

// ─── Cliente ───

/** Registra o pedido (preços sempre recalculados no servidor) e prepara a mensagem do WhatsApp. */
export async function placeOrder(input: PlaceOrderInput) {
  return runAction<PlacedOrder>("placeOrder", async () => {
    const ip = await clientIp();
    if (!rateLimit(`order:${ip}`, 8, 10 * 60 * 1000).ok) {
      throw new UserError("Muitos pedidos em sequência. Aguarde alguns minutos e tente de novo.");
    }
    const data = parseInput(placeOrderSchema, input);

    if (data.website) {
      // campo isca preenchido: é robô. Responde "sucesso" sem gravar nada.
      return { code: "LV-00000", total: 0, items: [], message: "", whatsappUrl: null };
    }
    if (data.type === "GIFT" && (!data.recipientName || !data.cardMessage)) {
      throw new UserError("Informe o nome de quem vai receber e a mensagem do cartão.");
    }
    if (data.deliveryMethod === "DELIVERY" && (data.address?.length ?? 0) < 5) {
      throw new UserError("Informe o endereço para entrega.");
    }

    const lines: OrderLineInput[] = data.lines.map((l) => ({
      kind: l.kind,
      productId: l.productId,
      variantId: l.variantId || "",
      kitId: l.kitId,
      quantity: l.quantity,
    }));
    const bagId = data.type === "GIFT" ? data.bagId : null;
    const catalog = await getCatalogForOrder(lines, bagId);
    const resolved = resolveOrderLines(lines, catalog, bagId);
    if (resolved.errors.length > 0) throw new UserError([...new Set(resolved.errors)].join(" "));
    if (!resolved.items.some((i) => i.kind !== "bag")) throw new UserError("Seu pedido está vazio.");

    let code = "";
    for (let attempt = 0; attempt < 6; attempt++) {
      code = generateOrderCode();
      try {
        await prisma.order.create({
          data: {
            code,
            type: data.type,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            deliveryMethod: data.deliveryMethod,
            address: data.address,
            notes: data.notes,
            recipientName: data.type === "GIFT" ? data.recipientName : null,
            cardMessage: data.type === "GIFT" ? data.cardMessage : null,
            itemsJson: resolved.items as unknown as Prisma.InputJsonValue,
            subtotal: resolved.subtotal,
            total: resolved.subtotal,
          },
        });
        break;
      } catch (e) {
        const duplicate = typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
        if (!duplicate || attempt === 5) throw e;
      }
    }

    const settings = await getPublicSettings();
    const message = buildOrderMessage({
      code,
      type: data.type,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deliveryMethod: data.deliveryMethod,
      address: data.address,
      notes: data.notes,
      recipientName: data.recipientName,
      cardMessage: data.cardMessage,
      items: resolved.items,
      total: resolved.subtotal,
    });
    revalidatePath("/admin", "layout");
    return {
      code,
      total: resolved.subtotal,
      items: resolved.items,
      message,
      whatsappUrl: settings.whatsappNumber ? whatsappLink(settings.whatsappNumber, message) : null,
    };
  });
}

const quoteSchema = z
  .array(
    z.object({
      key: z.string().max(200),
      kind: z.enum(["product", "kit"]),
      productId: z.string().max(64).optional(),
      variantId: z.string().max(64).nullish(),
      kitId: z.string().max(64).optional(),
      quantity: z.number().int().min(1).max(99),
    })
  )
  .max(60);

/** Atualiza preço/disponibilidade das linhas do carrinho com o catálogo atual. */
export async function quoteCart(input: z.input<typeof quoteSchema>) {
  return runAction("quoteCart", async () => {
    const lines = parseInput(quoteSchema, input).map((l) => ({ ...l, variantId: l.variantId || "" }));
    if (lines.length === 0) return [];
    const catalog = await getCatalogForOrder(lines, null);
    return quoteCartLines(lines, catalog);
  });
}

// ─── Admin ───

export async function setOrderStatus(id: string, status: OrderStatus, deductStock = false) {
  return adminAction("setOrderStatus", async () => {
    const orderId = parseInput(idSchema, id);
    const next = parseInput(z.enum(ORDER_STATUSES, { error: "Status inválido." }), status);
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
      let items = parseOrderItems(order.itemsJson);
      let stockDeducted = order.stockDeducted;
      if (next === "CANCELED" && order.stockDeducted) {
        items = await restoreOrderStock(tx, items);
        stockDeducted = false;
      } else if ((next === "CONFIRMED" || next === "DELIVERED") && !order.stockDeducted && deductStock) {
        items = await deductOrderStock(tx, items);
        stockDeducted = true;
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: next, stockDeducted, itemsJson: items as unknown as Prisma.InputJsonValue },
      });
    });
    revalidatePath("/", "layout");
  });
}

export async function setOrderPaid(id: string, paid: boolean) {
  return adminAction("setOrderPaid", async () => {
    await prisma.order.update({ where: { id: parseInput(idSchema, id) }, data: { paid: !!paid } });
    revalidatePath("/admin", "layout");
  });
}

export async function saveOrderNotes(id: string, notes: string) {
  return adminAction("saveOrderNotes", async () => {
    const text = parseInput(z.string().trim().max(1000, "Observação muito longa."), notes ?? "");
    await prisma.order.update({ where: { id: parseInput(idSchema, id) }, data: { adminNotes: text || null } });
    revalidatePath("/admin", "layout");
  });
}

export async function deleteOrder(id: string) {
  return adminAction("deleteOrder", async () => {
    const orderId = parseInput(idSchema, id);
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
      // se o estoque já tinha sido descontado, devolve antes de apagar
      if (order.stockDeducted) await restoreOrderStock(tx, parseOrderItems(order.itemsJson));
      await tx.order.delete({ where: { id: orderId } });
    });
    revalidatePath("/", "layout");
  });
}

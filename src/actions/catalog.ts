"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { adminAction } from "@/lib/auth";
import { UserError, parseInput } from "@/lib/action";
import { categorySchema, productSchema, type ProductInput } from "@/lib/schemas";
import { uniqueSlug } from "@/lib/slug";
import { statusFromQuantity } from "@/lib/stock";
import { STOCK_STATUSES, type StockStatus } from "@/lib/types";

const refresh = () => revalidatePath("/", "layout");
const idSchema = z.string().min(1).max(64);
const statusSchema = z.enum(STOCK_STATUSES, { error: "Status de estoque inválido." });
const qtySchema = z.number({ error: "Quantidade inválida." }).int("Quantidade inválida.").min(0, "Quantidade inválida.").max(100000);

// ─── Categorias ───
export async function createCategory(name: string) {
  return adminAction("createCategory", async () => {
    const { name: n } = parseInput(categorySchema, { name });
    const c = await prisma.category.create({ data: { name: n, slug: await uniqueSlug("category", n) } });
    refresh();
    return { id: c.id };
  });
}

export async function renameCategory(id: string, name: string) {
  return adminAction("renameCategory", async () => {
    const { name: n } = parseInput(categorySchema, { name });
    await prisma.category.update({ where: { id: parseInput(idSchema, id) }, data: { name: n } });
    refresh();
  });
}

export async function deleteCategory(id: string) {
  return adminAction("deleteCategory", async () => {
    const cid = parseInput(idSchema, id);
    const count = await prisma.product.count({ where: { categoryId: cid } });
    if (count > 0) {
      throw new UserError(
        `Esta categoria tem ${count} ${count === 1 ? "produto" : "produtos"}. Mova ou exclua os produtos antes de apagar a categoria.`
      );
    }
    await prisma.category.delete({ where: { id: cid } });
    refresh();
  });
}

// ─── Produtos ───
export async function createProduct(input: ProductInput) {
  return adminAction("createProduct", async () => {
    const data = parseInput(productSchema, input);
    const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) throw new UserError("Categoria não encontrada.");
    const { variants, ...rest } = data;
    const product = await prisma.product.create({
      data: {
        ...rest,
        slug: await uniqueSlug("product", data.name),
        variants: { create: variants.map(({ id: _id, ...v }) => v) },
      },
      select: { id: true, slug: true },
    });
    refresh();
    return product;
  });
}

export async function updateProduct(id: string, input: ProductInput) {
  return adminAction("updateProduct", async () => {
    const productId = parseInput(idSchema, id);
    const data = parseInput(productSchema, input);
    const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) throw new UserError("Categoria não encontrada.");
    const { variants, ...rest } = data;

    await prisma.$transaction(async (tx) => {
      // O endereço (slug) não muda ao renomear, para não quebrar links já compartilhados.
      await tx.product.update({ where: { id: productId }, data: rest });
      const current = await tx.productVariant.findMany({ where: { productId }, select: { id: true } });
      const currentIds = new Set(current.map((v) => v.id));
      const keep = new Set(variants.filter((v) => v.id && currentIds.has(v.id)).map((v) => v.id as string));
      const toDelete = [...currentIds].filter((x) => !keep.has(x));
      if (toDelete.length > 0) await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } });
      for (const v of variants) {
        const { id: variantId, ...vdata } = v;
        if (variantId && currentIds.has(variantId)) {
          await tx.productVariant.update({ where: { id: variantId }, data: vdata });
        } else {
          await tx.productVariant.create({ data: { ...vdata, productId } });
        }
      }
    });
    refresh();
  });
}

export async function deleteProduct(id: string) {
  return adminAction("deleteProduct", async () => {
    const productId = parseInput(idSchema, id);
    await prisma.$transaction(async (tx) => {
      // tira o produto dos kits que o usavam
      const kits = await tx.kit.findMany({ where: { productIds: { has: productId } }, select: { id: true, productIds: true } });
      for (const k of kits) {
        await tx.kit.update({ where: { id: k.id }, data: { productIds: k.productIds.filter((x) => x !== productId) } });
      }
      await tx.product.delete({ where: { id: productId } });
    });
    refresh();
  });
}

export async function setProductFlags(id: string, flags: { isFeatured?: boolean; isVisible?: boolean }) {
  return adminAction("setProductFlags", async () => {
    const data: { isFeatured?: boolean; isVisible?: boolean } = {};
    if (typeof flags.isFeatured === "boolean") data.isFeatured = flags.isFeatured;
    if (typeof flags.isVisible === "boolean") data.isVisible = flags.isVisible;
    await prisma.product.update({ where: { id: parseInput(idSchema, id) }, data });
    refresh();
  });
}

// ─── Estoque ───
export async function setProductStockStatus(id: string, status: StockStatus) {
  return adminAction("setProductStockStatus", async () => {
    await prisma.product.update({
      where: { id: parseInput(idSchema, id) },
      data: { stockStatus: parseInput(statusSchema, status) },
    });
    refresh();
  });
}

export async function setProductStock(id: string, quantity: number) {
  return adminAction("setProductStock", async () => {
    const pid = parseInput(idSchema, id);
    const qty = parseInput(qtySchema, quantity);
    const p = await prisma.product.findUniqueOrThrow({ where: { id: pid }, select: { stockStatus: true } });
    await prisma.product.update({
      where: { id: pid },
      data: { stockQuantity: qty, stockStatus: statusFromQuantity(p.stockStatus as StockStatus, qty) },
    });
    refresh();
  });
}

export async function adjustProductStock(id: string, delta: number) {
  return adminAction("adjustProductStock", async () => {
    const pid = parseInput(idSchema, id);
    const d = parseInput(z.number().int().min(-1000).max(1000), delta);
    const p = await prisma.product.findUniqueOrThrow({ where: { id: pid }, select: { stockStatus: true, stockQuantity: true } });
    const qty = Math.max(0, p.stockQuantity + d);
    await prisma.product.update({
      where: { id: pid },
      data: { stockQuantity: qty, stockStatus: statusFromQuantity(p.stockStatus as StockStatus, qty) },
    });
    refresh();
  });
}

export async function setVariantStock(variantId: string, quantity: number) {
  return adminAction("setVariantStock", async () => {
    const vid = parseInput(idSchema, variantId);
    const qty = parseInput(qtySchema, quantity);
    const v = await prisma.productVariant.findUniqueOrThrow({ where: { id: vid }, select: { stockStatus: true } });
    await prisma.productVariant.update({
      where: { id: vid },
      data: { stockQuantity: qty, stockStatus: statusFromQuantity(v.stockStatus as StockStatus, qty) },
    });
    refresh();
  });
}

export async function adjustVariantStock(variantId: string, delta: number) {
  return adminAction("adjustVariantStock", async () => {
    const vid = parseInput(idSchema, variantId);
    const d = parseInput(z.number().int().min(-1000).max(1000), delta);
    const v = await prisma.productVariant.findUniqueOrThrow({ where: { id: vid }, select: { stockStatus: true, stockQuantity: true } });
    const qty = Math.max(0, v.stockQuantity + d);
    await prisma.productVariant.update({
      where: { id: vid },
      data: { stockQuantity: qty, stockStatus: statusFromQuantity(v.stockStatus as StockStatus, qty) },
    });
    refresh();
  });
}

export async function setVariantStockStatus(variantId: string, status: StockStatus) {
  return adminAction("setVariantStockStatus", async () => {
    await prisma.productVariant.update({
      where: { id: parseInput(idSchema, variantId) },
      data: { stockStatus: parseInput(statusSchema, status) },
    });
    refresh();
  });
}

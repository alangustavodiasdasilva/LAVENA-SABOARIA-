"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { adminAction } from "@/lib/auth";
import { parseInput } from "@/lib/action";
import { bagSchema, kitSchema, type BagInput, type KitInput } from "@/lib/schemas";
import { uniqueSlug } from "@/lib/slug";

const refresh = () => revalidatePath("/", "layout");
const idSchema = z.string().min(1).max(64);

export async function createKit(input: KitInput) {
  return adminAction("createKit", async () => {
    const data = parseInput(kitSchema, input);
    const kit = await prisma.kit.create({
      data: { ...data, slug: await uniqueSlug("kit", data.name) },
      select: { id: true, slug: true },
    });
    refresh();
    return kit;
  });
}

export async function updateKit(id: string, input: KitInput) {
  return adminAction("updateKit", async () => {
    const data = parseInput(kitSchema, input);
    await prisma.kit.update({ where: { id: parseInput(idSchema, id) }, data });
    refresh();
  });
}

export async function deleteKit(id: string) {
  return adminAction("deleteKit", async () => {
    await prisma.kit.delete({ where: { id: parseInput(idSchema, id) } });
    refresh();
  });
}

export async function setKitActive(id: string, isActive: boolean) {
  return adminAction("setKitActive", async () => {
    await prisma.kit.update({ where: { id: parseInput(idSchema, id) }, data: { isActive: !!isActive } });
    refresh();
  });
}

// ─── Sacolas de presente ───
export async function createBag(input: BagInput) {
  return adminAction("createBag", async () => {
    const data = parseInput(bagSchema, input);
    const bag = await prisma.bag.create({ data, select: { id: true } });
    refresh();
    return bag;
  });
}

export async function updateBag(id: string, input: BagInput) {
  return adminAction("updateBag", async () => {
    const data = parseInput(bagSchema, input);
    await prisma.bag.update({ where: { id: parseInput(idSchema, id) }, data });
    refresh();
  });
}

export async function deleteBag(id: string) {
  return adminAction("deleteBag", async () => {
    await prisma.bag.delete({ where: { id: parseInput(idSchema, id) } });
    refresh();
  });
}

export async function setBagActive(id: string, isActive: boolean) {
  return adminAction("setBagActive", async () => {
    await prisma.bag.update({ where: { id: parseInput(idSchema, id) }, data: { isActive: !!isActive } });
    refresh();
  });
}

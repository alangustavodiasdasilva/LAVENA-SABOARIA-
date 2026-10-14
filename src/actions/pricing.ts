"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { adminAction } from "@/lib/auth";
import { parseInput } from "@/lib/action";
import { materialSchema, recipeSchema, type MaterialInput, type RecipeInput } from "@/lib/schemas";

const refresh = () => revalidatePath("/admin/precificacao");
const idSchema = z.string().min(1).max(64);

export async function createMaterial(input: MaterialInput) {
  return adminAction("createMaterial", async () => {
    await prisma.pricingMaterial.create({ data: parseInput(materialSchema, input) });
    refresh();
  });
}

export async function updateMaterial(id: string, input: MaterialInput) {
  return adminAction("updateMaterial", async () => {
    await prisma.pricingMaterial.update({ where: { id: parseInput(idSchema, id) }, data: parseInput(materialSchema, input) });
    refresh();
  });
}

export async function deleteMaterial(id: string) {
  return adminAction("deleteMaterial", async () => {
    await prisma.pricingMaterial.delete({ where: { id: parseInput(idSchema, id) } });
    refresh();
  });
}

function recipeData(input: RecipeInput) {
  const d = parseInput(recipeSchema, input);
  return {
    name: d.name,
    productId: d.productId,
    batchYield: d.batchYield,
    profitMargin: d.profitMargin,
    itemsJson: d.items as unknown as Prisma.InputJsonValue,
    laborCost: d.laborCost,
    packagingCost: d.packagingCost,
    notes: d.notes,
  };
}

export async function createRecipe(input: RecipeInput) {
  return adminAction("createRecipe", async () => {
    await prisma.pricingRecipe.create({ data: recipeData(input) });
    refresh();
  });
}

export async function updateRecipe(id: string, input: RecipeInput) {
  return adminAction("updateRecipe", async () => {
    await prisma.pricingRecipe.update({ where: { id: parseInput(idSchema, id) }, data: recipeData(input) });
    refresh();
  });
}

export async function deleteRecipe(id: string) {
  return adminAction("deleteRecipe", async () => {
    await prisma.pricingRecipe.delete({ where: { id: parseInput(idSchema, id) } });
    refresh();
  });
}

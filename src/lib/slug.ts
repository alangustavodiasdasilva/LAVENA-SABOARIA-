import "server-only";
import prisma from "./prisma";
import { slugify } from "./format";

type Model = "product" | "kit" | "category";

async function exists(model: Model, slug: string, excludeId?: string): Promise<boolean> {
  const where = { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) };
  if (model === "product") return !!(await prisma.product.findFirst({ where, select: { id: true } }));
  if (model === "kit") return !!(await prisma.kit.findFirst({ where, select: { id: true } }));
  return !!(await prisma.category.findFirst({ where, select: { id: true } }));
}

/** slug amigável e único: "sabonete-de-mel", "sabonete-de-mel-2", ... */
export async function uniqueSlug(model: Model, name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  for (let i = 2; await exists(model, candidate, excludeId); i++) candidate = `${base}-${i}`;
  return candidate;
}

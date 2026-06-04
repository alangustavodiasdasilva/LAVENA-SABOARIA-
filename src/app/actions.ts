"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { cookies } from "next/headers";
import { isStorageConfigured, uploadToSupabase } from "@/lib/storage";

// ADMIN AUTH
export async function loginAdmin(password: string) {
  const correctPassword = process.env.ADMIN_PASSWORD || '212472';
  if (password === correctPassword) {
    // Awaiting cookies() is required in next 15+ 
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'authenticated', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/' 
    });
    return true;
  }
  return false;
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

export async function checkAdmin() {
  const cookieStore = await cookies();
  return cookieStore.has('admin_session');
}

// UPLOAD
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_BYTES = 10 * 1024 * 1024;

async function requireAdmin() {
  if (!(await checkAdmin())) {
    throw new Error("Acesso negado.");
  }
}

export async function uploadImage(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("Nenhum arquivo enviado.");
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error("Formato inválido. Use JPG, PNG ou WEBP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Imagem muito grande. Máximo 10MB.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const processedBuffer = await sharp(buffer)
    .rotate()
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
    .webp({ quality: 92, effort: 6, smartSubsample: true })
    .toBuffer();

  // Caminho 1: Supabase Storage (produção e dev com env configurado)
  if (isStorageConfigured) {
    const filename = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    try {
      const publicUrl = await uploadToSupabase(processedBuffer, filename, "image/webp");
      return publicUrl;
    } catch (err: any) {
      console.error("Supabase upload falhou, caindo para data URL:", err?.message);
    }
  }

  // Caminho 2: fallback em data URL (funciona em qualquer host, mas incha o banco)
  const base64Data = processedBuffer.toString("base64");
  return `data:image/webp;base64,${base64Data}`;
}

// SLUG HELPER
function generateSlug(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, "");
}

// SETTINGS
export async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: "default",
        whatsappNumber: "5511999999999",
      },
    });
  }
  return settings;
}

export async function updateSettings(data: {
  whatsappNumber?: string;
  heroImageUrl?: string;
  heroImageUrlLink?: string;
  heroImages?: string[];
  heroImageLinks?: string[];
}) {
  await requireAdmin();
  const result = await prisma.settings.update({
    where: { id: "default" },
    data,
  });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/carrinho");
  return result;
}

export async function updateHeroImages(images: string[], links?: string[]) {
  await requireAdmin();
  const updateData: { heroImages: string[]; heroImageLinks?: string[] } = { heroImages: images };
  if (links) {
    updateData.heroImageLinks = links;
  }
  const result = await prisma.settings.update({
    where: { id: "default" },
    data: updateData,
  });
  revalidatePath("/admin");
  revalidatePath("/");
  return result;
}

export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function createCategory(name: string) {
  await requireAdmin();
  if (!name?.trim()) throw new Error("Nome da categoria é obrigatório.");
  const slug = generateSlug(name);
  
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.category.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const category = await prisma.category.create({
    data: { name, slug: uniqueSlug },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  return category;
}

export async function updateCategory(id: string, name: string) {
  await requireAdmin();
  if (!name?.trim()) throw new Error("Nome da categoria é obrigatório.");
  const slug = generateSlug(name);
  
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.category.findFirst({ where: { slug: uniqueSlug, NOT: { id } } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const category = await prisma.category.update({
    where: { id },
    data: { name, slug: uniqueSlug },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  return category;
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const [_, category] = await prisma.$transaction([
    prisma.product.deleteMany({ where: { categoryId: id } }),
    prisma.category.delete({ where: { id } })
  ]);
  
  revalidatePath("/admin");
  revalidatePath("/");
  return category;
}

// PRODUCTS
export async function getProducts() {
  return await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export type StockStatus = "IN_STOCK" | "IN_PRODUCTION" | "OUT_OF_STOCK";

export type ProductInput = {
  name: string;
  description: string;
  benefits?: string;
  ingredients?: string;
  price: number;
  salePrice?: number | null;
  size?: string;
  imageUrl?: string;
  images?: string[];
  categoryId: string;
  isFeatured?: boolean;
  stockStatus?: StockStatus;
  stockQuantity?: number;
  lowStockAlert?: number;
};

function validateProduct(data: ProductInput) {
  if (!data.name?.trim()) throw new Error("Nome do produto é obrigatório.");
  if (!data.categoryId) throw new Error("Selecione uma categoria.");
  if (Number.isNaN(data.price) || data.price < 0) throw new Error("Preço inválido.");
  if (data.salePrice != null && data.salePrice !== 0) {
    if (Number.isNaN(data.salePrice) || data.salePrice < 0) {
      throw new Error("Preço promocional inválido.");
    }
    if (data.salePrice >= data.price) {
      throw new Error("Preço promocional deve ser menor que o preço normal.");
    }
  }
  if (!data.description?.trim()) throw new Error("Descrição é obrigatória.");
}

export async function createProduct(data: ProductInput) {
  await requireAdmin();
  validateProduct(data);
  const slug = generateSlug(data.name);
  
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      slug: uniqueSlug,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  return product;
}

export async function updateProduct(id: string, data: ProductInput) {
  await requireAdmin();
  validateProduct(data);
  const slug = generateSlug(data.name);
  
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.product.findFirst({ where: { slug: uniqueSlug, NOT: { id } } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      slug: uniqueSlug,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  return product;
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const product = await prisma.product.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/");
  return product;
}

export async function toggleFeatured(id: string, isFeatured: boolean) {
  await requireAdmin();
  const product = await prisma.product.update({
    where: { id },
    data: { isFeatured },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  return product;
}

export async function updateStockStatus(id: string, status: StockStatus) {
  await requireAdmin();
  const product = await prisma.product.update({
    where: { id },
    data: { stockStatus: status },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  return product;
}

export async function updateStockQuantity(id: string, quantity: number) {
  await requireAdmin();
  if (Number.isNaN(quantity) || quantity < 0) {
    throw new Error("Quantidade inválida.");
  }
  const qty = Math.floor(quantity);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new Error("Produto não encontrado.");

  // Auto-status: se cai pra 0 e estava em estoque → esgotado; se sobe de 0 com status esgotado → em estoque
  let nextStatus = existing.stockStatus;
  if (qty === 0 && existing.stockStatus === "IN_STOCK") {
    nextStatus = "OUT_OF_STOCK";
  } else if (qty > 0 && existing.stockStatus === "OUT_OF_STOCK") {
    nextStatus = "IN_STOCK";
  }

  const product = await prisma.product.update({
    where: { id },
    data: { stockQuantity: qty, stockStatus: nextStatus },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  return product;
}

export async function adjustStock(id: string, delta: number) {
  await requireAdmin();
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new Error("Produto não encontrado.");
  const next = Math.max(0, existing.stockQuantity + delta);
  return updateStockQuantity(id, next);
}

export async function bulkUpdateStock(updates: { id: string; quantity: number }[]) {
  await requireAdmin();
  await prisma.$transaction(
    updates.map((u) =>
      prisma.product.update({
        where: { id: u.id },
        data: { stockQuantity: Math.max(0, Math.floor(u.quantity)) },
      })
    )
  );
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

// ═══════════════════════════════════════
// KITS
// ═══════════════════════════════════════
export type KitInput = {
  name: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string;
  images?: string[];
  productIds: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  stockQuantity?: number;
  stockStatus?: StockStatus;
};

export async function getKits() {
  try {
    return await prisma.kit.findMany({ orderBy: { createdAt: "desc" } });
  } catch (e) {
    console.error("getKits failed (provavelmente Prisma stale, reinicie o dev):", e);
    return [];
  }
}

export async function getActiveKits() {
  try {
    return await prisma.kit.findMany({
      where: { isActive: true },
      orderBy: { isFeatured: "desc" },
    });
  } catch (e) {
    console.error("getActiveKits failed:", e);
    return [];
  }
}

function validateKit(data: KitInput) {
  if (!data.name?.trim()) throw new Error("Nome do kit é obrigatório.");
  if (Number.isNaN(data.price) || data.price < 0) throw new Error("Preço inválido.");
  if (data.salePrice != null && data.salePrice !== 0) {
    if (Number.isNaN(data.salePrice) || data.salePrice < 0) throw new Error("Preço promocional inválido.");
    if (data.salePrice >= data.price) throw new Error("Preço promocional deve ser menor que o preço normal.");
  }
  if (!data.productIds || data.productIds.length === 0) throw new Error("Selecione ao menos 1 produto para o kit.");
}

export async function createKit(data: KitInput) {
  await requireAdmin();
  validateKit(data);
  const slug = generateSlug(data.name);
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.kit.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter++}`;
  }
  const kit = await prisma.kit.create({
    data: { ...data, slug: uniqueSlug },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/presente");
  return kit;
}

export async function updateKit(id: string, data: KitInput) {
  await requireAdmin();
  validateKit(data);
  const slug = generateSlug(data.name);
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.kit.findFirst({ where: { slug: uniqueSlug, NOT: { id } } })) {
    uniqueSlug = `${slug}-${counter++}`;
  }
  const kit = await prisma.kit.update({
    where: { id },
    data: { ...data, slug: uniqueSlug },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/presente");
  return kit;
}

export async function deleteKit(id: string) {
  await requireAdmin();
  const kit = await prisma.kit.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/presente");
  return kit;
}

export async function toggleKitActive(id: string, isActive: boolean) {
  await requireAdmin();
  const kit = await prisma.kit.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/presente");
  return kit;
}

// ═══════════════════════════════════════
// MATÉRIAS-PRIMAS (PRICING)
// ═══════════════════════════════════════
export type MaterialInput = {
  name: string;
  amountPaid: number;
  quantity: number;
  unit: string;
  notes?: string;
};

export async function getMaterials() {
  try {
    return await prisma.pricingMaterial.findMany({ orderBy: { name: "asc" } });
  } catch (e) {
    console.error("getMaterials failed:", e);
    return [];
  }
}

export async function createMaterial(data: MaterialInput) {
  await requireAdmin();
  if (!data.name?.trim()) throw new Error("Nome da matéria-prima é obrigatório.");
  if (Number.isNaN(data.amountPaid) || data.amountPaid < 0) throw new Error("Valor pago inválido.");
  if (Number.isNaN(data.quantity) || data.quantity <= 0) throw new Error("Quantidade deve ser maior que zero.");
  const m = await prisma.pricingMaterial.create({ data });
  revalidatePath("/admin");
  return m;
}

export async function updateMaterial(id: string, data: MaterialInput) {
  await requireAdmin();
  if (!data.name?.trim()) throw new Error("Nome da matéria-prima é obrigatório.");
  if (Number.isNaN(data.amountPaid) || data.amountPaid < 0) throw new Error("Valor pago inválido.");
  if (Number.isNaN(data.quantity) || data.quantity <= 0) throw new Error("Quantidade deve ser maior que zero.");
  const m = await prisma.pricingMaterial.update({ where: { id }, data });
  revalidatePath("/admin");
  return m;
}

export async function deleteMaterial(id: string) {
  await requireAdmin();
  const m = await prisma.pricingMaterial.delete({ where: { id } });
  revalidatePath("/admin");
  return m;
}

// ═══════════════════════════════════════
// RECEITAS (PRICING)
// ═══════════════════════════════════════
export type RecipeItem = { materialId: string; quantity: number };

export type RecipeInput = {
  name: string;
  productId?: string | null;
  batchYield: number;
  profitMargin: number;
  items: RecipeItem[];
  laborCost?: number;
  packagingCost?: number;
  notes?: string;
};

export async function getRecipes() {
  try {
    return await prisma.pricingRecipe.findMany({ orderBy: { updatedAt: "desc" } });
  } catch (e) {
    console.error("getRecipes failed:", e);
    return [];
  }
}

export async function createRecipe(data: RecipeInput) {
  await requireAdmin();
  if (!data.name?.trim()) throw new Error("Nome da receita é obrigatório.");
  if (Number.isNaN(data.batchYield) || data.batchYield <= 0) throw new Error("Quantidade produzida inválida.");
  if (Number.isNaN(data.profitMargin) || data.profitMargin < 0) throw new Error("Margem de lucro inválida.");
  const r = await prisma.pricingRecipe.create({
    data: {
      name: data.name.trim(),
      productId: data.productId || null,
      batchYield: data.batchYield,
      profitMargin: data.profitMargin,
      itemsJson: data.items as any,
      laborCost: data.laborCost || 0,
      packagingCost: data.packagingCost || 0,
      notes: data.notes || null,
    },
  });
  revalidatePath("/admin");
  return r;
}

export async function updateRecipe(id: string, data: RecipeInput) {
  await requireAdmin();
  if (!data.name?.trim()) throw new Error("Nome da receita é obrigatório.");
  if (Number.isNaN(data.batchYield) || data.batchYield <= 0) throw new Error("Quantidade produzida inválida.");
  if (Number.isNaN(data.profitMargin) || data.profitMargin < 0) throw new Error("Margem de lucro inválida.");
  const r = await prisma.pricingRecipe.update({
    where: { id },
    data: {
      name: data.name.trim(),
      productId: data.productId || null,
      batchYield: data.batchYield,
      profitMargin: data.profitMargin,
      itemsJson: data.items as any,
      laborCost: data.laborCost || 0,
      packagingCost: data.packagingCost || 0,
      notes: data.notes || null,
    },
  });
  revalidatePath("/admin");
  return r;
}

export async function deleteRecipe(id: string) {
  await requireAdmin();
  const r = await prisma.pricingRecipe.delete({ where: { id } });
  revalidatePath("/admin");
  return r;
}

// BAGS (Sacolas de Presente)
export async function getBags() {
  return await prisma.bag.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getActiveBags() {
  return await prisma.bag.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createBag(data: {
  name: string;
  imageUrl?: string;
  amountPaid: number;
  quantity: number;
  margin: number;
  isActive?: boolean;
  notes?: string;
}) {
  await requireAdmin();
  const bag = await prisma.bag.create({ data });
  revalidatePath("/admin");
  revalidatePath("/presente");
  return bag;
}

export async function updateBag(id: string, data: {
  name?: string;
  imageUrl?: string | null;
  amountPaid?: number;
  quantity?: number;
  margin?: number;
  isActive?: boolean;
  notes?: string | null;
}) {
  await requireAdmin();
  const bag = await prisma.bag.update({ where: { id }, data });
  revalidatePath("/admin");
  revalidatePath("/presente");
  return bag;
}

export async function deleteBag(id: string) {
  await requireAdmin();
  const bag = await prisma.bag.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/presente");
  return bag;
}

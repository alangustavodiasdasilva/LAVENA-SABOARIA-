import type { Metadata } from "next";
import PricingManager from "@/components/admin/pricing-manager";
import { PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminProducts, getMaterials, getRecipes } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Precificação" };

export default async function PricingPage() {
  await requirePageAdmin();
  const [materials, recipes, products] = await Promise.all([getMaterials(), getRecipes(), getAdminProducts()]);
  return (
    <>
      <PageHeader title="Precificação" subtitle="Calcule o custo de cada sabonete e descubra o preço de venda certo. Isto é só para você, o cliente não vê." />
      <PricingManager materials={materials} recipes={recipes} products={products.map((p) => ({ id: p.id, name: p.name }))} />
    </>
  );
}

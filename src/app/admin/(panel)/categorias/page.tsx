import type { Metadata } from "next";
import CategoryManager from "@/components/admin/category-manager";
import { PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminCategories } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  await requirePageAdmin();
  const categories = await getAdminCategories();
  return (
    <>
      <PageHeader title="Categorias" subtitle="Organizam a loja em seções. Os clientes filtram por elas." />
      <CategoryManager categories={categories} />
    </>
  );
}

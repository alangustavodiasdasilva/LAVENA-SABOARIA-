import type { Metadata } from "next";
import ProductForm from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminCategories } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Novo produto" };

export default async function NewProductPage() {
  await requirePageAdmin();
  const categories = await getAdminCategories();
  return (
    <>
      <PageHeader back={{ href: "/admin/produtos", label: "Produtos" }} title="Novo produto" subtitle="Preencha as informações. Ele aparece na loja assim que você salvar." />
      <ProductForm categories={categories} />
    </>
  );
}
